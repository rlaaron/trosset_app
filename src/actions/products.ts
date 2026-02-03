/**
 * @file: src/actions/products.ts
 * @purpose: Server Actions para gestión de productos
 * @goal: CRUD de productos, recetas y variantes (US-04)
 * @context: Módulo Inventarios - Operaciones del servidor para productos
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Product, ProductRecipe, ProductionPhase, PhaseTrigger } from '@/types/database.types';

/**
 * Obtiene todos los productos activos con sus recetas
 */
export async function getProducts() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      recipes:product_recipes(
        *,
        inventory_item:inventory_items(*)
      ),
      phases:production_phases(*)
    `)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching products:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Obtiene un producto por ID con recetas y fases
 */
export async function getProductById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      recipes:product_recipes(
        *,
        inventory_item:inventory_items(*)
      ),
      phases:production_phases(
        *,
        triggers:phase_triggers(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Crea un nuevo producto con receta, fases y triggers (acciones internas)
 */
export async function createProduct(
  productData: Partial<Product>,
  recipes: Array<{ inventory_item_id: string; quantity: number; unit?: string }>,
  phases: Array<{
    name: string;
    sequence_order: number;
    estimated_duration_minutes?: number;
    triggers?: Array<{
      trigger_time_seconds: number;
      type: string;
      instruction_text: string;
    }>;
  }>
) {
  const supabase = await createClient();
  
  // 1. Crear el producto
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert([{
      ...productData,
      is_active: true
    }])
    .select()
    .single();

  if (productError || !product) {
    console.error('Error creating product:', productError);
    return { data: null, error: productError?.message || 'Error al crear producto' };
  }

  // 2. Crear las recetas (ingredientes)
  if (recipes.length > 0) {
    const recipeData = recipes.map(r => ({
      product_id: product.id,
      inventory_item_id: r.inventory_item_id,
      quantity: r.quantity,
      unit: r.unit || 'g'
    }));

    const { error: recipeError } = await supabase
      .from('product_recipes')
      .insert(recipeData);

    if (recipeError) {
      console.error('Error creating recipes:', recipeError);
      // Rollback: eliminar producto
      await supabase.from('products').delete().eq('id', product.id);
      return { data: null, error: 'Error al crear receta' };
    }
  }

  // 3. Crear las fases de producción y sus triggers
  if (phases.length > 0) {
    for (const phase of phases) {
      // Crear la fase
      const { data: createdPhase, error: phaseError } = await supabase
        .from('production_phases')
        .insert([{
          product_id: product.id,
          name: phase.name,
          sequence_order: phase.sequence_order,
          estimated_duration_minutes: phase.estimated_duration_minutes
        }])
        .select()
        .single();

      if (phaseError || !createdPhase) {
        console.error('Error creating phase:', phaseError);
        // Rollback: eliminar producto y recetas
        await supabase.from('products').delete().eq('id', product.id);
        return { data: null, error: 'Error al crear fases' };
      }

      // Crear los triggers (acciones internas) de esta fase
      if (phase.triggers && phase.triggers.length > 0) {
        const triggerData = phase.triggers.map(t => ({
          phase_id: createdPhase.id,
          trigger_time_seconds: t.trigger_time_seconds,
          type: t.type,
          instruction_text: t.instruction_text
        }));

        const { error: triggerError } = await supabase
          .from('phase_triggers')
          .insert(triggerData);

        if (triggerError) {
          console.error('Error creating phase triggers:', triggerError);
          // Continuamos aunque falle un trigger, pero logueamos el error
        }
      }
    }
  }

  revalidatePath('/inventarios/productos');
  return { data: product, error: null };
}

/**
 * Actualiza un producto existente con recetas, fases y triggers
 */
export async function updateProduct(
  id: string,
  productData: Partial<Product>,
  recipes?: Array<{ inventory_item_id: string; quantity: number; unit?: string }>,
  phases?: Array<{
    name: string;
    sequence_order: number;
    estimated_duration_minutes?: number;
    triggers?: Array<{
      trigger_time_seconds: number;
      type: string;
      instruction_text: string;
    }>;
  }>
) {
  const supabase = await createClient();
  
  // 1. Actualizar el producto
  const { data: product, error: productError } = await supabase
    .from('products')
    .update(productData)
    .eq('id', id)
    .select()
    .single();

  if (productError) {
    console.error('Error updating product:', productError);
    return { data: null, error: productError.message };
  }

  // 2. Actualizar recetas si se proporcionaron
  if (recipes) {
    // Eliminar recetas existentes
    await supabase.from('product_recipes').delete().eq('product_id', id);
    
    // Crear nuevas recetas
    if (recipes.length > 0) {
      const recipeData = recipes.map(r => ({
        product_id: id,
        inventory_item_id: r.inventory_item_id,
        quantity: r.quantity,
        unit: r.unit || 'g'
      }));

      const { error: recipeError } = await supabase
        .from('product_recipes')
        .insert(recipeData);

      if (recipeError) {
        console.error('Error updating recipes:', recipeError);
        return { data: null, error: 'Error al actualizar receta' };
      }
    }
  }

  // 3. Actualizar fases y triggers si se proporcionaron
  if (phases) {
    // Eliminar fases existentes (cascade eliminará los triggers)
    await supabase.from('production_phases').delete().eq('product_id', id);
    
    // Crear nuevas fases con sus triggers
    if (phases.length > 0) {
      for (const phase of phases) {
        const { data: createdPhase, error: phaseError } = await supabase
        .from('production_phases')
        .insert([{
          product_id: id,
          name: phase.name,
          sequence_order: phase.sequence_order,
          estimated_duration_minutes: phase.estimated_duration_minutes
        }])
        .select()
        .single();

        if (phaseError || !createdPhase) {
          console.error('Error creating phase:', phaseError);
          return { data: null, error: 'Error al actualizar fases' };
        }

        // Crear los triggers de esta fase
        if (phase.triggers && phase.triggers.length > 0) {
          const triggerData = phase.triggers.map(t => ({
            phase_id: createdPhase.id,
            trigger_time_seconds: t.trigger_time_seconds,
            type: t.type,
            instruction_text: t.instruction_text
          }));

          await supabase.from('phase_triggers').insert(triggerData);
        }
      }
    }
  }

  revalidatePath('/inventarios/productos');
  revalidatePath(`/inventarios/productos/${id}`);
  return { data: product, error: null };
}

/**
 * Desactiva un producto (soft delete)
 */
export async function deactivateProduct(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deactivating product:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/inventarios/productos');
  return { success: true, error: null };
}

/**
 * Reactiva un producto
 */
export async function activateProduct(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('products')
    .update({ is_active: true })
    .eq('id', id);

  if (error) {
    console.error('Error activating product:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/inventarios/productos');
  return { success: true, error: null };
}

/**
 * Obtiene productos para selector (solo nombre e ID)
 */
export async function getProductsForSelect() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select('id, name, batch_size_units')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching products for select:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Busca productos por nombre
 */
export async function searchProducts(query: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select('id, name, batch_size_units')
    .eq('is_active', true)
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(10);

  if (error) {
    console.error('Error searching products:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Agrega un trigger a una fase
 */
export async function addPhaseTrigger(
  phaseId: string,
  triggerData: Partial<PhaseTrigger>
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('phase_triggers')
    .insert([{
      ...triggerData,
      phase_id: phaseId
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating phase trigger:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Elimina un trigger de fase
 */
export async function deletePhaseTrigger(triggerId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('phase_triggers')
    .delete()
    .eq('id', triggerId);

  if (error) {
    console.error('Error deleting phase trigger:', error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
