/**
 * @file: src/app/configuracion/page.tsx
 * @purpose: Página de configuración del sistema
 * @goal: Configuraciones generales de la aplicación
 * @context: Módulo Configuración
 */

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Settings } from 'lucide-react';

export default async function ConfiguracionPage() {
  return (
    <AppLayout>
      <PageContainer
        title="Configuración"
        subtitle="Ajustes del sistema"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">General</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-text-secondary">
                Configuraciones generales del sistema
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">Usuarios</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-text-secondary">
                Gestión de usuarios y permisos
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">Notificaciones</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-text-secondary">
                Configurar alertas y notificaciones
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">Integración</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-text-secondary">
                Conexiones con sistemas externos
              </p>
            </CardBody>
          </Card>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
