/**
 * @file: src/actions/inventory.ts
 * @purpose: Server Actions para gestión de inventario de insumos
 * @goal: CRUD de insumos, movimientos de stock y gestión de mezclas (US-03, US-05, BR-06)
 * @context: Módulo Inventarios - Operaciones del servidor
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { InventoryItem, StockMovement } from '@/types/database.types';

/**
 * Obtiene todos los insumos con sus categorías
 */
export async function getInventoryItems() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('inventory_items')
    .select(`
      *,
      category:inventory_categories(*)
    `)
    .order('name');

  if (error) {
    console.error('Error fetching inventory items:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Obtiene un insumo por ID con su composición si es compuesto
 */
export async function getInventoryItemById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('inventory_items')
    .select(`
      *,
      category:inventory_categories(*),
      compositions:item_compositions!item_compositions_parent_item_id_fkey(
        *,
        ingredient:inventory_items!item_compositions_ingredient_item_id_fkey(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching inventory item:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Crea un nuevo insumo
 */
export async function createInventoryItem(formData: Partial<InventoryItem>) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('inventory_items')
    .insert([formData])
    .select()
    .single();

  if (error) {
    console.error('Error creating inventory item:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/inventarios/insumos');
  return { data, error: null };
}

/**
 * Actualiza un insumo existente
 */
export async function updateInventoryItem(id: string, formData: Partial<InventoryItem>) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('inventory_items')
    .update(formData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating inventory item:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/inventarios/insumos');
  revalidatePath(`/inventarios/insumos/${id}`);
  return { data, error: null };
}

/**
 * Elimina un insumo
 */
export async function deleteInventoryItem(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting inventory item:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/inventarios/insumos');
  return { success: true, error: null };
}

/**
 * Registra un movimiento de stock y actualiza el stock actual del insumo
 */
export async function createStockMovement(movement: Partial<StockMovement>) {
  const supabase = await createClient();
  
  // 1. Obtener el stock actual
  const { data: itemData, error: itemError } = await supabase
    .from('inventory_items')
    .select('current_stock')
    .eq('id', movement.item_id)
    .single();

  if (itemError) {
    console.error('Error fetching item stock:', itemError);
    return { data: null, error: itemError.message };
  }

  // 2. Calcular nuevo stock
  const currentStock = itemData?.current_stock || 0;
  const qtyChange = movement.qty_change || 0;
  const newStock = currentStock + qtyChange;

  if (newStock < 0) {
    return { data: null, error: 'El stock no puede quedar negativo' };
  }

  // 3. Registrar el movimiento
  const { data: movementData, error: movementError } = await supabase
    .from('stock_movements')
    .insert([movement])
    .select()
    .single();

  if (movementError) {
    console.error('Error creating stock movement:', movementError);
    return { data: null, error: movementError.message };
  }

  // 4. Actualizar el stock del insumo directamente
  const { error: updateError } = await supabase
    .from('inventory_items')
    .update({ current_stock: newStock })
    .eq('id', movement.item_id);

  if (updateError) {
    console.error('Error updating stock:', updateError);
    return { data: null, error: updateError.message };
  }

  revalidatePath('/inventarios/insumos');
  return { data: movementData, error: null };
}

/**
 * BR-06: Crea stock de un insumo compuesto (mezcla)
 * Descuenta los ingredientes y aumenta el stock del compuesto
 */
export async function createCompoundStock(
  compoundItemId: string,
  quantityProduced: number,
  userId: string
) {
  const supabase = await createClient();
  
  // 1. Obtener la composición del insumo compuesto
  const { data: compositions, error: compError } = await supabase
    .from('item_compositions')
    .select('*, ingredient:inventory_items(*)')
    .eq('parent_item_id', compoundItemId);

  if (compError || !compositions) {
    return { success: false, error: 'No se pudo obtener la composición' };
  }

  // 2. Descontar cada ingrediente
  for (const comp of compositions) {
    const qtyNeeded = comp.quantity_needed * quantityProduced;
    
    await supabase.from('stock_movements').insert({
      item_id: comp.ingredient_item_id,
      qty_change: -qtyNeeded,
      move_type: 'production_usage',
      notes: `Usado para producir ${quantityProduced} de mezcla`,
      created_by: userId
    });
  }

  // 3. Aumentar stock del compuesto
  await supabase.from('stock_movements').insert({
    item_id: compoundItemId,
    qty_change: quantityProduced,
    move_type: 'adjustment',
    notes: `Producción de mezcla`,
    created_by: userId
  });

  revalidatePath('/inventarios/insumos');
  return { success: true, error: null };
}

/**
 * Crea las composiciones para un insumo compuesto (BR-06)
 */
export async function createItemCompositions(
  parentItemId: string,
  compositions: Array<{ ingredient_item_id: string; quantity_needed: number }>
) {
  const supabase = await createClient();
  
  const compositionData = compositions.map(comp => ({
    parent_item_id: parentItemId,
    ingredient_item_id: comp.ingredient_item_id,
    quantity_needed: comp.quantity_needed,
  }));

  const { error } = await supabase
    .from('item_compositions')
    .insert(compositionData);

  if (error) {
    console.error('Error creating compositions:', error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Obtiene las categorías de inventario
 */
export async function getInventoryCategories() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('inventory_categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Obtiene insumos con stock bajo (US-05)
 */
export async function getLowStockItems() {
  const supabase = await createClient();
  
  // AUDIT: Filtramos insumos donde current_stock < min_stock_threshold
  // Usamos una query manual ya que Supabase no soporta comparación entre columnas directamente
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*, category:inventory_categories(*)')
    .order('current_stock');

  if (error) {
    console.error('Error fetching low stock items:', error);
    return { data: null, error: error.message };
  }

  // Filtrar en el cliente los items con stock bajo
  const lowStockData = data?.filter(item => item.current_stock < item.min_stock_threshold) || [];

  return { data: lowStockData, error: null };
}
