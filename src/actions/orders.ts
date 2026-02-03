/**
 * @file: src/actions/orders.ts
 * @purpose: Server Actions para gestión de pedidos (US-07, US-08)
 * @goal: CRUD de pedidos con items, cálculo de totales y asignación a producción
 * @context: Módulo Comercial - Operaciones del servidor para pedidos
 */

'use server';

import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Order, OrderItem } from '@/types/database.types';

/**
 * Obtiene todos los pedidos con sus detalles
 */
export async function getOrders() {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      client:clients(*),
      items:order_items(
        *,
        product:products(*)
      ),
      production_day:production_days(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Obtiene pedidos por estado
 */
export async function getOrdersByStatus(status: string) {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      client:clients(*),
      items:order_items(
        *,
        product:products(*)
      )
    `)
    .eq('status', status)
    .order('delivery_date');

  if (error) {
    console.error('Error fetching orders by status:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Obtiene un pedido por ID con todos sus detalles
 */
export async function getOrderById(id: string) {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      client:clients(*),
      items:order_items(
        *,
        product:products(*)
      ),
      production_day:production_days(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Crea un nuevo pedido con sus items
 * AUDIT: Calcula el total automáticamente sumando los subtotales
 */
export async function createOrder(
  orderData: Partial<Order>,
  items: Array<{ product_id: string; quantity: number; unit_price_snapshot: number }>
) {
  const supabase = await createSupabaseClient();
  
  // 1. Calcular el total del pedido
  const totalAmount = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price_snapshot);
  }, 0);
  
  // 2. Crear el pedido
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{
      ...orderData,
      total_amount: totalAmount,
      status: 'pending'
    }])
    .select()
    .single();

  if (orderError || !order) {
    console.error('Error creating order:', orderError);
    return { data: null, error: orderError?.message || 'Error al crear pedido' };
  }

  // 3. Crear los items del pedido
  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price_snapshot: item.unit_price_snapshot
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    // Rollback: eliminar el pedido si fallan los items
    await supabase.from('orders').delete().eq('id', order.id);
    return { data: null, error: 'Error al crear items del pedido' };
  }

  revalidatePath('/comercial/pedidos');
  return { data: order, error: null };
}

/**
 * Actualiza un pedido existente
 */
export async function updateOrder(id: string, orderData: Partial<Order>) {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('orders')
    .update(orderData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating order:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/comercial/pedidos');
  revalidatePath(`/comercial/pedidos/${id}`);
  return { data, error: null };
}

/**
 * Cambia el estado de un pedido
 */
export async function updateOrderStatus(id: string, status: string) {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating order status:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/comercial/pedidos');
  return { data, error: null };
}

/**
 * Asigna un pedido a un día de producción
 * AUDIT: Cambia el estado a 'planned' automáticamente
 */
export async function assignOrderToProductionDay(orderId: string, productionDayId: string) {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('orders')
    .update({
      production_day_id: productionDayId,
      status: 'planned'
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error assigning order to production day:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/comercial/pedidos');
  revalidatePath('/planificacion');
  return { data, error: null };
}

/**
 * Elimina un pedido (solo si está en estado pending)
 */
export async function deleteOrder(id: string) {
  const supabase = await createSupabaseClient();
  
  // Verificar que el pedido esté en pending
  const { data: order } = await supabase
    .from('orders')
    .select('status')
    .eq('id', id)
    .single();

  if (order?.status !== 'pending') {
    return { success: false, error: 'Solo se pueden eliminar pedidos pendientes' };
  }

  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting order:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/comercial/pedidos');
  return { success: true, error: null };
}

/**
 * Obtiene pedidos pendientes (sin asignar a producción)
 */
export async function getPendingOrders() {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      client:clients(*),
      items:order_items(
        *,
        product:products(*)
      )
    `)
    .eq('status', 'pending')
    .is('production_day_id', null)
    .order('delivery_date');

  if (error) {
    console.error('Error fetching pending orders:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Obtiene pedidos por fecha de entrega
 */
export async function getOrdersByDeliveryDate(date: string) {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      client:clients(*),
      items:order_items(
        *,
        product:products(*)
      )
    `)
    .eq('delivery_date', date)
    .order('created_at');

  if (error) {
    console.error('Error fetching orders by delivery date:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
