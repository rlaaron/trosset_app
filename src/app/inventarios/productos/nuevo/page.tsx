/**
 * @file: src/app/inventarios/productos/nuevo/page.tsx
 * @purpose: Formulario para crear nuevo producto con receta y procesos
 * @goal: Crear producto, definir receta (ingredientes) y fases con acciones internas (triggers)
 * @context: Módulo Inventarios - Creación de producto (US-04)
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
  Edit2,
  Package,
  Layers,
  Clock,
  ChevronRight,
  ChevronLeft,
  Calculator,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckSquare,
  XOctagon,
  Bell,
  X
} from 'lucide-react';
import { createProduct } from '@/actions/products';
import { getInventoryItems } from '@/actions/inventory';
import { 
  UnitType, 
  calculateCost, 
  areUnitsCompatible,
  getCompatibleUnits
} from '@/lib/utils/unitConversions';
import { formatCurrency } from '@/lib/utils/formatters';

// Tipos de triggers
const TRIGGER_TYPES = [
  { value: 'info', label: 'Alerta Informativa', icon: Bell, color: 'text-info', bgColor: 'bg-info/10' },
  { value: 'action_check', label: 'Checkbox de Acción', icon: CheckSquare, color: 'text-success', bgColor: 'bg-success/10' },
  { value: 'blocking', label: 'Checkbox Bloqueante', icon: XOctagon, color: 'text-error', bgColor: 'bg-error/10' },
];

interface PhaseTrigger {
  tempId: string;           // ID temporal para el frontend
  trigger_time_seconds: number;
  type: 'info' | 'action_check' | 'blocking';
  instruction_text: string;
}

interface ProductionPhase {
  tempId: string;           // ID temporal para el frontend
  name: string;
  sequence_order: number;
  estimated_duration_minutes?: number;
  triggers: PhaseTrigger[];
  isExpanded: boolean;
}

interface RecipeItem {
  inventory_item_id: string;
  quantity: number;
  unit: UnitType;
  itemName?: string;
  itemUnit?: UnitType;
  itemCost?: number;
  calculatedCost?: number;
}

// Para variantes de producto maestro
interface VariantIngredient {
  inventory_item_id: string;
  quantity: number;
  unit: UnitType;
  itemName?: string;
  itemCost?: number;
  calculatedCost?: number;
}

interface ProductVariant {
  tempId: string;
  name: string;
  extra_cost: number;
  ingredients: VariantIngredient[];
  isEditing?: boolean;
}

export default function NuevoProductoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  
  // Form data - Tab General
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    batch_size_units: '',
    has_variants: false,
  });
  
  // Tab Receta
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<UnitType>('g');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState<UnitType>('g');
  
  // Tab Procesos
  const [phases, setPhases] = useState<ProductionPhase[]>([]);
  const [phaseName, setPhaseName] = useState('');
  const [phaseDuration, setPhaseDuration] = useState('');
  
  // Tab Variantes (para Productos Maestro)
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantName, setVariantName] = useState('');
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [variantIngredientId, setVariantIngredientId] = useState('');
  const [variantIngredientQty, setVariantIngredientQty] = useState('');
  const [variantIngredientUnit, setVariantIngredientUnit] = useState<UnitType>('g');
  
  // Estados para agregar/editar triggers
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [newTriggerMinutes, setNewTriggerMinutes] = useState('');
  const [newTriggerSeconds, setNewTriggerSeconds] = useState('00');
  const [newTriggerType, setNewTriggerType] = useState<'info' | 'action_check' | 'blocking'>('info');
  const [newTriggerText, setNewTriggerText] = useState('');
  const [editingTrigger, setEditingTrigger] = useState<{ phaseId: string; triggerTempId: string } | null>(null);

  useEffect(() => {
    loadInventoryItems();
  }, []);

  const loadInventoryItems = async () => {
    const { data } = await getInventoryItems();
    if (data) {
      setInventoryItems(data);
    }
  };

  // Helpers
  const generateTempId = () => Math.random().toString(36).substring(2, 9);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTimeToSeconds = (minutes: string, seconds: string): number => {
    return (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
  };

  // Cálculos de receta
  const calculateRecipeItemCost = (item: RecipeItem): number => {
    if (!item.itemCost || !item.itemUnit) return 0;
    const cost = calculateCost(item.quantity, item.unit, item.itemCost, item.itemUnit);
    return cost || 0;
  };

  const calculateTotalRecipeCost = (): number => {
    return recipes.reduce((total, recipe) => {
      return total + (recipe.calculatedCost || calculateRecipeItemCost(recipe));
    }, 0);
  };

  const calculateCostPerProductUnit = (): number => {
    const totalCost = calculateTotalRecipeCost();
    const batchSize = parseInt(formData.batch_size_units) || 1;
    return batchSize > 0 ? totalCost / batchSize : 0;
  };

  const getUnitsForSelectedItem = (): UnitType[] => {
    if (!selectedItemId) return ['kg', 'g', 'mg', 'L', 'ml', 'pz'];
    const item = inventoryItems.find(i => i.id === selectedItemId);
    if (!item) return ['kg', 'g', 'mg', 'L', 'ml', 'pz'];
    return getCompatibleUnits(item.unit_purchase as UnitType);
  };

  // Handlers de Receta
  const handleAddRecipeItem = () => {
    if (!selectedItemId || !selectedQuantity) return;
    const qty = parseFloat(selectedQuantity);
    if (isNaN(qty) || qty <= 0) return;
    
    const item = inventoryItems.find(i => i.id === selectedItemId);
    if (!item) return;
    if (!areUnitsCompatible(selectedUnit, item.unit_purchase as UnitType)) return;
    
    const newRecipe: RecipeItem = {
      inventory_item_id: selectedItemId,
      quantity: qty,
      unit: selectedUnit,
      itemName: item.name,
      itemUnit: item.unit_purchase as UnitType,
      itemCost: item.cost_per_purchase_unit || 0,
    };
    newRecipe.calculatedCost = calculateRecipeItemCost(newRecipe);
    
    setRecipes(prev => [...prev, newRecipe]);
    setSelectedItemId('');
    setSelectedQuantity('');
    setSelectedUnit('g');
  };

  const handleRemoveRecipeItem = (index: number) => {
    setRecipes(prev => prev.filter((_, i) => i !== index));
  };

  const startEditing = (index: number) => {
    const recipe = recipes[index];
    setEditingIndex(index);
    setEditQuantity(recipe.quantity.toString());
    setEditUnit(recipe.unit);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditQuantity('');
    setEditUnit('g');
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const qty = parseFloat(editQuantity);
    if (isNaN(qty) || qty <= 0) return;
    const recipe = recipes[editingIndex];
    if (!areUnitsCompatible(editUnit, recipe.itemUnit!)) return;
    
    setRecipes(prev => {
      const updated = [...prev];
      updated[editingIndex] = {
        ...updated[editingIndex],
        quantity: qty,
        unit: editUnit,
        calculatedCost: calculateRecipeItemCost({ ...updated[editingIndex], quantity: qty, unit: editUnit })
      };
      return updated;
    });
    cancelEditing();
  };

  // Handlers de Fases
  const handleAddPhase = () => {
    if (!phaseName.trim()) return;
    
    const newPhase: ProductionPhase = {
      tempId: generateTempId(),
      name: phaseName.trim(),
      sequence_order: phases.length + 1,
      estimated_duration_minutes: phaseDuration ? parseInt(phaseDuration) : undefined,
      triggers: [],
      isExpanded: false,
    };
    
    setPhases(prev => [...prev, newPhase]);
    setPhaseName('');
    setPhaseDuration('');
  };

  const handleRemovePhase = (tempId: string) => {
    setPhases(prev => {
      const newPhases = prev.filter(p => p.tempId !== tempId);
      return newPhases.map((p, i) => ({ ...p, sequence_order: i + 1 }));
    });
  };

  const togglePhaseExpand = (tempId: string) => {
    setPhases(prev => prev.map(p => 
      p.tempId === tempId ? { ...p, isExpanded: !p.isExpanded } : p
    ));
  };

  // Handlers de Triggers (Acciones Internas)
  const startAddingTrigger = (phaseTempId: string) => {
    // Cancelar cualquier edición en curso
    cancelEditTrigger();
    setEditingPhaseId(phaseTempId);
  };

  const cancelAddTrigger = () => {
    setEditingPhaseId(null);
    setNewTriggerMinutes('');
    setNewTriggerSeconds('00');
    setNewTriggerType('info');
    setNewTriggerText('');
  };

  const handleAddTrigger = (phaseTempId: string) => {
    if (!newTriggerText.trim() || !newTriggerMinutes) return;
    
    const seconds = parseTimeToSeconds(newTriggerMinutes, newTriggerSeconds);
    
    const newTrigger: PhaseTrigger = {
      tempId: generateTempId(),
      trigger_time_seconds: seconds,
      type: newTriggerType,
      instruction_text: newTriggerText.trim(),
    };
    
    setPhases(prev => prev.map(p => 
      p.tempId === phaseTempId 
        ? { ...p, triggers: [...p.triggers, newTrigger] }
        : p
    ));
    
    // Cerrar formulario y resetear
    cancelAddTrigger();
  };

  const handleRemoveTrigger = (phaseTempId: string, triggerTempId: string) => {
    setPhases(prev => prev.map(p => 
      p.tempId === phaseTempId 
        ? { ...p, triggers: p.triggers.filter(t => t.tempId !== triggerTempId) }
        : p
    ));
  };

  const startEditingTrigger = (phaseTempId: string, trigger: PhaseTrigger) => {
    setEditingTrigger({ phaseId: phaseTempId, triggerTempId: trigger.tempId });
    const mins = Math.floor(trigger.trigger_time_seconds / 60);
    const secs = trigger.trigger_time_seconds % 60;
    setNewTriggerMinutes(mins.toString());
    setNewTriggerSeconds(secs.toString().padStart(2, '0'));
    setNewTriggerType(trigger.type);
    setNewTriggerText(trigger.instruction_text);
  };

  const saveEditTrigger = () => {
    if (!editingTrigger || !newTriggerText.trim() || !newTriggerMinutes) return;
    
    const seconds = parseTimeToSeconds(newTriggerMinutes, newTriggerSeconds);
    
    setPhases(prev => prev.map(p => 
      p.tempId === editingTrigger.phaseId 
        ? { 
            ...p, 
            triggers: p.triggers.map(t => 
              t.tempId === editingTrigger.triggerTempId 
                ? { ...t, trigger_time_seconds: seconds, type: newTriggerType, instruction_text: newTriggerText.trim() }
                : t
            )
          }
        : p
    ));
    
    setEditingTrigger(null);
    setNewTriggerMinutes('');
    setNewTriggerSeconds('00');
    setNewTriggerType('info');
    setNewTriggerText('');
  };

  const cancelEditTrigger = () => {
    setEditingTrigger(null);
    setNewTriggerMinutes('');
    setNewTriggerSeconds('00');
    setNewTriggerType('info');
    setNewTriggerText('');
  };

  const getTriggerTypeConfig = (type: string) => {
    return TRIGGER_TYPES.find(t => t.value === type) || TRIGGER_TYPES[0];
  };

  // Handlers de Variantes
  const handleAddVariant = () => {
    if (!variantName.trim()) return;
    
    const newVariant: ProductVariant = {
      tempId: generateTempId(),
      name: variantName.trim(),
      extra_cost: 0,
      ingredients: [],
    };
    
    setVariants(prev => [...prev, newVariant]);
    setVariantName('');
  };

  const handleRemoveVariant = (tempId: string) => {
    setVariants(prev => prev.filter(v => v.tempId !== tempId));
  };

  const toggleVariantEdit = (tempId: string) => {
    setVariants(prev => prev.map(v => 
      v.tempId === tempId ? { ...v, isEditing: !v.isEditing } : { ...v, isEditing: false }
    ));
    
    // Si estamos abriendo esta variante, setearla como la que se está editando
    const variant = variants.find(v => v.tempId === tempId);
    if (variant && !variant.isEditing) {
      setEditingVariantId(tempId);
    } else {
      setEditingVariantId(null);
    }
    
    // Reset form
    setVariantIngredientId('');
    setVariantIngredientQty('');
    setVariantIngredientUnit('g');
  };

  const handleAddVariantIngredient = () => {
    if (!editingVariantId) return;
    if (!variantIngredientId || !variantIngredientQty) return;
    
    const qty = parseFloat(variantIngredientQty);
    if (isNaN(qty) || qty <= 0) return;
    
    const item = inventoryItems.find(i => i.id === variantIngredientId);
    if (!item) return;
    if (!areUnitsCompatible(variantIngredientUnit, item.unit_purchase as UnitType)) return;
    
    const newIngredient: VariantIngredient = {
      inventory_item_id: variantIngredientId,
      quantity: qty,
      unit: variantIngredientUnit,
      itemName: item.name,
      itemCost: item.cost_per_purchase_unit || 0,
    };
    newIngredient.calculatedCost = calculateCost(qty, variantIngredientUnit, newIngredient.itemCost, item.unit_purchase as UnitType) || 0;
    
    setVariants(prev => prev.map(v => {
      if (v.tempId === editingVariantId) {
        const updatedIngredients = [...v.ingredients, newIngredient];
        const totalExtraCost = updatedIngredients.reduce((sum, ing) => sum + (ing.calculatedCost || 0), 0);
        return { 
          ...v, 
          ingredients: updatedIngredients,
          extra_cost: totalExtraCost,
        };
      }
      return v;
    }));
    
    setVariantIngredientId('');
    setVariantIngredientQty('');
    setVariantIngredientUnit('g');
  };

  const handleRemoveVariantIngredient = (variantTempId: string, ingredientIndex: number) => {
    setVariants(prev => prev.map(v => {
      if (v.tempId === variantTempId) {
        const updatedIngredients = v.ingredients.filter((_, i) => i !== ingredientIndex);
        const totalExtraCost = updatedIngredients.reduce((sum, ing) => sum + (ing.calculatedCost || 0), 0);
        return { 
          ...v, 
          ingredients: updatedIngredients,
          extra_cost: totalExtraCost,
        };
      }
      return v;
    }));
  };

  const getVariantIngredientUnits = (): UnitType[] => {
    if (!variantIngredientId) return ['kg', 'g', 'mg', 'L', 'ml', 'pz'];
    const item = inventoryItems.find(i => i.id === variantIngredientId);
    if (!item) return ['kg', 'g', 'mg', 'L', 'ml', 'pz'];
    return getCompatibleUnits(item.unit_purchase as UnitType);
  };

  // Submit
  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    if (recipes.length === 0) return;

    setLoading(true);
    try {
      const { data, error } = await createProduct(
        {
          name: formData.name,
          description: formData.description || null,
          batch_size_units: parseInt(formData.batch_size_units) || 1,
          has_variants: formData.has_variants,
          variants: formData.has_variants ? variants.map(v => ({
            name: v.name,
            extra_cost: v.extra_cost,
            extra_ingredients: v.ingredients.map(ing => ({
              item_id: ing.inventory_item_id,
              qty: ing.quantity,
              unit: ing.unit,
            })),
          })) : undefined,
        },
        recipes.map(r => ({
          inventory_item_id: r.inventory_item_id,
          quantity: r.quantity,
          unit: r.unit,
        })),
        phases.map(p => ({
          name: p.name,
          sequence_order: p.sequence_order,
          estimated_duration_minutes: p.estimated_duration_minutes,
          triggers: p.triggers.map(t => ({
            trigger_time_seconds: t.trigger_time_seconds,
            type: t.type,
            instruction_text: t.instruction_text,
          })),
        }))
      );

      if (error) {
        console.error('Error:', error);
      } else {
        router.push('/inventarios/productos');
      }
    } catch (error) {
      console.error('Error inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSteps = () => {
    const baseSteps = [
      { number: 1, title: 'Información Básica', icon: Package },
      { number: 2, title: 'Receta (Ingredientes)', icon: Layers },
      { number: 3, title: 'Procesos (Fases)', icon: Clock },
    ];
    
    if (formData.has_variants) {
      baseSteps.push({ number: 4, title: 'Variantes', icon: Layers });
    }
    
    return baseSteps;
  };
  
  const steps = getSteps();

  return (
    <AppLayout>
      <PageContainer
        title="Nuevo Producto"
        subtitle="Crear un nuevo producto con receta y procesos de producción"
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        }
      >
        {/* Wizard Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                    currentStep === step.number 
                      ? 'bg-primary text-white' 
                      : currentStep > step.number 
                        ? 'bg-success text-white' 
                        : 'bg-surface-elevated text-text-muted'
                  }`}>
                    {currentStep > step.number ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.number ? 'text-text-primary' : 'text-text-muted'
                    }`}>
                      Paso {step.number}
                    </p>
                    <p className={`text-xs ${
                      currentStep >= step.number ? 'text-text-secondary' : 'text-text-muted'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-success' : 'bg-border'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              {steps[currentStep - 1].title}
            </h3>
          </CardHeader>
          <CardBody>
            {/* Step 1: Información Básica */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Nombre del Producto *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Baguette Tradicional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción del producto..."
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Batch Size (Tamaño de Lote) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.batch_size_units}
                    onChange={(e) => setFormData({ ...formData, batch_size_units: e.target.value })}
                    placeholder="Ej: 20"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Capacidad máxima de la maquinaria para este producto
                  </p>
                </div>

                <div className="flex items-center space-x-2 p-3 bg-surface-elevated rounded-lg">
                  <input
                    type="checkbox"
                    id="has_variants"
                    checked={formData.has_variants}
                    onChange={(e) => setFormData({ ...formData, has_variants: e.target.checked })}
                    className="rounded border-border h-4 w-4"
                  />
                  <label htmlFor="has_variants" className="text-sm font-medium text-text-primary">
                    Habilitar Variantes (Producto Maestro)
                  </label>
                </div>
                
                {formData.has_variants && (
                  <div className="p-3 bg-info/10 border border-info rounded-lg">
                    <p className="text-sm text-info">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      Este producto será un Producto Maestro. Podrás definir variantes como "Chocolate", 
                      "Integral", etc. con recargos de ingredientes extra.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Receta */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="bg-surface-elevated p-4 rounded-lg">
                  <h4 className="font-medium text-text-primary mb-3">Agregar Ingrediente (para 1 pieza)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <select
                        value={selectedItemId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedItemId(id);
                          const item = inventoryItems.find(i => i.id === id);
                          if (item) {
                            const units = getCompatibleUnits(item.unit_purchase as UnitType);
                            setSelectedUnit(units[0] || 'g');
                          }
                        }}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Seleccionar insumo...</option>
                        {inventoryItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} {item.is_compound ? '(Mezcla)' : ''} - ${formatCurrency(item.cost_per_purchase_unit || 0)}/{item.unit_purchase}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Input
                        type="number"
                        step="0.01"
                        value={selectedQuantity}
                        onChange={(e) => setSelectedQuantity(e.target.value)}
                        placeholder="Cantidad"
                      />
                    </div>
                    <div>
                      <select
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value as UnitType)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {getUnitsForSelectedItem().map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button variant="outline" onClick={handleAddRecipeItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Ingrediente
                    </Button>
                  </div>
                </div>

                {recipes.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-text-primary">Ingredientes Agregados</h4>
                      <Badge variant="info">{recipes.length} ingredientes</Badge>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-2 text-sm font-medium text-text-secondary">Insumo</th>
                            <th className="text-left py-2 px-2 text-sm font-medium text-text-secondary">Cantidad</th>
                            <th className="text-left py-2 px-2 text-sm font-medium text-text-secondary">Unidad</th>
                            <th className="text-left py-2 px-2 text-sm font-medium text-text-secondary">Costo</th>
                            <th className="text-center py-2 px-2 text-sm font-medium text-text-secondary" colSpan={2}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recipes.map((recipe, index) => (
                            <tr key={`${recipe.inventory_item_id}-${index}`} className="border-b border-border last:border-0">
                              {editingIndex === index ? (
                                <>
                                  <td className="py-3 px-2">
                                    <span className="font-medium text-text-primary">{recipe.itemName}</span>
                                  </td>
                                  <td className="py-3 px-2">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={editQuantity}
                                      onChange={(e) => setEditQuantity(e.target.value)}
                                      className="w-24"
                                    />
                                  </td>
                                  <td className="py-3 px-2">
                                    <select
                                      value={editUnit}
                                      onChange={(e) => setEditUnit(e.target.value as UnitType)}
                                      className="px-2 py-1 border border-border rounded bg-surface text-text-primary text-sm"
                                    >
                                      {getCompatibleUnits(recipe.itemUnit!).map(u => (
                                        <option key={u} value={u}>{u}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-3 px-2" colSpan={3}>
                                    <div className="flex gap-2">
                                      <Button variant="primary" size="sm" onClick={saveEdit}>Guardar</Button>
                                      <Button variant="outline" size="sm" onClick={cancelEditing}>Cancelar</Button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="py-3 px-2">
                                    <span className="font-medium text-text-primary">{recipe.itemName}</span>
                                  </td>
                                  <td className="py-3 px-2">{recipe.quantity}</td>
                                  <td className="py-3 px-2 text-text-secondary">{recipe.unit}</td>
                                  <td className="py-3 px-2">
                                    <span className="font-medium text-primary">{formatCurrency(recipe.calculatedCost || 0)}</span>
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    <Button variant="ghost" size="sm" onClick={() => startEditing(index)}>
                                      <Edit2 className="h-4 w-4 text-info" />
                                    </Button>
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveRecipeItem(index)}>
                                      <Trash2 className="h-4 w-4 text-error" />
                                    </Button>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* KPIs de Costo */}
                    <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-text-primary">Costo por Unidad:</span>
                        <span className="text-2xl font-bold text-primary">{formatCurrency(calculateCostPerProductUnit())}</span>
                      </div>
                      {formData.batch_size_units && parseInt(formData.batch_size_units) > 1 && (
                        <div className="pt-2 border-t border-primary/20 flex justify-between items-center">
                          <span className="text-sm text-text-secondary">
                            Costo por Batch ({formData.batch_size_units} unidades):
                          </span>
                          <span className="text-lg font-semibold text-primary">{formatCurrency(calculateTotalRecipeCost())}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-muted">
                    <Layers className="h-12 w-12 mx-auto mb-2" />
                    <p>No has agregado ingredientes aún</p>
                    <p className="text-sm">Define la receta unitaria (para 1 pieza)</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Procesos (Fases con Acciones Internas) */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {/* Agregar Fase */}
                <div className="bg-surface-elevated p-4 rounded-lg">
                  <h4 className="font-medium text-text-primary mb-3">Agregar Fase de Producción</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <Input
                        value={phaseName}
                        onChange={(e) => setPhaseName(e.target.value)}
                        placeholder="Ej: Amasado"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Input
                        type="number"
                        value={phaseDuration}
                        onChange={(e) => setPhaseDuration(e.target.value)}
                        placeholder="Duración (minutos)"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Button variant="outline" className="w-full" onClick={handleAddPhase}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Fase
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Lista de Fases con Acciones */}
                {phases.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-text-primary">Fases de Producción</h4>
                      <Badge variant="info">{phases.length} fases</Badge>
                    </div>
                    
                    {phases.map((phase) => (
                      <Card key={phase.tempId} className={`overflow-hidden ${phase.isExpanded ? 'border-l-4 border-l-primary' : ''}`}>
                        {/* Header de Fase */}
                        <div 
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface-elevated transition-colors"
                          onClick={() => togglePhaseExpand(phase.tempId)}
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center mr-3">
                              {phase.sequence_order}
                            </div>
                            <div>
                              <span className="font-medium text-text-primary">{phase.name}</span>
                              {phase.estimated_duration_minutes !== undefined && (
                                <span className="text-text-secondary text-sm ml-2">({phase.estimated_duration_minutes} min)</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {phase.triggers.length > 0 && (
                              <Badge variant="info">{phase.triggers.length} acciones</Badge>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleRemovePhase(phase.tempId); }}
                            >
                              <Trash2 className="h-4 w-4 text-error" />
                            </Button>
                            {phase.isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-text-muted" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-text-muted" />
                            )}
                          </div>
                        </div>

                        {/* Contenido Expandido - Acciones Internas */}
                        {phase.isExpanded && (
                          <div className="border-t border-border">
                            {/* Lista de Acciones */}
                            {phase.triggers.length > 0 && (
                              <div className="p-4 space-y-2">
                                <h5 className="text-sm font-medium text-text-secondary mb-2">Acciones Internas</h5>
                                {phase.triggers
                                  .sort((a, b) => a.trigger_time_seconds - b.trigger_time_seconds)
                                  .map((trigger) => {
                                    const typeConfig = getTriggerTypeConfig(trigger.type);
                                    const Icon = typeConfig.icon;
                                    
                                    return (
                                      <div 
                                        key={trigger.tempId}
                                        className="flex items-center justify-between p-3 bg-surface rounded-lg"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={`p-2 rounded ${typeConfig.bgColor}`}>
                                            <Icon className={`h-4 w-4 ${typeConfig.color}`} />
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="font-mono font-medium text-text-primary">
                                                {formatTime(trigger.trigger_time_seconds)}
                                              </span>
                                              <Badge variant={trigger.type === 'blocking' ? 'error' : trigger.type === 'action_check' ? 'success' : 'info'}>
                                                {typeConfig.label}
                                              </Badge>
                                            </div>
                                            <p className="text-sm text-text-secondary">{trigger.instruction_text}</p>
                                          </div>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => startEditingTrigger(phase.tempId, trigger)}
                                          >
                                            <Edit2 className="h-4 w-4 text-info" />
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => handleRemoveTrigger(phase.tempId, trigger.tempId)}
                                          >
                                            <Trash2 className="h-4 w-4 text-error" />
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}

                            {/* Botón para mostrar formulario de agregar */}
                            {!editingPhaseId && !editingTrigger && (
                              <div className="p-4 bg-surface-elevated border-t border-border">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => startAddingTrigger(phase.tempId)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Agregar Acción
                                </Button>
                              </div>
                            )}

                            {/* Formulario para Agregar Acción */}
                            {editingPhaseId === phase.tempId && !editingTrigger && (
                            <div className="p-4 bg-surface-elevated border-t border-border">
                              <div className="flex justify-between items-center mb-3">
                                <h5 className="text-sm font-medium text-text-primary">
                                  Agregar Acción Interna
                                </h5>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={cancelAddTrigger}
                                  className="text-error hover:bg-error/10"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-text-secondary mb-1">Tiempo (MM:SS)</label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="59"
                                      value={newTriggerMinutes}
                                      onChange={(e) => setNewTriggerMinutes(e.target.value)}
                                      placeholder="03"
                                      className="text-center"
                                    />
                                    <span className="flex items-center text-text-secondary">:</span>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="59"
                                      value={newTriggerSeconds}
                                      onChange={(e) => setNewTriggerSeconds(e.target.value.padStart(2, '0'))}
                                      placeholder="00"
                                      className="text-center"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs text-text-secondary mb-1">Tipo de Acción</label>
                                  <select
                                    value={newTriggerType}
                                    onChange={(e) => setNewTriggerType(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  >
                                    {TRIGGER_TYPES.map(t => (
                                      <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-xs text-text-secondary mb-1">Instrucción</label>
                                  <Input
                                    value={newTriggerText}
                                    onChange={(e) => setNewTriggerText(e.target.value)}
                                    placeholder="Ej: Agregar Manteca"
                                  />
                                </div>
                              </div>
                              <div className="mt-3 flex gap-2">
                                <Button variant="primary" size="sm" onClick={() => handleAddTrigger(phase.tempId)}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Agregar Acción
                                </Button>
                                <Button variant="outline" size="sm" onClick={cancelAddTrigger}>
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                            )}

                            {/* Formulario para Editar Acción */}
                            {editingTrigger?.phaseId === phase.tempId && (
                            <div className="p-4 bg-surface-elevated border-t border-border">
                              <h5 className="text-sm font-medium text-text-primary mb-3">
                                Editar Acción
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-text-secondary mb-1">Tiempo (MM:SS)</label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="59"
                                      value={newTriggerMinutes}
                                      onChange={(e) => setNewTriggerMinutes(e.target.value)}
                                      placeholder="03"
                                      className="text-center"
                                    />
                                    <span className="flex items-center text-text-secondary">:</span>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="59"
                                      value={newTriggerSeconds}
                                      onChange={(e) => setNewTriggerSeconds(e.target.value.padStart(2, '0'))}
                                      placeholder="00"
                                      className="text-center"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs text-text-secondary mb-1">Tipo de Acción</label>
                                  <select
                                    value={newTriggerType}
                                    onChange={(e) => setNewTriggerType(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  >
                                    {TRIGGER_TYPES.map(t => (
                                      <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-xs text-text-secondary mb-1">Instrucción</label>
                                  <Input
                                    value={newTriggerText}
                                    onChange={(e) => setNewTriggerText(e.target.value)}
                                    placeholder="Ej: Agregar Manteca"
                                  />
                                </div>
                              </div>
                              <div className="mt-3 flex gap-2">
                                <Button variant="primary" size="sm" onClick={saveEditTrigger}>
                                  Guardar Cambios
                                </Button>
                                <Button variant="outline" size="sm" onClick={cancelEditTrigger}>
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                            )}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-muted">
                    <Clock className="h-12 w-12 mx-auto mb-2" />
                    <p>No has agregado fases aún</p>
                    <p className="text-sm">Define el proceso de producción paso a paso</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Variantes (solo si has_variants es true) */}
            {currentStep === 4 && formData.has_variants && (
              <div className="space-y-4">
                {/* Agregar Variante */}
                <div className="bg-surface-elevated p-4 rounded-lg">
                  <h4 className="font-medium text-text-primary mb-3">Agregar Variante</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <Input
                        value={variantName}
                        onChange={(e) => setVariantName(e.target.value)}
                        placeholder="Ej: Chocolate, Integral, Nuez..."
                      />
                    </div>
                    <div>
                      <Button variant="outline" className="w-full" onClick={handleAddVariant}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Variante
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Lista de Variantes */}
                {variants.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-text-primary">Variantes del Producto</h4>
                      <Badge variant="info">{variants.length} variantes</Badge>
                    </div>

                    {variants.map((variant) => (
                      <Card key={variant.tempId} className="overflow-hidden">
                        {/* Header de Variante */}
                        <div className="p-4 bg-surface-elevated border-b border-border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                                <Layers className="h-5 w-5" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-text-primary">{variant.name}</h5>
                                <p className="text-sm text-text-secondary">
                                  Costo extra: <span className="font-medium text-primary">{formatCurrency(variant.extra_cost)}</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => toggleVariantEdit(variant.tempId)}
                              >
                                {variant.isEditing ? 'Cerrar' : 'Editar Ingredientes'}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveVariant(variant.tempId)}
                              >
                                <Trash2 className="h-4 w-4 text-error" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Ingredientes de la Variante */}
                        {variant.isEditing && editingVariantId === variant.tempId && (
                          <div className="p-4">
                            {/* Agregar ingrediente */}
                            <div className="mb-4 p-3 bg-surface rounded-lg">
                              <h6 className="text-sm font-medium text-text-secondary mb-2">
                                Agregar Ingrediente Extra
                              </h6>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <div className="md:col-span-2">
                                  <select
                                    value={variantIngredientId}
                                    onChange={(e) => {
                                      setVariantIngredientId(e.target.value);
                                      const item = inventoryItems.find(i => i.id === e.target.value);
                                      if (item) {
                                        const units = getCompatibleUnits(item.unit_purchase as UnitType);
                                        setVariantIngredientUnit(units[0] || 'g');
                                      }
                                    }}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  >
                                    <option value="">Seleccionar insumo...</option>
                                    {inventoryItems.map((item) => (
                                      <option key={item.id} value={item.id}>
                                        {item.name} - ${formatCurrency(item.cost_per_purchase_unit || 0)}/{item.unit_purchase}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={variantIngredientQty}
                                    onChange={(e) => setVariantIngredientQty(e.target.value)}
                                    placeholder="Cantidad"
                                    className="text-sm"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <select
                                    value={variantIngredientUnit}
                                    onChange={(e) => setVariantIngredientUnit(e.target.value as UnitType)}
                                    className="flex-1 px-2 py-2 border border-border rounded-lg bg-surface text-text-primary text-sm"
                                  >
                                    {getVariantIngredientUnits().map(u => (
                                      <option key={u} value={u}>{u}</option>
                                    ))}
                                  </select>
                                  <Button variant="primary" size="sm" onClick={handleAddVariantIngredient}>
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Tabla de ingredientes */}
                            {variant.ingredients.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-border">
                                      <th className="text-left py-2 px-2 text-xs font-medium text-text-secondary">Insumo</th>
                                      <th className="text-left py-2 px-2 text-xs font-medium text-text-secondary">Cantidad</th>
                                      <th className="text-right py-2 px-2 text-xs font-medium text-text-secondary">Costo Extra</th>
                                      <th className="text-center py-2 px-2 text-xs font-medium text-text-secondary"></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {variant.ingredients.map((ing, idx) => (
                                      <tr key={idx} className="border-b border-border last:border-0">
                                        <td className="py-2 px-2 text-sm">{ing.itemName}</td>
                                        <td className="py-2 px-2 text-sm">
                                          {ing.quantity} {ing.unit}
                                        </td>
                                        <td className="py-2 px-2 text-sm text-right">
                                          <span className="font-medium text-primary">{formatCurrency(ing.calculatedCost || 0)}</span>
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => handleRemoveVariantIngredient(variant.tempId, idx)}
                                          >
                                            <Trash2 className="h-3 w-3 text-error" />
                                          </Button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-sm text-text-muted text-center py-4">
                                No hay ingredientes extra agregados a esta variante
                              </p>
                            )}
                          </div>
                        )}

                        {/* Preview de ingredientes cuando está colapsado */}
                        {!variant.isEditing && variant.ingredients.length > 0 && (
                          <div className="px-4 pb-4">
                            <div className="flex flex-wrap gap-2">
                              {variant.ingredients.map((ing, idx) => (
                                <Badge key={idx} variant="neutral">
                                  {ing.itemName}: {ing.quantity}{ing.unit}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}

                    {/* Resumen */}
                    <div className="p-4 bg-surface-elevated rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-text-primary">Costo base del producto:</span>
                        <span className="text-primary font-semibold">{formatCurrency(calculateCostPerProductUnit())}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-muted">
                    <Layers className="h-12 w-12 mx-auto mb-2" />
                    <p>No has agregado variantes aún</p>
                    <p className="text-sm">Define variantes como "Chocolate", "Integral", etc.</p>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          {currentStep < steps.length ? (
            <Button variant="primary" onClick={() => setCurrentStep(currentStep + 1)}>
              Siguiente
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : 'Crear Producto'}
            </Button>
          )}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
