/**
 * @file: src/lib/utils/unitConversions.ts
 * @purpose: Utilidades para conversión de unidades de medida
 * @goal: Convertir entre diferentes unidades (kg↔g↔mg, L↔ml)
 * @context: Módulos de Inventarios y Recetas
 */

// Tipos de unidades soportadas
export type WeightUnit = 'kg' | 'g' | 'mg';
export type VolumeUnit = 'L' | 'ml';
export type PieceUnit = 'pz' | 'bulto' | 'caja' | 'saco';
export type UnitType = WeightUnit | VolumeUnit | PieceUnit;

// Factores de conversión a unidad base (kg para peso, L para volumen)
const CONVERSION_FACTORS: Record<UnitType, number> = {
  // Peso - base: kg
  'kg': 1,
  'g': 0.001,
  'mg': 0.000001,
  // Volumen - base: L
  'L': 1,
  'ml': 0.001,
  // Piezas - no convertibles
  'pz': 1,
  'bulto': 1,
  'caja': 1,
  'saco': 1,
};

// Grupos de unidades compatibles
export const WEIGHT_UNITS: WeightUnit[] = ['kg', 'g', 'mg'];
export const VOLUME_UNITS: VolumeUnit[] = ['L', 'ml'];
export const PIECE_UNITS: PieceUnit[] = ['pz', 'bulto', 'caja', 'saco'];

// Todas las unidades en dropdown
export const ALL_UNITS: { value: UnitType; label: string; group: string }[] = [
  { value: 'kg', label: 'Kilogramos (kg)', group: 'Peso' },
  { value: 'g', label: 'Gramos (g)', group: 'Peso' },
  { value: 'mg', label: 'Miligramos (mg)', group: 'Peso' },
  { value: 'L', label: 'Litros (L)', group: 'Volumen' },
  { value: 'ml', label: 'Mililitros (ml)', group: 'Volumen' },
  { value: 'pz', label: 'Piezas (pz)', group: 'Unidades' },
  { value: 'bulto', label: 'Bulto', group: 'Empaque' },
  { value: 'caja', label: 'Caja', group: 'Empaque' },
  { value: 'saco', label: 'Saco', group: 'Empaque' },
];

/**
 * Verifica si dos unidades son del mismo tipo (compatibles para conversión)
 */
export function areUnitsCompatible(unit1: UnitType, unit2: UnitType): boolean {
  const isWeight1 = WEIGHT_UNITS.includes(unit1 as WeightUnit);
  const isWeight2 = WEIGHT_UNITS.includes(unit2 as WeightUnit);
  const isVolume1 = VOLUME_UNITS.includes(unit1 as VolumeUnit);
  const isVolume2 = VOLUME_UNITS.includes(unit2 as VolumeUnit);
  
  return (isWeight1 && isWeight2) || (isVolume1 && isVolume2);
}

/**
 * Convierte una cantidad de una unidad a otra
 * @param quantity - Cantidad a convertir
 * @param fromUnit - Unidad de origen
 * @param toUnit - Unidad de destino
 * @returns Cantidad convertida o null si no son compatibles
 */
export function convertUnit(
  quantity: number,
  fromUnit: UnitType,
  toUnit: UnitType
): number | null {
  if (fromUnit === toUnit) return quantity;
  
  if (!areUnitsCompatible(fromUnit, toUnit)) {
    return null; // No se pueden convertir
  }
  
  // Convertir a unidad base
  const baseAmount = quantity * CONVERSION_FACTORS[fromUnit];
  // Convertir de unidad base a unidad destino
  return baseAmount / CONVERSION_FACTORS[toUnit];
}

/**
 * Calcula el costo de una cantidad en una unidad específica
 * basado en el costo por unidad de compra
 * 
 * @param quantity - Cantidad requerida
 * @param quantityUnit - Unidad de la cantidad requerida
 * @param purchaseCost - Costo de compra del insumo
 * @param purchaseUnit - Unidad en que se compra el insumo
 * @returns Costo calculado o null si no son compatibles
 */
export function calculateCost(
  quantity: number,
  quantityUnit: UnitType,
  purchaseCost: number,
  purchaseUnit: UnitType
): number | null {
  if (!areUnitsCompatible(quantityUnit, purchaseUnit)) {
    return null;
  }
  
  // Convertir la cantidad a la unidad de compra
  const quantityInPurchaseUnit = convertUnit(quantity, quantityUnit, purchaseUnit);
  if (quantityInPurchaseUnit === null) return null;
  
  // Calcular costo proporcional
  return quantityInPurchaseUnit * purchaseCost;
}

/**
 * Calcula el costo unitario por unidad específica
 * @param purchaseCost - Costo del paquete
 * @param purchaseUnit - Unidad del paquete
 * @param targetUnit - Unidad a la que se quiere convertir
 * @returns Costo por unidad objetivo
 */
export function getUnitCost(
  purchaseCost: number,
  purchaseUnit: UnitType,
  targetUnit: UnitType
): number | null {
  if (!areUnitsCompatible(purchaseUnit, targetUnit)) {
    return null;
  }
  
  // Cuántas unidades objetivo hay en una unidad de compra
  const conversion = convertUnit(1, purchaseUnit, targetUnit);
  if (conversion === null) return null;
  
  return purchaseCost / conversion;
}

/**
 * Obtiene todas las unidades compatibles con una unidad dada
 */
export function getCompatibleUnits(unit: UnitType): UnitType[] {
  if (WEIGHT_UNITS.includes(unit as WeightUnit)) {
    return WEIGHT_UNITS;
  }
  if (VOLUME_UNITS.includes(unit as VolumeUnit)) {
    return VOLUME_UNITS;
  }
  return [unit]; // Piezas no son convertibles
}

/**
 * Formatea una cantidad con su unidad
 */
export function formatQuantityWithUnit(quantity: number, unit: UnitType): string {
  const formattedQty = quantity % 1 === 0 
    ? quantity.toString() 
    : quantity.toFixed(3).replace(/\.?0+$/, '');
  return `${formattedQty} ${unit}`;
}
