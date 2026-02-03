/**
 * @file: src/app/inventarios/insumos/page.tsx
 * @purpose: Página de lista de insumos con filtros y acciones (US-03)
 * @goal: Mostrar inventario, alertas de stock bajo y permitir gestión de insumos
 * @context: Módulo Inventarios - Vista principal de insumos
 */

import React from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus, AlertTriangle, Package, Edit } from 'lucide-react';
import { getInventoryItems } from '@/actions/inventory';
import { formatQuantity } from '@/lib/utils/formatters';
import { getStockStatus } from '@/lib/utils/calculations';

export default async function InsumosPage() {
  const { data: items, error } = await getInventoryItems();

  if (error) {
    return (
      <AppLayout>
        <PageContainer title="Insumos">
          <div className="text-center py-12">
            <p className="text-red-600">Error al cargar insumos: {error}</p>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  // Calcular estadísticas
  const totalItems = items?.length || 0;
  const lowStockCount = items?.filter(item => 
    getStockStatus(item.current_stock, item.min_stock_threshold) !== 'ok'
  ).length || 0;

  return (
    <AppLayout>
      <PageContainer
        title="Gestión de Insumos"
        subtitle={`${totalItems} insumos registrados`}
        actions={
          <Link 
            href="/inventarios/insumos/nuevo"
            className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-base bg-primary text-white hover:bg-primary-dark focus:ring-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Insumo
          </Link>
        }
      >
        {/* Alertas de Stock */}
        {lowStockCount > 0 && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  {lowStockCount} insumo{lowStockCount > 1 ? 's' : ''} con stock bajo
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Revisa los niveles de inventario y realiza compras necesarias
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de Insumos */}
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-elevated border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Insumo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Stock Actual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Mín. Reorden
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border">
                  {items && items.length > 0 ? (
                    items.map((item) => {
                      const stockStatus = getStockStatus(item.current_stock, item.min_stock_threshold);
                      
                      return (
                        <tr key={item.id} className="hover:bg-surface-elevated transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Package className="h-5 w-5 text-text-muted mr-3" />
                              <div>
                                <div className="text-sm font-medium text-text-primary">
                                  {item.name}
                                </div>
                                <div className="text-xs text-text-muted">
                                  {item.unit_usage}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.category ? (
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
                              <span className="text-sm text-text-muted">Sin categoría</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-text-primary">
                              {formatQuantity(item.current_stock, item.unit_usage)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-text-secondary">
                              {formatQuantity(item.min_stock_threshold, item.unit_usage)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={
                                stockStatus === 'ok' ? 'success' :
                                stockStatus === 'low' ? 'warning' :
                                'error'
                              }
                            >
                              {stockStatus === 'ok' ? 'OK' :
                               stockStatus === 'low' ? 'Bajo' :
                               stockStatus === 'critical' ? 'Crítico' : 'Agotado'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={item.is_compound ? 'info' : 'neutral'}>
                              {item.is_compound ? 'Mezcla' : 'Simple'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              href={`/inventarios/insumos/${item.id}`}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Ver / Editar
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Package className="h-12 w-12 text-text-muted mx-auto mb-4" />
                        <p className="text-text-secondary">No hay insumos registrados</p>
                        <p className="text-sm text-text-muted mt-1">
                          Comienza agregando tu primer insumo
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </PageContainer>
    </AppLayout>
  );
}
