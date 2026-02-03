/**
 * @file: src/app/inventarios/insumos/nuevo/page.tsx
 * @purpose: Formulario para crear nuevo insumo (US-03, BR-06)
 * @goal: Permitir crear insumos simples y compuestos (mezclas) con conversión de unidades
 * @context: Módulo Inventarios - Creación de insumo
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Package,
  Beaker,
  Layers,
  Info,
  ChefHat
} from 'lucide-react';
import { createInventoryItem, getInventoryItems, createItemCompositions } from '@/actions/inventory';
import { 
  ALL_UNITS, 
  UnitType, 
  calculateCost, 
  areUnitsCompatible,
  convertUnit,
  WEIGHT_UNITS,
  VOLUME_UNITS
} from '@/lib/utils/unitConversions';
import { formatCurrency } from '@/lib/utils/formatters';

interface MixIngredient {
  inventory_item_id: string;
  quantity: number;
  unit: UnitType;
  itemName?: string;
  itemUnit?: UnitType;
  itemCost?: number;
  calculatedCost?: number;
}

export default function NuevoInsumoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [isCompound, setIsCompound] = useState(false);
  
  // Form data para insumo simple
  const [formData, setFormData] = useState({
    name: '',
    purchaseUnit: 'kg' as UnitType,
    quantityPerPackage: '',
    totalPackageCost: '',  // Costo TOTAL del paquete
    initialStock: '',
    reorderPoint: '',
  });
  
  // Mix ingredients (solo se usa para mezclas)
  const [mixIngredients, setMixIngredients] = useState<MixIngredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<UnitType>('g');

  useEffect(() => {
    loadInventoryItems();
  }, []);

  const loadInventoryItems = async () => {
    const { data } = await getInventoryItems();
    if (data) {
      setInventoryItems(data.filter(item => !item.is_compound));
    }
  };

  // Calcular costo UNITARIO por unidad de compra (para insumos simples)
  const calculateUnitCost = (): number => {
    const totalCost = parseFloat(formData.totalPackageCost) || 0;
    const qty = parseFloat(formData.quantityPerPackage) || 1;
    if (qty <= 0) return 0;
    return totalCost / qty;
  };

  // Calcular costo de un ingrediente basado en su insumo base
  const calculateIngredientCost = (ingredient: MixIngredient): number => {
    const item = inventoryItems.find(i => i.id === ingredient.inventory_item_id);
    if (!item || !item.cost_per_purchase_unit) return 0;
    
    const cost = calculateCost(
      ingredient.quantity,
      ingredient.unit,
      item.cost_per_purchase_unit,
      item.unit_purchase as UnitType
    );
    
    return cost || 0;
  };

  // Calcular costo total de la mezcla
  const calculateTotalMixCost = (): number => {
    return mixIngredients.reduce((total, ingredient) => {
      return total + calculateIngredientCost(ingredient);
    }, 0);
  };

  // Calcular cantidad total de la mezcla en una unidad común
  const calculateTotalMixQuantity = (): { quantity: number; unit: UnitType } => {
    if (mixIngredients.length === 0) return { quantity: 0, unit: 'kg' };
    
    let totalWeightKg = 0;
    let totalVolumeL = 0;
    let hasWeight = false;
    let hasVolume = false;
    
    mixIngredients.forEach(ing => {
      const item = inventoryItems.find(i => i.id === ing.inventory_item_id);
      if (!item) return;
      
      const baseUnit = item.unit_purchase as UnitType;
      
      if (WEIGHT_UNITS.includes(baseUnit as any)) {
        hasWeight = true;
        const converted = convertUnit(ing.quantity, ing.unit, 'kg');
        if (converted !== null) totalWeightKg += converted;
      } else if (VOLUME_UNITS.includes(baseUnit as any)) {
        hasVolume = true;
        const converted = convertUnit(ing.quantity, ing.unit, 'L');
        if (converted !== null) totalVolumeL += converted;
      }
    });
    
    if (hasWeight && totalWeightKg > 0) {
      if (totalWeightKg >= 1) return { quantity: totalWeightKg, unit: 'kg' };
      if (totalWeightKg >= 0.001) return { quantity: totalWeightKg * 1000, unit: 'g' };
      return { quantity: totalWeightKg * 1000000, unit: 'mg' };
    }
    
    if (hasVolume && totalVolumeL > 0) {
      if (totalVolumeL >= 1) return { quantity: totalVolumeL, unit: 'L' };
      return { quantity: totalVolumeL * 1000, unit: 'ml' };
    }
    
    return { quantity: 0, unit: 'kg' };
  };

  const mixTotal = calculateTotalMixQuantity();

  const handleAddIngredient = () => {
    if (!selectedIngredientId || !selectedQuantity) {
      return;
    }
    
    const qty = parseFloat(selectedQuantity);
    if (isNaN(qty) || qty <= 0) {
      return;
    }
    
    const item = inventoryItems.find(i => i.id === selectedIngredientId);
    if (!item) return;
    
    // Verificar compatibilidad de unidades
    if (!areUnitsCompatible(selectedUnit, item.unit_purchase as UnitType)) {
      return;
    }
    
    const newIngredient: MixIngredient = {
      inventory_item_id: selectedIngredientId,
      quantity: qty,
      unit: selectedUnit,
      itemName: item.name,
      itemUnit: item.unit_purchase as UnitType,
      itemCost: item.cost_per_purchase_unit || 0,
    };
    
    // Calcular costo
    newIngredient.calculatedCost = calculateIngredientCost(newIngredient);
    
    // Agregar a la lista
    setMixIngredients(prev => [...prev, newIngredient]);
    
    // Resetear campos de selección
    setSelectedIngredientId('');
    setSelectedQuantity('');
    setSelectedUnit('g');
  };

  const handleRemoveIngredient = (index: number) => {
    setMixIngredients(prev => prev.filter((_, i) => i !== index));
  };

  // Actualizar costo cuando cambia la unidad de un ingrediente existente
  const handleUpdateIngredientUnit = (index: number, newUnit: UnitType) => {
    setMixIngredients(prev => {
      const newIngredients = [...prev];
      const ingredient = newIngredients[index];
      
      if (!areUnitsCompatible(newUnit, ingredient.itemUnit!)) {
        return prev;
      }
      
      ingredient.unit = newUnit;
      ingredient.calculatedCost = calculateIngredientCost(ingredient);
      return newIngredients;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    if (!isCompound) {
      // Validaciones para insumo simple
      if (!formData.quantityPerPackage || parseFloat(formData.quantityPerPackage) <= 0) {
        return;
      }
      if (!formData.totalPackageCost || parseFloat(formData.totalPackageCost) < 0) {
        return;
      }
    } else {
      // Validaciones para mezcla
      if (mixIngredients.length === 0) {
        return;
      }
    }

    setLoading(true);

    try {
      let itemData;
      
      if (isCompound) {
        // Para mezclas
        const totalCost = calculateTotalMixCost();
        const totalQty = mixTotal.quantity || 1;
        const unitCost = totalQty > 0 ? totalCost / totalQty : 0;
        
        itemData = {
          name: formData.name,
          unit_purchase: mixTotal.unit,
          unit_usage: mixTotal.unit,
          cost_per_purchase_unit: unitCost,
          quantity_per_purchase_unit: 1,
          current_stock: parseFloat(formData.initialStock) || 0,
          min_stock_threshold: parseFloat(formData.reorderPoint) || 0,
          is_compound: true,
          category_id: null,
        };
      } else {
        // Para insumos simples - guardar costo UNITARIO
        const unitCost = calculateUnitCost();
        
        itemData = {
          name: formData.name,
          unit_purchase: formData.purchaseUnit,
          unit_usage: formData.purchaseUnit,
          cost_per_purchase_unit: unitCost,  // Costo por UNIDAD, no por paquete
          quantity_per_purchase_unit: parseFloat(formData.quantityPerPackage) || 1,
          current_stock: parseFloat(formData.initialStock) || 0,
          min_stock_threshold: parseFloat(formData.reorderPoint) || 0,
          is_compound: false,
          category_id: null,
        };
      }

      const { data, error } = await createInventoryItem(itemData);

      if (error) {
        console.error('Error creating inventory item:', error);
        setLoading(false);
        return;
      }

      if (data && isCompound && mixIngredients.length > 0) {
        await createItemCompositions(
          data.id,
          mixIngredients.map(ing => ({
            ingredient_item_id: ing.inventory_item_id,
            quantity_needed: ing.quantity,
          }))
        );
      }
      
      router.push('/inventarios/insumos');
    } catch (error) {
      console.error('Error inesperado:', error);
      setLoading(false);
    }
  };

  // Obtener unidades compatibles para el ingrediente seleccionado
  const getCompatibleUnitsForSelected = (): UnitType[] => {
    if (!selectedIngredientId) return ['g', 'kg', 'mg'];
    const item = inventoryItems.find(i => i.id === selectedIngredientId);
    if (!item) return ['g', 'kg', 'mg'];
    
    const itemUnit = item.unit_purchase as UnitType;
    
    if (['kg', 'g', 'mg'].includes(itemUnit)) {
      return ['kg', 'g', 'mg'];
    }
    if (['L', 'ml'].includes(itemUnit)) {
      return ['L', 'ml'];
    }
    return [itemUnit];
  };

  return (
    <AppLayout>
      <PageContainer
        title="Nuevo Insumo"
        subtitle="Alta de materia prima"
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        }
      >
        <form onSubmit={handleSubmit}>
          {/* Toggle para Mezcla */}
          <Card className={`mb-6 ${isCompound ? 'border-l-4 border-l-primary' : ''}`}>
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setIsCompound(!isCompound)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      isCompound ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        isCompound ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <div className="ml-4">
                    <h3 className="font-semibold text-text-primary">
                      ¿Es un Insumo Compuesto (Mezcla)?
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Activa si este insumo es una mezcla de otros insumos
                    </p>
                  </div>
                </div>
                {isCompound && (
                  <Badge variant="info">
                    <Beaker className="h-3 w-3 mr-1" />
                    Mezcla
                  </Badge>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Layout de 2 columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Izquierda - Información Básica */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex items-center">
                <Info className="h-5 w-5 mr-2 text-primary" />
                <h3 className="text-lg font-semibold">Información Básica</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Nombre del Insumo <span className="text-error">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={isCompound ? "Ej: Mezcla de Especias" : "Ej: Harina Fuerza"}
                      className="w-full"
                    />
                  </div>

                  {/* Presentación de Compra - SOLO para insumos simples */}
                  {!isCompound && (
                    <div className="pt-4">
                      <div className="flex items-center mb-3">
                        <Package className="h-5 w-5 mr-2 text-primary" />
                        <h4 className="font-semibold text-text-primary">Presentación de Compra</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            Unidad de Compra <span className="text-error">*</span>
                          </label>
                          <select
                            value={formData.purchaseUnit}
                            onChange={(e) => setFormData({ ...formData, purchaseUnit: e.target.value as UnitType })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <optgroup label="Peso">
                              <option value="kg">Kilogramos (kg)</option>
                              <option value="g">Gramos (g)</option>
                              <option value="mg">Miligramos (mg)</option>
                            </optgroup>
                            <optgroup label="Volumen">
                              <option value="L">Litros (L)</option>
                              <option value="ml">Mililitros (ml)</option>
                            </optgroup>
                            <optgroup label="Unidades">
                              <option value="pz">Piezas (pz)</option>
                              <option value="bulto">Bulto</option>
                              <option value="caja">Caja</option>
                              <option value="saco">Saco</option>
                            </optgroup>
                          </select>
                          <p className="text-xs text-text-muted mt-1">Unidad estándar</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            Cantidad <span className="text-error">*</span>
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.quantityPerPackage}
                            onChange={(e) => setFormData({ ...formData, quantityPerPackage: e.target.value })}
                            placeholder="Ej: 44"
                          />
                          <p className="text-xs text-text-muted mt-1">Cantidad por paquete</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            Costo TOTAL del Paquete <span className="text-error">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.totalPackageCost}
                              onChange={(e) => setFormData({ ...formData, totalPackageCost: e.target.value })}
                              placeholder="0.00"
                              className="pl-8"
                            />
                          </div>
                          <p className="text-xs text-text-muted mt-1">Costo que pagaste</p>
                        </div>
                      </div>

                      {/* Mostrar costo unitario calculado */}
                      {formData.totalPackageCost && formData.quantityPerPackage && (
                        <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-text-secondary">
                              Costo por {formData.purchaseUnit}:
                            </span>
                            <span className="text-lg font-bold text-primary">
                              {formatCurrency(calculateUnitCost())}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted mt-1">
                            Este valor se guardará como costo unitario
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Columna Derecha - Inventario */}
            <Card>
              <CardHeader className="flex items-center">
                <Package className="h-5 w-5 mr-2 text-primary" />
                <h3 className="text-lg font-semibold">Inventario Físico Inicial</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Cantidad Inicial <span className="text-error">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.initialStock}
                      onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
                      placeholder="0"
                    />
                    <p className="text-xs text-text-muted mt-1">
                      {isCompound 
                        ? `Número de unidades` 
                        : `Número de ${formData.purchaseUnit === 'pz' ? 'piezas' : 'paquetes'}`}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Punto de Reorden
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.reorderPoint}
                      onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
                      placeholder="0"
                    />
                    <p className="text-xs text-text-muted mt-1">Avisar si baja de...</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Sección de Mezcla (solo si es compuesto) */}
          {isCompound && (
            <>
              {/* Rendimiento de la Receta - AUTOMÁTICO */}
              <Card className="mt-6 border-l-4 border-l-primary">
                <CardHeader className="flex items-center">
                  <ChefHat className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="text-lg font-semibold">Rendimiento de la Receta</h3>
                </CardHeader>
                <CardBody>
                  <div className="bg-surface-elevated p-4 rounded-lg">
                    {mixIngredients.length > 0 ? (
                      <>
                        <p className="text-lg text-text-primary">
                          Esta receta da resultado{' '}
                          <strong className="text-primary">
                            {mixTotal.quantity.toFixed(2)} {mixTotal.unit}
                          </strong>
                          {' '}de{' '}
                          <strong>{formData.name || 'Mezcla'}</strong>
                        </p>
                        <p className="text-sm text-text-secondary mt-2">
                          Suma total de ingredientes: {mixIngredients.reduce((sum, i) => sum + i.quantity, 0).toFixed(2)} unidades
                        </p>
                      </>
                    ) : (
                      <p className="text-text-secondary">
                        Agrega ingredientes para ver el rendimiento calculado automáticamente
                      </p>
                    )}
                  </div>

                  {/* Costo por unidad calculado */}
                  {mixIngredients.length > 0 && mixTotal.quantity > 0 && (
                    <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-text-secondary">Costo total:</span>
                          <p className="text-xl font-bold text-primary">
                            {formatCurrency(calculateTotalMixCost())}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-text-secondary">Costo por {mixTotal.unit}:</span>
                          <p className="text-xl font-bold text-primary">
                            {formatCurrency(calculateTotalMixCost() / mixTotal.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Ingredientes de la Mezcla */}
              <Card className="mt-6">
                <CardHeader className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Layers className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="text-lg font-semibold">Ingredientes de la Mezcla</h3>
                  </div>
                  <Badge variant="info">
                    {mixIngredients.length} ingredientes
                  </Badge>
                </CardHeader>
                <CardBody>
                  {/* Tabla de Ingredientes */}
                  {mixIngredients.length > 0 && (
                    <div className="mb-6 overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-2 text-sm font-medium text-text-secondary">Insumo</th>
                            <th className="text-left py-2 px-2 text-sm font-medium text-text-secondary">Cantidad</th>
                            <th className="text-left py-2 px-2 text-sm font-medium text-text-secondary">Unidad</th>
                            <th className="text-left py-2 px-2 text-sm font-medium text-text-secondary">Costo</th>
                            <th className="text-center py-2 px-2 text-sm font-medium text-text-secondary"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {mixIngredients.map((ing, index) => (
                            <tr key={`${ing.inventory_item_id}-${index}`} className="border-b border-border last:border-0">
                              <td className="py-3 px-2">
                                <span className="font-medium text-text-primary">{ing.itemName}</span>
                              </td>
                              <td className="py-3 px-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={ing.quantity}
                                  onChange={(e) => {
                                    const newQty = parseFloat(e.target.value) || 0;
                                    setMixIngredients(prev => {
                                      const updated = [...prev];
                                      updated[index] = {
                                        ...updated[index],
                                        quantity: newQty,
                                        calculatedCost: calculateIngredientCost({ ...updated[index], quantity: newQty })
                                      };
                                      return updated;
                                    });
                                  }}
                                  className="w-24"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <select
                                  value={ing.unit}
                                  onChange={(e) => handleUpdateIngredientUnit(index, e.target.value as UnitType)}
                                  className="px-2 py-1 border border-border rounded bg-surface text-text-primary text-sm"
                                >
                                  {(['kg', 'g', 'mg'].includes(ing.itemUnit!) ? ['kg', 'g', 'mg'] :
                                    ['L', 'ml'].includes(ing.itemUnit!) ? ['L', 'ml'] : [ing.itemUnit!]
                                  ).map(u => (
                                    <option key={u} value={u}>{u}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 px-2">
                                <span className="font-medium text-primary">
                                  {formatCurrency(ing.calculatedCost || 0)}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveIngredient(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-error" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Agregar Ingrediente */}
                  <div className="bg-surface-elevated p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Insumo
                        </label>
                        <select
                          value={selectedIngredientId}
                          onChange={(e) => {
                            const id = e.target.value;
                            setSelectedIngredientId(id);
                            const item = inventoryItems.find(i => i.id === id);
                            if (item) {
                              setSelectedUnit(item.unit_purchase as UnitType);
                            }
                          }}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="">Seleccionar...</option>
                          {inventoryItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Cantidad
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={selectedQuantity}
                          onChange={(e) => setSelectedQuantity(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Unidad
                        </label>
                        <select
                          value={selectedUnit}
                          onChange={(e) => setSelectedUnit(e.target.value as UnitType)}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          {getCompatibleUnitsForSelected().map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddIngredient}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Costo Total */}
                  {mixIngredients.length > 0 && (
                    <div className="mt-6 p-4 bg-primary/10 rounded-lg border-2 border-primary">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-text-primary">Costo Total de la Mezcla:</span>
                        <span className="text-2xl font-bold text-primary">
                          {formatCurrency(calculateTotalMixCost())}
                        </span>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </>
          )}

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()} 
              disabled={loading}
              className="order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading}
              className="order-1 sm:order-2"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : isCompound ? 'Crear Mezcla' : 'Crear Insumo'}
            </Button>
          </div>
        </form>
      </PageContainer>
    </AppLayout>
  );
}
