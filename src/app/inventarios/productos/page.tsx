/**
 * @file: src/app/inventarios/productos/page.tsx
 * @purpose: Página de lista de productos terminados
 * @goal: Mostrar productos con sus recetas, fases y precios
 * @context: Módulo Inventarios - Vista de productos
 */

import React from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus, Package, Edit, Layers, Clock } from 'lucide-react';
import { getProducts } from '@/actions/products';

export default async function ProductosPage() {
  const { data: products, error } = await getProducts();

  if (error) {
    return (
      <AppLayout>
        <PageContainer title="Productos">
          <div className="text-center py-12">
            <p className="text-red-600">Error al cargar productos: {error}</p>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  const totalProducts = products?.length || 0;
  const productsWithRecipes = products?.filter(p => p.recipes && p.recipes.length > 0).length || 0;
  const productsWithPhases = products?.filter(p => p.phases && p.phases.length > 0).length || 0;

  return (
    <AppLayout>
      <PageContainer
        title="Gestión de Productos"
        subtitle={`${totalProducts} productos registrados`}
        actions={
          <Link 
            href="/inventarios/productos/nuevo"
            className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-base bg-primary text-white hover:bg-primary-dark focus:ring-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Link>
        }
      >
        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Productos</p>
                <p className="text-2xl font-bold text-text-primary">{totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Con Recetas</p>
                <p className="text-2xl font-bold text-text-primary">{productsWithRecipes}</p>
              </div>
              <Layers className="h-8 w-8 text-accent" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Con Fases</p>
                <p className="text-2xl font-bold text-text-primary">{productsWithPhases}</p>
              </div>
              <Clock className="h-8 w-8 text-info" />
            </div>
          </Card>
        </div>

        {/* Tabla de Productos */}
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-elevated border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Tamaño de Lote
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Receta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Fases
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
                  {products && products.length > 0 ? (
                    products.map((product) => {
                      const recipesCount = product.recipes?.length || 0;
                      const phasesCount = product.phases?.length || 0;
                      
                      return (
                        <tr key={product.id} className="hover:bg-surface-elevated transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Package className="h-5 w-5 text-text-muted mr-3" />
                              <div>
                                <div className="text-sm font-medium text-text-primary">
                                  {product.name}
                                </div>
                                {product.description && (
                                  <div className="text-xs text-text-muted truncate max-w-xs">
                                    {product.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-text-primary">
                              {product.batch_size_units} unidades
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={recipesCount > 0 ? 'success' : 'neutral'}>
                              {recipesCount > 0 ? `${recipesCount} ingredientes` : 'Sin receta'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={phasesCount > 0 ? 'info' : 'neutral'}>
                              {phasesCount > 0 ? `${phasesCount} fases` : 'Sin fases'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={product.has_variants ? 'warning' : 'neutral'}>
                              {product.has_variants ? 'Con variantes' : 'Estándar'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              href={`/inventarios/productos/${product.id}`}
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
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Package className="h-12 w-12 text-text-muted mx-auto mb-4" />
                        <p className="text-text-secondary">No hay productos registrados</p>
                        <p className="text-sm text-text-muted mt-1">
                          Comienza agregando tu primer producto
                        </p>
                        <Link 
                          href="/inventarios/productos/nuevo"
                          className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-base bg-primary text-white hover:bg-primary-dark focus:ring-primary mt-4"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Crear Primer Producto
                        </Link>
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
