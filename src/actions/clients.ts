/**
 * @file: src/actions/clients.ts
 * @purpose: Server Actions para gestión de clientes B2B
 * @goal: CRUD de clientes con datos fiscales opcionales (US-06, BR-07)
 * @context: Módulo Comercial - Operaciones del servidor
 */

'use server';

import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Client } from '@/types/database.types';

/**
 * Obtiene todos los clientes activos
 */
export async function getClients() {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      price_list:price_lists(*)
    `)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching clients:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Obtiene un cliente por ID
 */
export async function getClientById(id: string) {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      price_list:price_lists(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching client:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Crea un nuevo cliente
 * BR-07: Datos fiscales son opcionales según toggle requires_invoice
 */
export async function createClient(formData: Partial<Client>) {
  const supabase = await createSupabaseClient();
  
  // AUDIT: Si requires_invoice es false, limpiamos los datos fiscales
  const clientData = {
    ...formData,
    tax_id: formData.requires_invoice ? formData.tax_id : null,
    tax_name: formData.requires_invoice ? formData.tax_name : null,
    tax_regime: formData.requires_invoice ? formData.tax_regime : null,
    tax_address: formData.requires_invoice ? formData.tax_address : null,
    tax_zip_code: formData.requires_invoice ? formData.tax_zip_code : null,
    cfdi_use: formData.requires_invoice ? formData.cfdi_use : null,
  };
  
  const { data, error } = await supabase
    .from('clients')
    .insert([clientData])
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/comercial/clientes');
  return { data, error: null };
}

/**
 * Actualiza un cliente existente
 */
export async function updateClient(id: string, formData: Partial<Client>) {
  const supabase = await createSupabaseClient();
  
  // AUDIT: Si requires_invoice es false, limpiamos los datos fiscales
  const clientData = {
    ...formData,
    tax_id: formData.requires_invoice ? formData.tax_id : null,
    tax_name: formData.requires_invoice ? formData.tax_name : null,
    tax_regime: formData.requires_invoice ? formData.tax_regime : null,
    tax_address: formData.requires_invoice ? formData.tax_address : null,
    tax_zip_code: formData.requires_invoice ? formData.tax_zip_code : null,
    cfdi_use: formData.requires_invoice ? formData.cfdi_use : null,
  };
  
  const { data, error } = await supabase
    .from('clients')
    .update(clientData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/comercial/clientes');
  revalidatePath(`/comercial/clientes/${id}`);
  return { data, error: null };
}

/**
 * Desactiva un cliente (soft delete)
 */
export async function deactivateClient(id: string) {
  const supabase = await createSupabaseClient();
  
  const { error } = await supabase
    .from('clients')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deactivating client:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/comercial/clientes');
  return { success: true, error: null };
}

/**
 * Reactiva un cliente
 */
export async function activateClient(id: string) {
  const supabase = await createSupabaseClient();
  
  const { error } = await supabase
    .from('clients')
    .update({ is_active: true })
    .eq('id', id);

  if (error) {
    console.error('Error activating client:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/comercial/clientes');
  return { success: true, error: null };
}

/**
 * Obtiene las listas de precios disponibles
 */
export async function getPriceLists() {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('price_lists')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching price lists:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Busca clientes por nombre o contacto
 */
export async function searchClients(query: string) {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      price_list:price_lists(*)
    `)
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,contact_name.ilike.%${query}%`)
    .order('name')
    .limit(10);

  if (error) {
    console.error('Error searching clients:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
