/**
 * @file: src/app/comercial/pedidos/page.tsx
 * @purpose: Página de lista de pedidos (US-07, US-08)
 * @goal: Mostrar pedidos con estados, cliente y totales
 * @context: Módulo Comercial - Vista principal de pedidos
 */

import React from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus, ShoppingCart, Calendar, DollarSign, Edit } from 'lucide-react';
import { getOrders } from '@/actions/orders';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ORDER_STATUS_LABELS } from '@/lib/utils/constants';

export default async function PedidosPage() {
  const { data: orders, error } = await getOrders();

  if (error) {
    return (
      <AppLayout>
        <PageContainer title="Pedidos">
          <div className="text-center py-12">
            <p className="text-red-600">Error al cargar pedidos: {error}</p>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  // Calcular estadísticas
  const totalOrders = orders?.length || 0;
  const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
  const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

  // Función para obtener el color del badge según el estado
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'planned': return 'info';
      case 'in_production': return 'neutral';
      case 'completed': return 'success';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'neutral';
    }
  };

  return (
    <AppLayout>
      <PageContainer
        title="Gestión de Pedidos"
        subtitle={`${totalOrders} pedidos registrados`}
        actions={
          <Link 
            href="/comercial/pedidos/nuevo"
            className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-base bg-primary text-white hover:bg-primary-dark focus:ring-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Pedido
          </Link>
        }
      >
        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Pedidos</p>
                <p className="text-2xl font-bold text-text-primary">{totalOrders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Pendientes</p>
                <p className="text-2xl font-bold text-text-primary">{pendingOrders}</p>
              </div>
              <Calendar className="h-8 w-8 text-warning" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Valor Total</p>
                <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </Card>
        </div>

        {/* Tabla de Pedidos */}
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-elevated border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Pedido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Fecha Entrega
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border">
                  {orders && orders.length > 0 ? (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-surface-elevated transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <ShoppingCart className="h-5 w-5 text-text-muted mr-3" />
                            <div>
                              <div className="text-sm font-medium text-text-primary">
                                #{order.order_number}
                              </div>
                              <div className="text-xs text-text-muted">
                                {formatDate(order.created_at)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-text-primary">
                            {order.client?.name || 'Cliente desconocido'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-text-secondary">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(order.delivery_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-text-secondary">
                            {order.items?.length || 0} productos
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-text-primary">
                            {formatCurrency(order.total_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {ORDER_STATUS_LABELS[order.status] || order.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/comercial/pedidos/${order.id}`}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Ver Detalle
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <ShoppingCart className="h-12 w-12 text-text-muted mx-auto mb-4" />
                        <p className="text-text-secondary">No hay pedidos registrados</p>
                        <p className="text-sm text-text-muted mt-1">
                          Comienza creando tu primer pedido
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
