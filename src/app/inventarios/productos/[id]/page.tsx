/**
 * @file: src/app/inventarios/productos/[id]/page.tsx
 * @purpose: Página de detalle y edición de producto
 * @goal: Ver detalle, editar, gestionar receta y fases de producción con acciones internas
 * @context: Módulo Inventarios - Edición de producto
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
  Layers,
  Clock,
  Edit3,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Bell,
  CheckSquare,
  XOctagon
} from 'lucide-react';
import { getProductById, updateProduct, deactivateProduct, activateProduct } from '@/actions/products';
import { getInventoryItems } from '@/actions/inventory';
import { formatCurrency } from '@/lib/utils/formatters';

interface ProductoDetallePageProps {
  params: { id: string };
}

interface RecipeItem {
  inventory_item_id: string;
  quantity: number;
  itemName?: string;
  itemUnit?: string;
}

interface PhaseTrigger {
  id?: string;
  trigger_time_seconds: number;
  type: 'info' | 'action_check' | 'blocking';
  instruction_text: string;
}

interface ProductionPhase {
  id?: string;
  name: string;
  sequence_order: number;
  estimated_duration_minutes?: number;
  triggers: PhaseTrigger[];
  isExpanded?: boolean;
}

// Tipos de triggers
const TRIGGER_TYPES = [
  { value: 'info', label: 'Alerta Informativa', icon: Bell, color: 'text-info', bgColor: 'bg-info/10' },
  { value: 'action_check', label: 'Checkbox de Acción', icon: CheckSquare, color: 'text-success', bgColor: 'bg-success/10' },
  { value: 'blocking', label: 'Checkbox Bloqueante', icon: XOctagon, color: 'text-error', bgColor: 'bg-error/10' },
];

export default function ProductoDetallePage({ params }: ProductoDetallePageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'receta' | 'fases'>('info');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    batch_size_units: '',
    has_variants: false,
  });
  
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [phases, setPhases] = useState<ProductionPhase[]>([]);
  
  // Temporary states for adding items
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('');
  const [phaseName, setPhaseName] = useState('');
  const [phaseDuration, setPhaseDuration] = useState('');

  useEffect(() => {
    loadProduct();
    loadInventoryItems();
  }, [params.id]);

  const loadProduct = async () => {
    const { data, error } = await getProductById(params.id);
    if (error || !data) {
      alert('Error al cargar producto: ' + error);
      router.push('/inventarios/productos');
      return;
    }
    setProduct(data);
    setFormData({
      name: data.name || '',
      description: data.description || '',
      batch_size_units: data.batch_size_units?.toString() || '',
      has_variants: data.has_variants || false,
    });
    
    // Cargar recetas existentes
    if (data.recipes) {
      setRecipes(data.recipes.map((r: any) => ({
        inventory_item_id: r.inventory_item_id,
        quantity: r.quantity,
        itemName: r.inventory_item?.name,
        itemUnit: r.inventory_item?.unit_usage,
      })));
    }
    
    // Cargar fases existentes con triggers
    if (data.phases) {
      setPhases(data.phases.map((p: any) => ({
        id: p.id,
        name: p.name,
        sequence_order: p.sequence_order,
        estimated_duration_minutes: p.estimated_duration_minutes,
        triggers: p.triggers?.map((t: any) => ({
          id: t.id,
          trigger_time_seconds: t.trigger_time_seconds,
          type: t.type,
          instruction_text: t.instruction_text,
        })) || [],
        isExpanded: false,
      })).sort((a: any, b: any) => a.sequence_order - b.sequence_order));
    }
    
    setLoading(false);
  };

  const loadInventoryItems = async () => {
    const { data } = await getInventoryItems();
    if (data) {
      setInventoryItems(data.filter(item => !item.is_compound));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await updateProduct(
        params.id,
        {
          name: formData.name,
          description: formData.description || null,
          batch_size_units: parseInt(formData.batch_size_units) || 1,
          has_variants: formData.has_variants,
        },
        recipes.map(r => ({
          inventory_item_id: r.inventory_item_id,
          quantity: r.quantity,
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
        alert('Error al guardar: ' + error);
      } else {
        alert('Producto actualizado exitosamente');
        setIsEditing(false);
        loadProduct();
      }
    } catch (error) {
      alert('Error inesperado');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!product) return;
    
    const confirmMsg = product.is_active 
      ? '¿Estás seguro de desactivar este producto?' 
      : '¿Estás seguro de activar este producto?';
    
    if (!confirm(confirmMsg)) return;

    const action = product.is_active ? deactivateProduct : activateProduct;
    const { success, error } = await action(params.id);

    if (error) {
      alert('Error: ' + error);
    } else {
      alert(product.is_active ? 'Producto desactivado' : 'Producto activado');
      loadProduct();
    }
  };

  const handleAddRecipeItem = () => {
    if (!selectedItemId || !selectedQuantity || parseFloat(selectedQuantity) <= 0) {
      alert('Selecciona un ingrediente y una cantidad válida');
      return;
    }
    
    const item = inventoryItems.find(i => i.id === selectedItemId);
    if (!item) return;
    
    setRecipes([...recipes, {
      inventory_item_id: selectedItemId,
      quantity: parseFloat(selectedQuantity),
      itemName: item.name,
      itemUnit: item.unit_usage,
    }]);
    
    setSelectedItemId('');
    setSelectedQuantity('');
  };

  const handleRemoveRecipeItem = (index: number) => {
    setRecipes(recipes.filter((_, i) => i !== index));
  };

  const handleAddPhase = () => {
    if (!phaseName.trim()) {
      alert('Ingresa el nombre de la fase');
      return;
    }
    
    setPhases([...phases, {
      name: phaseName.trim(),
      sequence_order: phases.length + 1,
      estimated_duration_minutes: phaseDuration ? parseInt(phaseDuration) : undefined,
      triggers: [],
      isExpanded: true, // Auto-expand al agregar
    }]);
    
    setPhaseName('');
    setPhaseDuration('');
  };

  const handleRemovePhase = (index: number) => {
    const newPhases = phases.filter((_, i) => i !== index);
    setPhases(newPhases.map((p, i) => ({ ...p, sequence_order: i + 1 })));
  };

  const togglePhaseExpand = (index: number) => {
    setPhases(prev => prev.map((p, i) => 
      i === index ? { ...p, isExpanded: !p.isExpanded } : p
    ));
  };

  // Calcular costo estimado de producción
  const calculateEstimatedCost = () => {
    return recipes.reduce((total, recipe) => {
      const item = inventoryItems.find(i => i.id === recipe.inventory_item_id);
      if (!item) return total;
      const costPerUnit = (item.cost_per_purchase_unit || 0) / (item.quantity_per_purchase_unit || 1);
      return total + (costPerUnit * recipe.quantity);
    }, 0);
  };

  // Helper para formatear tiempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper para obtener configuración de tipo de trigger
  const getTriggerTypeConfig = (type: string) => {
    return TRIGGER_TYPES.find(t => t.value === type) || TRIGGER_TYPES[0];
  };

  if (loading) {
    return (
      <AppLayout>
        <PageContainer title="Cargando...">
          <div className="text-center py-12">Cargando producto...</div>
        </PageContainer>
      </AppLayout>
    );
  }

  const tabs = [
    { id: 'info', label: 'Información', icon: Package },
    { id: 'receta', label: 'Receta', icon: Layers },
    { id: 'fases', label: 'Fases', icon: Clock },
  ];

  return (
    <AppLayout>
      <PageContainer
        title={product?.name || 'Detalle de Producto'}
        subtitle={isEditing ? 'Editando producto' : 'Ver información del producto'}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            {!isEditing ? (
              <Button variant="primary" onClick={() => setIsEditing(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Editar
              </Button>
            ) : (
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            )}
          </div>
        }
      >
        {/* Tabs */}
        <div className="mb-6 border-b border-border">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Información General */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Información General</h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Nombre del Producto
                      </label>
                      {isEditing ? (
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      ) : (
                        <p className="text-text-primary font-medium text-lg">{product?.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Descripción
                      </label>
                      {isEditing ? (
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      ) : (
                        <p className="text-text-primary">{product?.description || 'Sin descripción'}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Tamaño del Lote
                        </label>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={formData.batch_size_units}
                            onChange={(e) => setFormData({ ...formData, batch_size_units: e.target.value })}
                          />
                        ) : (
                          <p className="text-text-primary">{product?.batch_size_units} unidades</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Estado
                        </label>
                        <Badge variant={product?.is_active ? 'success' : 'neutral'}>
                          {product?.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="has_variants"
                          checked={formData.has_variants}
                          onChange={(e) => setFormData({ ...formData, has_variants: e.target.checked })}
                          className="rounded border-border"
                        />
                        <label htmlFor="has_variants" className="text-sm text-text-secondary">
                          Este producto tiene variantes
                        </label>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Resumen</h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Ingredientes:</span>
                      <span className="font-medium">{recipes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Fases:</span>
                      <span className="font-medium">{phases.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Costo estimado:</span>
                      <span className="font-medium">{formatCurrency(calculateEstimatedCost())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Costo por unidad:</span>
                      <span className="font-medium">
                        {formatCurrency(calculateEstimatedCost() / (parseInt(formData.batch_size_units) || 1))}
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {isEditing && (
                <Button 
                  variant={product?.is_active ? 'danger' : 'primary'}
                  className="w-full"
                  onClick={handleToggleStatus}
                >
                  {product?.is_active ? 'Desactivar Producto' : 'Activar Producto'}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tab: Receta */}
        {activeTab === 'receta' && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Receta - Ingredientes</h3>
            </CardHeader>
            <CardBody>
              {isEditing && (
                <div className="bg-surface-elevated p-4 rounded-lg mb-6">
                  <h4 className="font-medium text-text-primary mb-3">Agregar Ingrediente</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <select
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Seleccionar insumo...</option>
                        {inventoryItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.unit_usage})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={selectedQuantity}
                        onChange={(e) => setSelectedQuantity(e.target.value)}
                        placeholder="Cantidad"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handleAddRecipeItem}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {recipes.length > 0 ? (
                <div className="space-y-2">
                  {recipes.map((recipe, index) => {
                    const item = inventoryItems.find(i => i.id === recipe.inventory_item_id);
                    const costPerUnit = item ? (item.cost_per_purchase_unit || 0) / (item.quantity_per_purchase_unit || 1) : 0;
                    const totalCost = costPerUnit * recipe.quantity;
                    
                    return (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg"
                      >
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-text-muted mr-3" />
                          <div>
                            <p className="font-medium text-text-primary">{recipe.itemName}</p>
                            <p className="text-sm text-text-secondary">
                              {recipe.quantity} {recipe.itemUnit}
                              {' '}• Costo: {formatCurrency(totalCost)}
                            </p>
                          </div>
                        </div>
                        {isEditing && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveRecipeItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-error" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  
                  <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-text-primary">Costo Total Estimado:</span>
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(calculateEstimatedCost())}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-text-muted">
                  <Layers className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg">No hay ingredientes en la receta</p>
                  {isEditing && <p className="text-sm mt-1">Agrega ingredientes para definir la receta</p>}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Tab: Fases */}
        {activeTab === 'fases' && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Fases de Producción</h3>
            </CardHeader>
            <CardBody>
              {isEditing && (
                <div className="bg-surface-elevated p-4 rounded-lg mb-6">
                  <h4 className="font-medium text-text-primary mb-3">Agregar Fase</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <Input
                        value={phaseName}
                        onChange={(e) => setPhaseName(e.target.value)}
                        placeholder="Nombre de la fase"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Input
                        type="number"
                        value={phaseDuration}
                        onChange={(e) => setPhaseDuration(e.target.value)}
                        placeholder="Duración (minutos) - Opcional"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handleAddPhase}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Fase
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {phases.length > 0 ? (
                <div className="space-y-3">
                  {phases.map((phase, index) => (
                    <div 
                      key={index} 
                      className={`bg-surface-elevated rounded-lg overflow-hidden ${phase.isExpanded ? 'border-l-4 border-l-primary' : ''}`}
                    >
                      {/* Header de Fase - Click para expandir */}
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface transition-colors"
                        onClick={() => togglePhaseExpand(index)}
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mr-4">
                            {phase.sequence_order}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{phase.name}</p>
                            {phase.estimated_duration_minutes && (
                              <p className="text-sm text-text-secondary">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {phase.estimated_duration_minutes} minutos
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {phase.triggers && phase.triggers.length > 0 && (
                            <Badge variant="info">{phase.triggers.length} acciones</Badge>
                          )}
                          {isEditing && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleRemovePhase(index); }}
                            >
                              <Trash2 className="h-4 w-4 text-error" />
                            </Button>
                          )}
                          {phase.isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-text-muted" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-text-muted" />
                          )}
                        </div>
                      </div>

                      {/* Contenido Expandido - Acciones Internas */}
                      {phase.isExpanded && phase.triggers && phase.triggers.length > 0 && (
                        <div className="border-t border-border p-4">
                          <h5 className="text-sm font-medium text-text-secondary mb-3">
                            Acciones Internas
                          </h5>
                          <div className="space-y-2">
                            {phase.triggers
                              .sort((a, b) => a.trigger_time_seconds - b.trigger_time_seconds)
                              .map((trigger, tIndex) => {
                                const typeConfig = getTriggerTypeConfig(trigger.type);
                                const Icon = typeConfig.icon;
                                
                                return (
                                  <div 
                                    key={tIndex}
                                    className="flex items-center gap-3 p-3 bg-surface rounded-lg"
                                  >
                                    <div className={`p-2 rounded ${typeConfig.bgColor}`}>
                                      <Icon className={`h-4 w-4 ${typeConfig.color}`} />
                                    </div>
                                    <div className="flex-1">
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
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Mensaje si no hay acciones */}
                      {phase.isExpanded && (!phase.triggers || phase.triggers.length === 0) && (
                        <div className="border-t border-border p-4 text-center text-text-muted">
                          <p className="text-sm">No hay acciones internas definidas para esta fase</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-text-muted">
                  <Clock className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg">No hay fases definidas</p>
                  {isEditing && <p className="text-sm mt-1">Agrega fases para el proceso de producción</p>}
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </PageContainer>
    </AppLayout>
  );
}
