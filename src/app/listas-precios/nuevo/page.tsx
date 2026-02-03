/**
 * @file: src/app/listas-precios/nuevo/page.tsx
 * @purpose: Página para crear nueva lista de precios
 * @goal: Crear lista de precios con precios para cada producto
 * @context: Módulo Comercial - Creación de lista de precios
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
  DollarSign,
  Package,
  Calculator
} from 'lucide-react';
import { createPriceList } from '@/actions/priceLists';
import { getProducts } from '@/actions/products';
import { formatCurrency } from '@/lib/utils/formatters';

interface PriceItem {
  product_id: string;
  product_name: string;
  cost_price: number;
  price: string;
  margin: number;
}

export default function NuevaListaPreciosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
  });
  
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data } = await getProducts();
    if (data) {
      setProducts(data);
      // Inicializar items de precios
      const items = data.map((p: any) => {
        const costPrice = calculateProductCost(p);
        return {
          product_id: p.id,
          product_name: p.name,
          cost_price: costPrice,
          price: '',
          margin: 0,
        };
      });
      setPriceItems(items);
    }
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

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Ingresa el nombre de la lista');
      return;
    }

    // Filtrar solo los items con precio
    const itemsWithPrice = priceItems
      .filter(item => item.price && parseFloat(item.price) > 0)
      .map(item => ({
        product_id: item.product_id,
        price: parseFloat(item.price),
      }));

    setLoading(true);
    try {
      const { data, error } = await createPriceList(
        formData.name,
        formData.is_active,
        itemsWithPrice
      );

      if (error) {
        alert('Error: ' + error);
      } else {
        router.push('/listas-precios');
      }
    } catch (error) {
      alert('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const getMarginColor = (margin: number): string => {
    if (margin >= 50) return 'text-success';
    if (margin >= 30) return 'text-warning';
    if (margin > 0) return 'text-error';
    return 'text-text-muted';
  };

  return (
    <AppLayout>
      <PageContainer
        title="Nueva Lista de Precios"
        subtitle="Crear lista de precios para productos"
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información General */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Información General</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Nombre de la Lista *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Restaurantes"
                    />
                  </div>

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

                  <div className="p-4 bg-surface-elevated rounded-lg">
                    <div className="flex items-center mb-2">
                      <Calculator className="h-5 w-5 text-primary mr-2" />
                      <span className="font-medium text-text-primary">Resumen</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Productos con precio:</span>
                        <span className="font-medium">
                          {priceItems.filter(p => p.price && parseFloat(p.price) > 0).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Productos sin precio:</span>
                        <span className="font-medium">
                          {priceItems.filter(p => !p.price || parseFloat(p.price) === 0).length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="primary" 
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Guardando...' : 'Crear Lista'}
                  </Button>
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
