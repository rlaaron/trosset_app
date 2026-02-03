/**
 * @file: src/app/planificacion/page.tsx
 * @purpose: Página de planificación de producción (US-09, US-10)
 * @goal: Gestionar días de producción, calcular lotes y consolidar insumos
 * @context: Módulo Planificación - Vista principal
 */

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Plus, Calendar, Package, CheckCircle } from 'lucide-react';
import { getProductionDays } from '@/actions/planning';
import { formatDate } from '@/lib/utils/formatters';
import { PRODUCTION_DAY_STATUS_LABELS } from '@/lib/utils/constants';

export default async function PlanificacionPage() {
  const { data: productionDays, error } = await getProductionDays();

  if (error) {
    return (
      <AppLayout>
        <PageContainer title="Planificación">
          <div className="text-center py-12">
            <p className="text-red-600">Error al cargar días de producción: {error}</p>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  // Calcular estadísticas
  const totalDays = productionDays?.length || 0;
  const draftDays = productionDays?.filter(d => d.status === 'draft').length || 0;
  const publishedDays = productionDays?.filter(d => d.status === 'published').length || 0;

  // Función para obtener el color del badge según el estado
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'warning';
      case 'published': return 'info';
      case 'closed': return 'neutral';
      default: return 'neutral';
    }
  };

  return (
    <AppLayout>
      <PageContainer
        title="Planificación de Producción"
        subtitle={`${totalDays} días de producción`}
        actions={
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Día de Producción
          </Button>
        }
      >
        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Días</p>
                <p className="text-2xl font-bold text-text-primary">{totalDays}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Borradores</p>
                <p className="text-2xl font-bold text-text-primary">{draftDays}</p>
              </div>
              <Package className="h-8 w-8 text-warning" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Publicados</p>
                <p className="text-2xl font-bold text-text-primary">{publishedDays}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </Card>
        </div>

        {/* Lista de Días de Producción */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {productionDays && productionDays.length > 0 ? (
            productionDays.map((day) => {
              const ordersCount = day.orders?.length || 0;
              
              return (
                <Card key={day.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary">
                            {formatDate(day.production_date, 'EEEE dd MMM yyyy')}
                          </h3>
                          {day.delivery_date && (
                            <p className="text-sm text-text-muted">
                              Entrega: {formatDate(day.delivery_date)}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(day.status)}>
                        {PRODUCTION_DAY_STATUS_LABELS[day.status] || day.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">Pedidos asignados:</span>
                        <span className="text-sm font-medium text-text-primary">
                          {ordersCount} pedidos
                        </span>
                      </div>
                      
                      {ordersCount > 0 && (
                        <div className="pt-3 border-t border-border">
                          <p className="text-xs text-text-muted mb-2">Clientes:</p>
                          <div className="flex flex-wrap gap-2">
                            {day.orders?.slice(0, 3).map((order: any) => (
                              <Badge key={order.id} variant="neutral" className="text-xs">
                                {order.client?.name || 'Cliente'}
                              </Badge>
                            ))}
                            {ordersCount > 3 && (
                              <Badge variant="neutral" className="text-xs">
                                +{ordersCount - 3} más
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="pt-3 flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          Ver Detalle
                        </Button>
                        {day.status === 'draft' && (
                          <Button variant="primary" size="sm" className="flex-1">
                            Calcular Lotes
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })
          ) : (
            <div className="col-span-2">
              <Card>
                <CardBody className="py-12 text-center">
                  <Calendar className="h-12 w-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-secondary">No hay días de producción registrados</p>
                  <p className="text-sm text-text-muted mt-1">
                    Comienza creando tu primer día de producción
                  </p>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
