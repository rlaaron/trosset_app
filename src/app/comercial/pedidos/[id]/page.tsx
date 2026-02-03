/**
 * @file: src/app/comercial/pedidos/[id]/page.tsx
 * @purpose: Página de detalle de pedido
 * @goal: Ver detalle completo del pedido con items, cliente y estado
 * @context: Módulo Comercial - Detalle de pedido
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  ArrowLeft, 
  ShoppingCart,
  User,
  Package,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { getOrderById, updateOrderStatus, deleteOrder } from '@/actions/orders';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ORDER_STATUS_LABELS } from '@/lib/utils/constants';

interface PedidoDetallePageProps {
  params: { id: string };
}

export default function PedidoDetallePage({ params }: PedidoDetallePageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  const loadOrder = async () => {
    const { data, error } = await getOrderById(params.id);
    if (error || !data) {
      alert('Error al cargar pedido: ' + error);
      router.push('/comercial/pedidos');
      return;
    }
    setOrder(data);
    setLoading(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`¿Cambiar estado a "${ORDER_STATUS_LABELS[newStatus] || newStatus}"?`)) return;

    const { error } = await updateOrderStatus(params.id, newStatus);
    if (error) {
      alert('Error al actualizar estado: ' + error);
    } else {
      alert('Estado actualizado exitosamente');
      loadOrder();
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este pedido? Solo se pueden eliminar pedidos pendientes.')) return;

    const { success, error } = await deleteOrder(params.id);
    if (error) {
      alert('Error: ' + error);
    } else if (success) {
      alert('Pedido eliminado exitosamente');
      router.push('/comercial/pedidos');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5" />;
      case 'planned': return <Calendar className="h-5 w-5" />;
      case 'in_production': return <Package className="h-5 w-5" />;
      case 'completed': return <CheckCircle className="h-5 w-5" />;
      case 'delivered': return <Truck className="h-5 w-5" />;
      case 'cancelled': return <XCircle className="h-5 w-5" />;
      default: return <ShoppingCart className="h-5 w-5" />;
    }
  };

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

  if (loading) {
    return (
      <AppLayout>
        <PageContainer title="Cargando...">
          <div className="text-center py-12">Cargando pedido...</div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <PageContainer title="Pedido no encontrado">
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-warning mx-auto mb-4" />
            <p className="text-text-secondary">El pedido no existe o no se pudo cargar</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.push('/comercial/pedidos')}
            >
              Volver a Pedidos
            </Button>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageContainer
        title={`Pedido #${order.order_number}`}
        subtitle={`Creado el ${formatDate(order.created_at)}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            {order.status === 'pending' && (
              <Button variant="danger" onClick={handleDelete}>
                <XCircle className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            )}
          </div>
        }
      >
        {/* Estado del Pedido */}
        <div className="mb-6">
          <Card className={`border-l-4 ${
            order.status === 'pending' ? 'border-l-warning' :
            order.status === 'planned' ? 'border-l-info' :
            order.status === 'in_production' ? 'border-l-primary' :
            order.status === 'completed' ? 'border-l-success' :
            order.status === 'delivered' ? 'border-l-success' :
            'border-l-error'
          }`}>
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full mr-4 ${
                    order.status === 'pending' ? 'bg-warning/10 text-warning' :
                    order.status === 'planned' ? 'bg-info/10 text-info' :
                    order.status === 'in_production' ? 'bg-primary/10 text-primary' :
                    order.status === 'completed' ? 'bg-success/10 text-success' :
                    order.status === 'delivered' ? 'bg-success/10 text-success' :
                    'bg-error/10 text-error'
                  }`}>
                    {getStatusIcon(order.status)}
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Estado del Pedido</p>
                    <Badge variant={getStatusBadgeVariant(order.status)} className="text-base">
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </Badge>
                  </div>
                </div>
                
                {/* Acciones de Estado */}
                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleStatusChange('planned')}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Planificar
                    </Button>
                  )}
                  {order.status === 'planned' && (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => handleStatusChange('in_production')}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Iniciar Producción
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleStatusChange('pending')}
                      >
                        Desplanificar
                      </Button>
                    </>
                  )}
                  {order.status === 'in_production' && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleStatusChange('completed')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Completar
                    </Button>
                  )}
                  {order.status === 'completed' && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleStatusChange('delivered')}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Entregar
                    </Button>
                  )}
                  {(order.status === 'pending' || order.status === 'planned') && (
                    <Button 
                      variant="danger" 
                      onClick={() => handleStatusChange('cancelled')}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información del Cliente */}
          <div>
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Cliente
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-text-secondary">Nombre</p>
                    <p className="font-medium text-text-primary">{order.client?.name}</p>
                  </div>
                  {order.client?.contact_name && (
                    <div>
                      <p className="text-sm text-text-secondary">Contacto</p>
                      <p className="text-text-primary">{order.client.contact_name}</p>
                    </div>
                  )}
                  {order.client?.phone && (
                    <div>
                      <p className="text-sm text-text-secondary">Teléfono</p>
                      <p className="text-text-primary">{order.client.phone}</p>
                    </div>
                  )}
                  {order.client?.email && (
                    <div>
                      <p className="text-sm text-text-secondary">Email</p>
                      <p className="text-text-primary">{order.client.email}</p>
                    </div>
                  )}
                  {order.client?.address_delivery && (
                    <div>
                      <p className="text-sm text-text-secondary">Dirección de Entrega</p>
                      <p className="text-text-primary">{order.client.address_delivery}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Información de Entrega */}
            <Card className="mt-6">
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Entrega
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-text-secondary">Fecha de Entrega</p>
                    <p className="font-medium text-text-primary">{formatDate(order.delivery_date)}</p>
                  </div>
                  {order.production_day_id && (
                    <div>
                      <p className="text-sm text-text-secondary">Día de Producción</p>
                      <Badge variant="info">Asignado</Badge>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Notas Internas */}
            {order.internal_notes && (
              <Card className="mt-6">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Notas Internas</h3>
                </CardHeader>
                <CardBody>
                  <p className="text-text-primary">{order.internal_notes}</p>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Productos del Pedido */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Productos ({order.items?.length || 0})
                </h3>
              </CardHeader>
              <CardBody className="p-0">
                {order.items && order.items.length > 0 ? (
                  <div className="divide-y divide-border">
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-4">
                            <Package className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">
                              {item.product?.name || 'Producto'}
                            </p>
                            <p className="text-sm text-text-secondary">
                              {item.quantity} unidades
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-text-primary">
                            {formatCurrency(item.quantity * item.unit_price_snapshot)}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {formatCurrency(item.unit_price_snapshot)} c/u
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Total */}
                    <div className="p-4 bg-surface-elevated">
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">
                          Total ({order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)} unidades)
                        </span>
                        <span className="text-2xl font-bold text-primary">
                          {formatCurrency(order.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-text-muted">
                    <Package className="h-12 w-12 mx-auto mb-4" />
                    <p>No hay productos en este pedido</p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Historial de Estados (placeholder) */}
            <Card className="mt-6">
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Historial
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-success mt-2 mr-3" />
                    <div>
                      <p className="font-medium text-text-primary">Pedido Creado</p>
                      <p className="text-sm text-text-secondary">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                  {order.production_day_id && (
                    <div className="flex items-start">
                      <div className="w-2 h-2 rounded-full bg-info mt-2 mr-3" />
                      <div>
                        <p className="font-medium text-text-primary">Asignado a Día de Producción</p>
                        <p className="text-sm text-text-secondary">
                          El pedido está planificado para producción
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
