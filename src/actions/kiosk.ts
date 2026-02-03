/**
 * @file: src/actions/kiosk.ts
 * @purpose: Server Actions para el kiosco de panaderos (US-11, BR-04)
 * @goal: Gestión de lotes en producción, cronómetros y triggers temporales
 * @context: Módulo Kiosco - Operaciones del servidor
 */

'use server';

import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Obtiene los lotes del día publicado actual para el kiosco
 */
export async function getTodayBatchesForKiosk() {
  const supabase = await createSupabaseClient();
  
  // Obtener el día de producción publicado de hoy
  const today = new Date().toISOString().split('T')[0];
  
  const { data: productionDay, error: dayError } = await supabase
    .from('production_days')
    .select('id')
    .eq('production_date', today)
    .eq('status', 'published')
    .single();

  if (dayError || !productionDay) {
    return { data: null, error: 'No hay día de producción publicado para hoy' };
  }

  // Obtener los lotes con sus fases
  const { data: batches, error } = await supabase
    .from('production_batches')
    .select(`
      *,
      product:products(*),
      phases:batch_phases(
        *,
        phase:production_phases(*)
      )
    `)
    .eq('production_day_id', productionDay.id)
    .order('created_at');

  if (error) {
    console.error('Error fetching batches for kiosk:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/kiosco');
  return { data: batches, error: null };
}

/**
 * Inicia un lote (cambia estado a in_progress)
 */
export async function startBatch(batchId: string) {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('production_batches')
    .update({ 
      status: 'in_progress',
      started_at: new Date().toISOString()
    })
    .eq('id', batchId)
    .select()
    .single();

  if (error) {
    console.error('Error starting batch:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/kiosco');
  return { data, error: null };
}

/**
 * Completa un lote (cambia estado a completed)
 */
export async function completeBatch(batchId: string) {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('production_batches')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', batchId)
    .select()
    .single();

  if (error) {
    console.error('Error completing batch:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/kiosco');
  return { data, error: null };
}

/**
 * BR-04: Inicia una fase de un lote con cronómetro
 */
export async function startBatchPhase(batchId: string, phaseId: string) {
  const supabase = await createSupabaseClient();
  
  // Verificar si ya existe un registro de fase para este lote
  const { data: existing } = await supabase
    .from('batch_phases')
    .select('*')
    .eq('batch_id', batchId)
    .eq('phase_id', phaseId)
    .single();

  if (existing) {
    // Actualizar fase existente
    const { data, error } = await supabase
      .from('batch_phases')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    
    revalidatePath('/kiosco');
    return { data, error: null };
  } else {
    // Crear nueva fase
    const { data, error } = await supabase
      .from('batch_phases')
      .insert([{
        batch_id: batchId,
        phase_id: phaseId,
        status: 'in_progress',
        started_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    
    revalidatePath('/kiosco');
    return { data, error: null };
  }
}

/**
 * Completa una fase de un lote
 */
export async function completeBatchPhase(batchPhaseId: string) {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('batch_phases')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', batchPhaseId)
    .select()
    .single();

  if (error) {
    console.error('Error completing batch phase:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/kiosco');
  return { data, error: null };
}

/**
 * Obtiene las fases de producción disponibles
 */
export async function getProductionPhases() {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('production_phases')
    .select('*')
    .order('order_index');

  if (error) {
    console.error('Error fetching production phases:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * BR-04: Obtiene triggers activos para una fase
 * Calcula si un trigger debe mostrarse según el tiempo transcurrido
 */
export async function getActiveTriggersForPhase(
  batchPhaseId: string,
  elapsedMinutes: number
) {
  const supabase = await createSupabaseClient();
  
  // Obtener la fase del lote
  const { data: batchPhase } = await supabase
    .from('batch_phases')
    .select('phase_id')
    .eq('id', batchPhaseId)
    .single();

  if (!batchPhase) {
    return { data: [], error: null };
  }

  // Obtener triggers de la fase
  const { data: triggers, error } = await supabase
    .from('phase_triggers')
    .select('*')
    .eq('phase_id', batchPhase.phase_id)
    .lte('trigger_at_minutes', elapsedMinutes)
    .order('trigger_at_minutes');

  if (error) {
    console.error('Error fetching triggers:', error);
    return { data: null, error: error.message };
  }

  // Filtrar triggers que deben mostrarse
  const activeTriggers = triggers?.filter(trigger => {
    // Un trigger se muestra si el tiempo transcurrido está en su ventana
    return elapsedMinutes >= trigger.trigger_at_minutes;
  }) || [];

  return { data: activeTriggers, error: null };
}

/**
 * Marca un trigger como completado/visto
 */
export async function acknowledgeTrigger(batchPhaseId: string, triggerId: string) {
  const supabase = await createSupabaseClient();
  
  // Registrar que el trigger fue visto/completado
  const { error } = await supabase
    .from('batch_phase_trigger_logs')
    .insert([{
      batch_phase_id: batchPhaseId,
      trigger_id: triggerId,
      acknowledged_at: new Date().toISOString()
    }]);

  if (error) {
    console.error('Error acknowledging trigger:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/kiosco');
  return { success: true, error: null };
}
