/**
 * @file: src/app/inventarios/insumos/[id]/page.tsx
 * @purpose: Página de detalle y edición de insumo
 * @goal: Ver detalle, editar y gestionar movimientos de stock
 * @context: Módulo Inventarios - Edición de insumo
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
  Minus, 
  History,
  Package,
  AlertTriangle,
  Edit3
} from 'lucide-react';
import { getInventoryItemById, updateInventoryItem, createStockMovement } from '@/actions/inventory';
import { formatQuantity, formatCurrency, formatDate } from '@/lib/utils/formatters';
import { getStockStatus } from '@/lib/utils/calculations';

interface InsumoDetallePageProps {
  params: { id: string };
}

export default function InsumoDetallePage({ params }: InsumoDetallePageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAction, setStockAction] = useState<'add' | 'remove'>('add');
  const [stockQty, setStockQty] = useState('');
  const [stockNotes, setStockNotes] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    unit_purchase: '',
    unit_usage: '',
    cost_per_purchase_unit: '',
    quantity_per_purchase_unit: '',
    min_stock_threshold: '',
    is_compound: false,
  });

  useEffect(() => {
    loadItem();
  }, [params.id]);

  const loadItem = async () => {
    const { data, error } = await getInventoryItemById(params.id);
    if (error) {
      alert('Error al cargar insumo: ' + error);
      router.push('/inventarios/insumos');
      return;
    }
    setItem(data);
    setFormData({
      name: data.name || '',
      unit_purchase: data.unit_purchase || '',
      unit_usage: data.unit_usage || '',
      cost_per_purchase_unit: data.cost_per_purchase_unit?.toString() || '',
      quantity_per_purchase_unit: data.quantity_per_purchase_unit?.toString() || '',
      min_stock_threshold: data.min_stock_threshold?.toString() || '',
      is_compound: data.is_compound || false,
    });
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await updateInventoryItem(params.id, {
        name: formData.name,
        unit_purchase: formData.unit_purchase,
        unit_usage: formData.unit_usage,
        cost_per_purchase_unit: parseFloat(formData.cost_per_purchase_unit) || 0,
        quantity_per_purchase_unit: parseFloat(formData.quantity_per_purchase_unit) || 1,
        min_stock_threshold: parseFloat(formData.min_stock_threshold) || 0,
        is_compound: formData.is_compound,
      });

      if (error) {
        alert('Error al guardar: ' + error);
      } else {
        alert('Insumo actualizado exitosamente');
        setIsEditing(false);
        loadItem();
      }
    } catch (error) {
      alert('Error inesperado');
    } finally {
      setSaving(false);
    }
  };

  const handleStockMovement = async () => {
    const qty = parseFloat(stockQty);
    if (!qty || qty <= 0) {
      alert('Ingresa una cantidad válida');
      return;
    }

    const qtyChange = stockAction === 'add' ? qty : -qty;
    
    try {
      const { error } = await createStockMovement({
        item_id: params.id,
        qty_change: qtyChange,
        move_type: 'adjustment',
        notes: stockNotes || (stockAction === 'add' ? 'Ajuste positivo' : 'Ajuste negativo'),
      });

      if (error) {
        alert('Error al registrar movimiento: ' + error);
      } else {
        alert('Movimiento registrado exitosamente');
        setShowStockModal(false);
        setStockQty('');
        setStockNotes('');
        loadItem();
      }
    } catch (error) {
      alert('Error inesperado');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <PageContainer title="Cargando...">
          <div className="text-center py-12">Cargando insumo...</div>
        </PageContainer>
      </AppLayout>
    );
  }

  const stockStatus = item ? getStockStatus(item.current_stock, item.min_stock_threshold) : 'ok';

  return (
    <AppLayout>
      <PageContainer
        title={item?.name || 'Detalle de Insumo'}
        subtitle="Ver y editar información del insumo"
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
        {/* Alerta de Stock Bajo */}
        {stockStatus !== 'ok' && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            stockStatus === 'critical' 
              ? 'bg-red-50 border-red-500' 
              : 'bg-yellow-50 border-yellow-500'
          }`}>
            <div className="flex items-center">
              <AlertTriangle className={`h-5 w-5 mr-3 ${
                stockStatus === 'critical' ? 'text-red-600' : 'text-yellow-600'
              }`} />
              <div>
                <p className={`font-medium ${
                  stockStatus === 'critical' ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  Stock {stockStatus === 'critical' ? 'Crítico' : 'Bajo'}
                </p>
                <p className="text-sm text-text-muted">
                  Stock actual: {formatQuantity(item?.current_stock || 0, item?.unit_usage)}
                  {' '}(mínimo: {formatQuantity(item?.min_stock_threshold || 0, item?.unit_usage)})
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Información General</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Nombre del Insumo
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    ) : (
                      <p className="text-text-primary font-medium">{item?.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Categoría
                    </label>
                    {item?.category ? (
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${item.category.color_hex}20`,
                          color: item.category.color_hex,
                        }}
                      >
                        {item.category.name}
                      </span>
                    ) : (
                      <span className="text-text-muted">Sin categoría</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Unidad de Compra
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.unit_purchase}
                        onChange={(e) => setFormData({ ...formData, unit_purchase: e.target.value })}
                        placeholder="Ej: Bulto, Caja, Kg"
                      />
                    ) : (
                      <p className="text-text-primary">{item?.unit_purchase || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Unidad de Uso
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.unit_usage}
                        onChange={(e) => setFormData({ ...formData, unit_usage: e.target.value })}
                        placeholder="Ej: Kg, g, L"
                      />
                    ) : (
                      <p className="text-text-primary">{item?.unit_usage || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Cantidad por Unidad de Compra
                    </label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.quantity_per_purchase_unit}
                        onChange={(e) => setFormData({ ...formData, quantity_per_purchase_unit: e.target.value })}
                        placeholder="Ej: 50 (si un bulto tiene 50kg)"
                      />
                    ) : (
                      <p className="text-text-primary">
                        {item?.quantity_per_purchase_unit} {item?.unit_usage}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Costo por Unidad de Compra
                    </label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.cost_per_purchase_unit}
                        onChange={(e) => setFormData({ ...formData, cost_per_purchase_unit: e.target.value })}
                        placeholder="Ej: 450.00"
                      />
                    ) : (
                      <p className="text-text-primary">{formatCurrency(item?.cost_per_purchase_unit || 0)}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Stock Mínimo (alerta)
                    </label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.min_stock_threshold}
                        onChange={(e) => setFormData({ ...formData, min_stock_threshold: e.target.value })}
                        placeholder="Ej: 10"
                      />
                    ) : (
                      <p className="text-text-primary">
                        {formatQuantity(item?.min_stock_threshold || 0, item?.unit_usage)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Tipo de Insumo
                    </label>
                    <Badge variant={item?.is_compound ? 'info' : 'neutral'}>
                      {item?.is_compound ? 'Mezcla/Compuesto' : 'Simple'}
                    </Badge>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Composición (solo si es compuesto) */}
            {item?.is_compound && item?.compositions && item.compositions.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Composición (Ingredientes)</h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {item.compositions.map((comp: any) => (
                      <div key={comp.id} className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 text-text-muted mr-2" />
                          <span className="text-text-primary">{comp.ingredient?.name}</span>
                        </div>
                        <span className="text-text-secondary">
                          {comp.quantity_needed} {comp.ingredient?.unit_usage}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Panel Lateral - Stock y Acciones */}
          <div className="space-y-6">
            {/* Tarjeta de Stock Actual */}
            <Card className={`${
              stockStatus === 'ok' ? 'border-l-4 border-l-success' :
              stockStatus === 'low' ? 'border-l-4 border-l-warning' :
              'border-l-4 border-l-error'
            }`}>
              <CardHeader>
                <h3 className="text-lg font-semibold">Stock Actual</h3>
              </CardHeader>
              <CardBody>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-text-primary">
                    {formatQuantity(item?.current_stock || 0, item?.unit_usage)}
                  </p>
                  <Badge 
                    variant={stockStatus === 'ok' ? 'success' : stockStatus === 'low' ? 'warning' : 'error'}
                    className="mt-2"
                  >
                    {stockStatus === 'ok' ? 'Stock OK' : stockStatus === 'low' ? 'Stock Bajo' : 'Stock Crítico'}
                  </Badge>
                </div>
                <div className="mt-4 space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => { setStockAction('add'); setShowStockModal(true); }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Entrada de Stock
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => { setStockAction('remove'); setShowStockModal(true); }}
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Salida de Stock
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Información Adicional */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Información Adicional</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Última actualización:</span>
                    <span className="text-text-primary">
                      {item?.updated_at ? formatDate(item.updated_at) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Costo por {item?.unit_usage}:</span>
                    <span className="text-text-primary">
                      {formatCurrency((item?.cost_per_purchase_unit || 0) / (item?.quantity_per_purchase_unit || 1))}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </PageContainer>

      {/* Modal de Movimiento de Stock */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h3 className="text-lg font-semibold">
                {stockAction === 'add' ? 'Entrada de Stock' : 'Salida de Stock'}
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Cantidad ({item?.unit_usage})
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value)}
                    placeholder={`Ingresa la cantidad en ${item?.unit_usage}`}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Notas / Motivo
                  </label>
                  <Input
                    value={stockNotes}
                    onChange={(e) => setStockNotes(e.target.value)}
                    placeholder="Ej: Compra a proveedor, Ajuste de inventario"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowStockModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant={stockAction === 'add' ? 'primary' : 'danger'}
                    className="flex-1"
                    onClick={handleStockMovement}
                    disabled={!stockQty || parseFloat(stockQty) <= 0}
                  >
                    {stockAction === 'add' ? (
                      <><Plus className="h-4 w-4 mr-2" /> Agregar</>
                    ) : (
                      <><Minus className="h-4 w-4 mr-2" /> Retirar</>
                    )}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
