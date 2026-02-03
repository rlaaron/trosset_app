/**
 * @file: src/app/listas-precios/[id]/page.tsx
 * @purpose: Página de detalle y edición de lista de precios
 * @goal: Ver y editar lista de precios con precios por producto
 * @context: Módulo Comercial - Edición de lista de precios
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
  Edit3,
  Package,
  Calculator,
  DollarSign
} from 'lucide-react';
import { getPriceListById, updatePriceList, togglePriceListStatus, deletePriceList } from '@/actions/priceLists';
import { getProducts } from '@/actions/products';
import { formatCurrency } from '@/lib/utils/formatters';

interface PriceListDetailPageProps {
  params: { id: string };
}

interface PriceItem {
  product_id: string;
  product_name: string;
  cost_price: number;
  price: string;
  margin: number;
}

export default function PriceListDetailPage({ params }: PriceListDetailPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [priceList, setPriceList] = useState<any>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
  });
  
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    setLoading(true);
    
    // Cargar lista de precios
    const { data: listData, error: listError } = await getPriceListById(params.id);
    if (listError || !listData) {
      alert('Error al cargar lista: ' + listError);
      router.push('/listas-precios');
      return;
    }
    
    setPriceList(listData);
    setFormData({
      name: listData.name,
      is_active: listData.is_active,
    });

    // Cargar todos los productos
    const { data: productsData } = await getProducts();
    if (productsData) {
      setAllProducts(productsData);
      
      // Crear mapa de precios existentes
      const existingPrices = new Map();
      listData.items?.forEach((item: any) => {
        existingPrices.set(item.product_id, item.price);
      });
      
      // Inicializar items de precios
      const items = productsData.map((p: any) => {
        const costPrice = calculateProductCost(p);
        const existingPrice = existingPrices.get(p.id);
        const price = existingPrice || '';
        const margin = price ? ((parseFloat(price) - costPrice) / costPrice) * 100 : 0;
        
        return {
          product_id: p.id,
          product_name: p.name,
          cost_price: costPrice,
          price: price.toString(),
          margin: Math.round(margin * 100) / 100,
        };
      });
      
      setPriceItems(items);
    }
    
    setLoading(false);
  };

  // Calcular costo de producción del producto
  const calculateProductCost = (product: any): number => {
    if (!product.recipes) return 0;
    return product.recipes.reduce((total: number, recipe: any) => {
      const itemCost = recipe.inventory_item?.cost_per_purchase_unit || 0;
      const itemQty = recipe.inventory_item?.quantity_per_purchase_unit || 1;
      const costPerUnit = itemCost / itemQty;
      return total + (costPerUnit * recipe.quantity);
    }, 0);
  };

  const handlePriceChange = (index: number, value: string) => {
    setPriceItems(prev => {
      const updated = [...prev];
      const price = parseFloat(value) || 0;
      const cost = updated[index].cost_price;
      const margin = cost > 0 ? ((price - cost) / cost) * 100 : 0;
      
      updated[index] = {
        ...updated[index],
        price: value,
        margin: Math.round(margin * 100) / 100,
      };
      return updated;
    });
  };

  const handleSave = async () => {
    // Filtrar solo los items con precio
    const itemsWithPrice = priceItems
      .filter(item => item.price && parseFloat(item.price) > 0)
      .map(item => ({
        product_id: item.product_id,
        price: parseFloat(item.price),
      }));

    setSaving(true);
    try {
      const { error } = await updatePriceList(
        params.id,
        formData.name,
        formData.is_active,
        itemsWithPrice
      );

      if (error) {
        alert('Error: ' + error);
      } else {
        alert('Lista actualizada exitosamente');
        setIsEditing(false);
        loadData();
      }
    } catch (error) {
      alert('Error inesperado');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = !formData.is_active;
    const confirmMsg = newStatus 
      ? '¿Activar esta lista?' 
      : '¿Desactivar esta lista?';
    
    if (!confirm(confirmMsg)) return;

    const { success, error } = await togglePriceListStatus(params.id, newStatus);
    if (success) {
      setFormData({ ...formData, is_active: newStatus });
      loadData();
    } else {
      alert('Error: ' + error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar la lista "${formData.name}"?`)) return;

    const { success, error } = await deletePriceList(params.id);
    if (success) {
      router.push('/listas-precios');
    } else {
      alert('Error: ' + error);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <PageContainer title="Cargando...">
          <div className="text-center py-12">Cargando lista de precios...</div>
        </PageContainer>
      </AppLayout>
    );
  }

  const productsWithPrice = priceItems.filter(p => p.price && parseFloat(p.price) > 0).length;
  const productsWithoutPrice = priceItems.filter(p => !p.price || parseFloat(p.price) === 0).length;

  return (
    <AppLayout>
      <PageContainer
        title={priceList?.name || 'Lista de Precios'}
        subtitle={isEditing ? 'Editando lista' : 'Ver lista de precios'}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información General */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Información General</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Nombre de la Lista
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    ) : (
                      <p className="text-text-primary font-medium text-lg">{formData.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Estado
                    </label>
                    <Badge variant={formData.is_active ? 'success' : 'neutral'}>
                      {formData.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>

                  {isEditing && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="rounded border-border h-4 w-4"
                      />
                      <label htmlFor="is_active" className="text-sm text-text-secondary">
                        Lista activa
                      </label>
                    </div>
                  )}

                  <div className="p-4 bg-surface-elevated rounded-lg">
                    <div className="flex items-center mb-2">
                      <Calculator className="h-5 w-5 text-primary mr-2" />
                      <span className="font-medium text-text-primary">Resumen</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Productos con precio:</span>
                        <span className="font-medium">{productsWithPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Productos sin precio:</span>
                        <span className="font-medium">{productsWithoutPrice}</span>
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <>
                      <Button 
                        variant={formData.is_active ? 'danger' : 'primary'}
                        className="w-full"
                        onClick={handleToggleStatus}
                      >
                        {formData.is_active ? 'Desactivar Lista' : 'Activar Lista'}
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full text-error border-error hover:bg-error/10"
                        onClick={handleDelete}
                      >
                        Eliminar Lista
                      </Button>
                    </>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Tabla de Precios */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Precios por Producto</h3>
              </CardHeader>
              <CardBody>
                {priceItems.length === 0 ? (
                  <div className="text-center py-12 text-text-muted">
                    <Package className="h-16 w-16 mx-auto mb-4" />
                    <p>No hay productos disponibles</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2 text-sm font-medium text-text-secondary">Producto</th>
                          <th className="text-right py-3 px-2 text-sm font-medium text-text-secondary">Costo</th>
                          <th className="text-right py-3 px-2 text-sm font-medium text-text-secondary">Precio Venta</th>
                          <th className="text-right py-3 px-2 text-sm font-medium text-text-secondary">Margen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {priceItems.map((item, index) => (
                          <tr 
                            key={item.product_id} 
                            className={`border-b border-border last:border-0 ${
                              item.price ? 'bg-primary/5' : ''
                            }`}
                          >
                            <td className="py-3 px-2">
                              <div className="flex items-center">
                                <Package className="h-4 w-4 text-text-muted mr-2" />
                                <span className="font-medium text-text-primary">{item.product_name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className="text-text-secondary">{formatCurrency(item.cost_price)}</span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              {isEditing ? (
                                <div className="flex items-center justify-end">
                                  <span className="text-text-muted mr-1">$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={item.price}
                                    onChange={(e) => handlePriceChange(index, e.target.value)}
                                    placeholder="0.00"
                                    className="w-24 text-right"
                                  />
                                </div>
                              ) : (
                                <span className="font-medium text-text-primary">
                                  {item.price ? formatCurrency(parseFloat(item.price)) : '-'}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-2 text-right">
                              {item.price ? (
                                <Badge variant={item.margin >= 30 ? 'success' : item.margin > 0 ? 'warning' : 'error'}>
                                  {item.margin.toFixed(1)}%
                                </Badge>
                              ) : (
                                <span className="text-text-muted">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
