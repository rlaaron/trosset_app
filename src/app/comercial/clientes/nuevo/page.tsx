/**
 * @file: src/app/comercial/clientes/nuevo/page.tsx
 * @purpose: Formulario para crear nuevo cliente (US-06, BR-07)
 * @goal: Permitir crear clientes con datos fiscales opcionales
 * @context: Módulo Comercial - Creación de cliente
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save } from 'lucide-react';
import { createClient } from '@/actions/clients';

export default function NuevoClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [requiresInvoice, setRequiresInvoice] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    address_delivery: '',
    requires_invoice: false,
    tax_id: '',
    tax_name: '',
    tax_regime: '',
    tax_address: '',
    tax_zip_code: '',
    cfdi_use: 'G03',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await createClient({
        ...formData,
        requires_invoice: requiresInvoice,
      });

      if (error) {
        alert('Error al crear cliente: ' + error);
      } else {
        alert('Cliente creado exitosamente');
        router.push('/comercial/clientes');
      }
    } catch (error) {
      alert('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <PageContainer
        title="Nuevo Cliente"
        subtitle="Crear un nuevo cliente B2B"
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Datos Generales */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Datos Generales</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Nombre del Cliente *
                    </label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Panadería El Sol"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Nombre de Contacto
                    </label>
                    <Input
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Teléfono
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Ej: 5512345678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Ej: contacto@cliente.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Dirección de Entrega
                    </label>
                    <Input
                      value={formData.address_delivery}
                      onChange={(e) => setFormData({ ...formData, address_delivery: e.target.value })}
                      placeholder="Ej: Calle Principal #123, Col. Centro"
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Datos Fiscales (BR-07) */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Datos Fiscales</h3>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresInvoice}
                      onChange={(e) => setRequiresInvoice(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-text-secondary">Requiere Factura</span>
                  </label>
                </div>
              </CardHeader>
              {requiresInvoice && (
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        RFC *
                      </label>
                      <Input
                        required={requiresInvoice}
                        value={formData.tax_id}
                        onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                        placeholder="Ej: ABC123456XYZ"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Razón Social *
                      </label>
                      <Input
                        required={requiresInvoice}
                        value={formData.tax_name}
                        onChange={(e) => setFormData({ ...formData, tax_name: e.target.value })}
                        placeholder="Ej: Panadería El Sol SA de CV"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Régimen Fiscal
                      </label>
                      <Input
                        value={formData.tax_regime}
                        onChange={(e) => setFormData({ ...formData, tax_regime: e.target.value })}
                        placeholder="Ej: 601"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Código Postal Fiscal
                      </label>
                      <Input
                        value={formData.tax_zip_code}
                        onChange={(e) => setFormData({ ...formData, tax_zip_code: e.target.value })}
                        placeholder="Ej: 01000"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Dirección Fiscal
                      </label>
                      <Input
                        value={formData.tax_address}
                        onChange={(e) => setFormData({ ...formData, tax_address: e.target.value })}
                        placeholder="Ej: Av. Reforma #456, Col. Juárez"
                      />
                    </div>
                  </div>
                </CardBody>
              )}
            </Card>

            {/* Botones de Acción */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Guardando...' : 'Guardar Cliente'}
              </Button>
            </div>
          </div>
        </form>
      </PageContainer>
    </AppLayout>
  );
}
