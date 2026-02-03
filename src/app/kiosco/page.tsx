/**
 * @file: src/app/kiosco/page.tsx
 * @purpose: Vista de kiosco para panaderos en tablet (US-11, BR-04)
 * @goal: Mostrar lotes del día con cronómetros y triggers temporales
 * @context: Módulo Kiosco - Vista optimizada para tablet
 */

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Clock, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { getTodayBatchesForKiosk } from '@/actions/kiosk';
import { formatDate } from '@/lib/utils/formatters';

export default async function KioscoPage() {
  const { data: batches, error } = await getTodayBatchesForKiosk();

  if (error) {
    return (
      <AppLayout>
        <PageContainer title="Kiosco de Producción">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-warning mx-auto mb-4" />
            <p className="text-lg text-text-secondary">{error}</p>
            <p className="text-sm text-text-muted mt-2">
              Asegúrate de que haya un día de producción publicado para hoy
            </p>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  // Calcular estadísticas
  const totalBatches = batches?.length || 0;
  const pendingBatches = batches?.filter(b => b.status === 'pending').length || 0;
  const inProgressBatches = batches?.filter(b => b.status === 'in_progress').length || 0;
  const completedBatches = batches?.filter(b => b.status === 'completed').length || 0;

  // Función para obtener el color del badge según el estado
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Proceso';
      case 'completed': return 'Completado';
      default: return status;
    }
  };

  return (
    <AppLayout>
      <PageContainer
        title="Kiosco de Producción"
        subtitle={formatDate(new Date(), 'EEEE dd MMMM yyyy')}
      >
        {/* Estadísticas del Día */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="text-center">
              <p className="text-sm text-text-secondary mb-1">Total Lotes</p>
              <p className="text-3xl font-bold text-primary">{totalBatches}</p>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-warning/10 to-warning/5">
            <div className="text-center">
              <p className="text-sm text-text-secondary mb-1">Pendientes</p>
              <p className="text-3xl font-bold text-warning">{pendingBatches}</p>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-info/10 to-info/5">
            <div className="text-center">
              <p className="text-sm text-text-secondary mb-1">En Proceso</p>
              <p className="text-3xl font-bold text-info">{inProgressBatches}</p>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-success/10 to-success/5">
            <div className="text-center">
              <p className="text-sm text-text-secondary mb-1">Completados</p>
              <p className="text-3xl font-bold text-success">{completedBatches}</p>
            </div>
          </Card>
        </div>

        {/* Lista de Lotes - Optimizada para Tablet */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches && batches.length > 0 ? (
            batches.map((batch: any) => (
              <Card key={batch.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">
                        {batch.product?.name || 'Producto'}
                      </h3>
                      <p className="text-sm text-text-muted">
                        Lote #{batch.batch_number}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(batch.status)}>
                      {getStatusLabel(batch.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {/* Información del Lote */}
                    <div className="bg-surface-elevated rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-secondary">Unidades:</span>
                        <span className="text-lg font-bold text-text-primary">
                          {batch.total_units_in_batch}
                        </span>
                      </div>
                      {batch.started_at && (
                        <div className="flex items-center text-xs text-text-muted">
                          <Clock className="h-3 w-3 mr-1" />
                          Iniciado: {formatDate(batch.started_at, 'HH:mm')}
                        </div>
                      )}
                    </div>

                    {/* Fases del Lote */}
                    {batch.phases && batch.phases.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-text-secondary uppercase">
                          Fases:
                        </p>
                        {batch.phases.map((phase: any) => (
                          <div
                            key={phase.id}
                            className="flex items-center justify-between bg-surface-elevated rounded p-2"
                          >
                            <span className="text-sm text-text-primary">
                              {phase.phase?.name || 'Fase'}
                            </span>
                            <Badge
                              variant={phase.status === 'completed' ? 'success' : 'neutral'}
                              className="text-xs"
                            >
                              {phase.status === 'completed' ? 'Completada' : 'Pendiente'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Botones de Acción - Grandes para Tablet */}
                    <div className="pt-2 space-y-2">
                      {batch.status === 'pending' && (
                        <Button variant="primary" className="w-full h-12 text-base">
                          <Play className="h-5 w-5 mr-2" />
                          Iniciar Lote
                        </Button>
                      )}
                      {batch.status === 'in_progress' && (
                        <>
                          <Button variant="outline" className="w-full h-12 text-base">
                            <Clock className="h-5 w-5 mr-2" />
                            Ver Cronómetro
                          </Button>
                          <Button variant="primary" className="w-full h-12 text-base bg-success hover:bg-success/90">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Completar Lote
                          </Button>
                        </>
                      )}
                      {batch.status === 'completed' && (
                        <div className="flex items-center justify-center text-success py-3">
                          <CheckCircle className="h-6 w-6 mr-2" />
                          <span className="font-medium">Lote Completado</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardBody className="py-16 text-center">
                  <Clock className="h-16 w-16 text-text-muted mx-auto mb-4" />
                  <p className="text-lg text-text-secondary">No hay lotes para hoy</p>
                  <p className="text-sm text-text-muted mt-2">
                    Los lotes aparecerán cuando se publique un día de producción
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
