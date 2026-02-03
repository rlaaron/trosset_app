/**
 * @file: src/actions/planning.ts
 * @purpose: Server Actions para planificación de producción (US-09, US-10, BR-02, BR-03)
 * @goal: Gestión de días de producción, cálculo de lotes y consolidación de insumos
 * @context: Módulo Planificación - Operaciones del servidor
 */

'use server';

import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { calculateBatches } from '@/lib/utils/calculations';
import type { ProductionDay } from '@/types/database.types';

/**
 * Obtiene todos los días de producción
 */
export async function getProductionDays() {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('production_days')
    .select(`
      *,
      orders:orders(
        *,
        client:clients(*),
        items:order_items(
          *,
          product:products(*)
        )
      )
    `)
    .order('production_date', { ascending: false });

  if (error) {
    console.error('Error fetching production days:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Obtiene un día de producción por ID con todos sus detalles
 */
export async function getProductionDayById(id: string) {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('production_days')
    .select(`
      *,
      orders:orders(
        *,
        client:clients(*),
        items:order_items(
          *,
          product:products(*)
        )
      ),
      batches:production_batches(
        *,
        product:products(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching production day:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Crea un nuevo día de producción
 */
export async function createProductionDay(data: Partial<ProductionDay>) {
  const supabase = await createSupabaseClient();
  
  const { data: productionDay, error } = await supabase
    .from('production_days')
    .insert([{
      ...data,
      status: 'draft'
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating production day:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/planificacion');
  return { data: productionDay, error: null };
}

/**
 * BR-02 y BR-03: Calcula y crea lotes de producción para un día
 * Consolida todos los pedidos y calcula lotes sin redondear hacia arriba
 */
export async function calculateAndCreateBatches(productionDayId: string) {
  const supabase = await createSupabaseClient();
  
  // 1. Obtener todos los pedidos del día de producción
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(
        *,
        product:products(*)
      )
    `)
    .eq('production_day_id', productionDayId);

  if (ordersError || !orders) {
    return { success: false, error: 'No se pudieron obtener los pedidos' };
  }

  // 2. Consolidar productos (sumar cantidades por producto)
  const productQuantities = new Map<string, { product_id: string; total: number; batch_size: number }>();
  
  for (const order of orders) {
    for (const item of order.items || []) {
      const productId = item.product_id;
      const existing = productQuantities.get(productId);
      
      if (existing) {
        existing.total += item.quantity;
      } else {
        productQuantities.set(productId, {
          product_id: productId,
          total: item.quantity,
          batch_size: item.product?.batch_size_units || 1
        });
      }
    }
  }

  // 3. Calcular lotes para cada producto (BR-02)
  const batchesToCreate: Array<{
    production_day_id: string;
    product_id: string;
    batch_number: number;
    total_units_in_batch: number;
    status: string;
  }> = [];
  
  for (const [productId, data] of Array.from(productQuantities)) {
    const batches = calculateBatches(data.total, data.batch_size);
    
    // Crear un registro de lote por cada batch calculado
    batches.forEach((batchUnits, index) => {
      batchesToCreate.push({
        production_day_id: productionDayId,
        product_id: productId,
        batch_number: index + 1,
        total_units_in_batch: batchUnits,
        status: 'pending'
      });
    });
  }

  // 4. Insertar los lotes en la base de datos
  if (batchesToCreate.length > 0) {
    const { error: batchError } = await supabase
      .from('production_batches')
      .insert(batchesToCreate);

    if (batchError) {
      console.error('Error creating batches:', batchError);
      return { success: false, error: 'Error al crear lotes' };
    }
  }

  revalidatePath('/planificacion');
  return { success: true, batchesCreated: batchesToCreate.length, error: null };
}

/**
 * BR-03: Consolida los insumos necesarios para un día de producción
 * Calcula la cantidad total de cada insumo necesario
 */
export async function consolidateIngredients(productionDayId: string) {
  const supabase = await createSupabaseClient();
  
  // 1. Obtener todos los lotes del día
  const { data: batches, error: batchesError } = await supabase
    .from('production_batches')
    .select(`
      *,
      product:products(
        *,
        recipes:product_recipes(
          *,
          inventory_item:inventory_items(*)
        )
      )
    `)
    .eq('production_day_id', productionDayId);

  if (batchesError || !batches) {
    return { data: null, error: 'No se pudieron obtener los lotes' };
  }

  // 2. Consolidar insumos
  const ingredientTotals = new Map<string, {
    item_id: string;
    name: string;
    unit: string;
    total_needed: number;
    current_stock: number;
  }>();

  for (const batch of batches) {
    const recipes = batch.product?.recipes || [];
    
    for (const recipe of recipes) {
      const itemId = recipe.inventory_item_id;
      const quantityPerUnit = recipe.quantity;
      const totalNeeded = quantityPerUnit * batch.total_units_in_batch;
      
      const existing = ingredientTotals.get(itemId);
      
      if (existing) {
        existing.total_needed += totalNeeded;
      } else {
        ingredientTotals.set(itemId, {
          item_id: itemId,
          name: recipe.inventory_item?.name || 'Desconocido',
          unit: recipe.inventory_item?.unit_usage || '',
          total_needed: totalNeeded,
          current_stock: recipe.inventory_item?.current_stock || 0
        });
      }
    }
  }

  // 3. Convertir a array y calcular faltantes
  const consolidatedIngredients = Array.from(ingredientTotals.values()).map(item => ({
    ...item,
    missing: Math.max(0, item.total_needed - item.current_stock),
    has_enough: item.current_stock >= item.total_needed
  }));

  return { data: consolidatedIngredients, error: null };
}

/**
 * Publica un día de producción (cambia estado a published)
 */
export async function publishProductionDay(id: string) {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('production_days')
    .update({ status: 'published' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error publishing production day:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/planificacion');
  revalidatePath('/kiosco');
  return { data, error: null };
}

/**
 * Cierra un día de producción (cambia estado a closed)
 */
export async function closeProductionDay(id: string) {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('production_days')
    .update({ status: 'closed' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error closing production day:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/planificacion');
  return { data, error: null };
}

/**
 * Obtiene días de producción por estado
 */
export async function getProductionDaysByStatus(status: string) {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('production_days')
    .select(`
      *,
      orders:orders(count)
    `)
    .eq('status', status)
    .order('production_date', { ascending: false });

  if (error) {
    console.error('Error fetching production days by status:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
