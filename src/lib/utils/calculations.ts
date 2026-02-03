/**
 * @file: src/lib/utils/calculations.ts
 * @purpose: Funciones de cálculo para lotes, costos y stock
 * @goal: Implementar reglas de negocio BR-02 (Lotes) y BR-05 (Costos de variantes)
 * @context: Lógica de negocio crítica - Cálculos de producción y costeo
 */

import type { ProductVariant } from '@/types/database.types';

/**
 * BR-02: Calcula la cantidad de lotes necesarios sin redondear hacia arriba
 * El último lote puede tener menos unidades que el batch size
 * 
 * @param totalUnits - Total de unidades a producir
 * @param batchSize - Capacidad máxima de la maquinaria
 * @returns Array de lotes con sus cantidades
 * 
 * @example
 * calculateBatches(65, 20) // Returns: [20, 20, 20, 5]
 * calculateBatches(40, 20) // Returns: [20, 20]
 */
export function calculateBatches(totalUnits: number, batchSize: number): number[] {
  if (totalUnits <= 0 || batchSize <= 0) return [];
  
  const batches: number[] = [];
  let remaining = totalUnits;
  
  while (remaining > 0) {
    const batchUnits = Math.min(remaining, batchSize);
    batches.push(batchUnits);
    remaining -= batchUnits;
  }
  
  return batches;
}

/**
 * Calcula el número total de lotes
 * 
 * @param totalUnits - Total de unidades a producir
 * @param batchSize - Capacidad máxima de la maquinaria
 * @returns Número de lotes
 */
export function calculateBatchCount(totalUnits: number, batchSize: number): number {
  if (totalUnits <= 0 || batchSize <= 0) return 0;
  return Math.ceil(totalUnits / batchSize);
}

/**
 * BR-05: Calcula el costo de una variante
 * Costo Variante = Costo Base + Costo Ingredientes Adicionales
 * 
 * @param baseCost - Costo de la receta base del producto maestro
 * @param variant - Objeto de variante con ingredientes extra
 * @param ingredientCosts - Map de item_id a costo por unidad
 * @returns Costo total de la variante
 */
export function calculateVariantCost(
  baseCost: number,
  variant: ProductVariant,
  ingredientCosts: Map<string, number>
): number {
  let extraCost = 0;
  
  for (const ingredient of variant.extra_ingredients) {
    const costPerUnit = ingredientCosts.get(ingredient.item_id) || 0;
    extraCost += costPerUnit * ingredient.qty;
  }
  
  return baseCost + extraCost;
}

/**
 * Calcula el costo total de una receta (suma de todos los ingredientes)
 * 
 * @param ingredients - Array de ingredientes con cantidad y costo
 * @returns Costo total de la receta
 */
export function calculateRecipeCost(
  ingredients: Array<{ quantity: number; cost_per_unit: number }>
): number {
  return ingredients.reduce((total, ing) => {
    return total + (ing.quantity * ing.cost_per_unit);
  }, 0);
}

/**
 * Calcula el costo por lote (batch)
 * 
 * @param costPerUnit - Costo de una unidad del producto
 * @param batchSize - Cantidad de unidades en el lote
 * @returns Costo total del lote
 */
export function calculateBatchCost(costPerUnit: number, batchSize: number): number {
  return costPerUnit * batchSize;
}

/**
 * Calcula el nivel de stock como porcentaje
 * 
 * @param currentStock - Stock actual
 * @param minThreshold - Punto de reorden
 * @param idealStock - Stock ideal (opcional)
 * @returns Porcentaje de stock (0-100)
 */
export function calculateStockLevel(
  currentStock: number,
  minThreshold: number,
  idealStock?: number
): number {
  const reference = idealStock || minThreshold * 2;
  return Math.min(100, (currentStock / reference) * 100);
}

/**
 * Determina el estado del stock basado en umbrales
 * 
 * @param currentStock - Stock actual
 * @param minThreshold - Punto de reorden
 * @returns Estado: 'ok' | 'low' | 'critical' | 'out'
 */
export function getStockStatus(
  currentStock: number,
  minThreshold: number
): 'ok' | 'low' | 'critical' | 'out' {
  if (currentStock <= 0) return 'out';
  if (currentStock < minThreshold * 0.5) return 'critical';
  if (currentStock < minThreshold) return 'low';
  return 'ok';
}

/**
 * Convierte unidades de compra a unidades de uso
 * Ejemplo: 44 kg (compra) -> 44,000 g (uso)
 * 
 * @param purchaseQty - Cantidad en unidad de compra
 * @param conversionFactor - Factor de conversión (ej: 1 kg = 1000 g)
 * @returns Cantidad en unidad de uso
 */
export function convertPurchaseToUsage(
  purchaseQty: number,
  conversionFactor: number
): number {
  return purchaseQty * conversionFactor;
}

/**
 * Calcula el costo unitario resultante de una compra
 * Ejemplo: $450 por 44 kg = $0.0102 por gramo
 * 
 * @param totalCost - Costo total de la compra
 * @param purchaseQty - Cantidad comprada
 * @param conversionFactor - Factor de conversión a unidad de uso
 * @returns Costo por unidad de uso
 */
export function calculateUnitCost(
  totalCost: number,
  purchaseQty: number,
  conversionFactor: number
): number {
  const totalUsageUnits = convertPurchaseToUsage(purchaseQty, conversionFactor);
  return totalCost / totalUsageUnits;
}

/**
 * Calcula el margen de ganancia
 * 
 * @param sellingPrice - Precio de venta
 * @param cost - Costo del producto
 * @returns Porcentaje de margen
 */
export function calculateMargin(sellingPrice: number, cost: number): number {
  if (sellingPrice === 0) return 0;
  return ((sellingPrice - cost) / sellingPrice) * 100;
}

/**
 * Calcula el tiempo transcurrido desde un timestamp
 * Útil para cronómetros persistentes (BR-04)
 * 
 * @param startedAt - Timestamp de inicio (ISO string)
 * @returns Segundos transcurridos
 */
export function calculateElapsedTime(startedAt: string): number {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  return Math.floor((now - start) / 1000);
}
