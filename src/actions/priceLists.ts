/**
 * @file: src/actions/priceLists.ts
 * @purpose: Server Actions para gestión de listas de precios
 * @goal: CRUD de listas de precios y asignación de precios a productos
 * @context: Módulo Comercial - Listas de precios
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Obtiene todas las listas de precios
 */
export async function getPriceLists() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('price_lists')
    .select(`
      *,
      items:price_list_items(count)
    `)
    .order('name');

  if (error) {
    console.error('Error fetching price lists:', error);
    return { data: null, error: error.message };
  }

  // Transformar el conteo
  const transformedData = data?.map(list => ({
    ...list,
    product_count: list.items?.[0]?.count || 0,
  }));

  return { data: transformedData, error: null };
}

/**
 * Obtiene una lista de precios por ID con sus items
 */
export async function getPriceListById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('price_lists')
    .select(`
      *,
      items:price_list_items(
        *,
        product:products(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching price list:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Crea una nueva lista de precios
 */
export async function createPriceList(
  name: string,
  isActive: boolean = true,
  items: Array<{ product_id: string; price: number }> = []
) {
  const supabase = await createClient();
  
  // 1. Crear la lista
  const { data: priceList, error: listError } = await supabase
    .from('price_lists')
    .insert([{ name, is_active: isActive }])
    .select()
    .single();

  if (listError || !priceList) {
    console.error('Error creating price list:', listError);
    return { data: null, error: listError?.message || 'Error al crear lista' };
  }

  // 2. Crear los items de precios
  if (items.length > 0) {
    const itemData = items.map(item => ({
      price_list_id: priceList.id,
      product_id: item.product_id,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('price_list_items')
      .insert(itemData);

    if (itemsError) {
      console.error('Error creating price list items:', itemsError);
      // Rollback: eliminar lista
      await supabase.from('price_lists').delete().eq('id', priceList.id);
      return { data: null, error: 'Error al crear items de precios' };
    }
  }

  revalidatePath('/listas-precios');
  return { data: priceList, error: null };
}

/**
 * Actualiza una lista de precios existente
 */
export async function updatePriceList(
  id: string,
  name: string,
  isActive: boolean,
  items: Array<{ product_id: string; price: number }>
) {
  const supabase = await createClient();
  
  // 1. Actualizar la lista
  const { data: priceList, error: listError } = await supabase
    .from('price_lists')
    .update({ name, is_active: isActive })
    .eq('id', id)
    .select()
    .single();

  if (listError) {
    console.error('Error updating price list:', listError);
    return { data: null, error: listError.message };
  }

  // 2. Eliminar items existentes
  await supabase.from('price_list_items').delete().eq('price_list_id', id);

  // 3. Crear nuevos items
  if (items.length > 0) {
    const itemData = items.map(item => ({
      price_list_id: id,
      product_id: item.product_id,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('price_list_items')
      .insert(itemData);

    if (itemsError) {
      console.error('Error updating price list items:', itemsError);
      return { data: null, error: 'Error al actualizar items de precios' };
    }
  }

  revalidatePath('/listas-precios');
  revalidatePath(`/listas-precios/${id}`);
  return { data: priceList, error: null };
}

/**
 * Activa/Desactiva una lista de precios
 */
export async function togglePriceListStatus(id: string, isActive: boolean) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('price_lists')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) {
    console.error('Error toggling price list status:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/listas-precios');
  return { success: true, error: null };
}

/**
 * Elimina una lista de precios
 */
export async function deletePriceList(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('price_lists')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting price list:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/listas-precios');
  return { success: true, error: null };
}

/**
 * Obtiene el precio de un producto en una lista específica
 */
export async function getProductPriceInList(productId: string, priceListId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('price_list_items')
    .select('price')
    .eq('product_id', productId)
    .eq('price_list_id', priceListId)
    .single();

  if (error) {
    return { price: null, error: error.message };
  }

  return { price: data?.price || null, error: null };
}
