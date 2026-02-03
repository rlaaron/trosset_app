/**
 * @file: src/app/comercial/clientes/[id]/page.tsx
 * @purpose: Formulario para editar cliente existente
 * @goal: Permitir editar clientes con datos fiscales y lista de precios
 * @context: Módulo Comercial - Edición de cliente
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { getClientById, updateClient, getPriceLists } from '@/actions/clients';
import type { PriceList, Client } from '@/types/database.types';

interface EditClientePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditClientePage({ params }: EditClientePageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requiresInvoice, setRequiresInvoice] = useState(false);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loadingPriceLists, setLoadingPriceLists] = useState(true);
  const [clientId, setClientId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    address_delivery: '',
    price_list_id: '',
    requires_invoice: false,
    tax_id: '',
    tax_name: '',
    tax_regime: '',
    tax_address: '',
    tax_zip_code: '',
    cfdi_use: 'G03',
  });

  // Cargar cliente y listas de precios al montar el componente
  useEffect(() => {
    async function loadData() {
      try {
        const { id } = await params;
        setClientId(id);
        
        // Cargar cliente
        const { data: client, error: clientError } = await getClientById(id);
        if (clientError || !client) {
          alert('Error al cargar cliente: ' + (clientError || 'No encontrado'));
          router.push('/comercial/clientes');
          return;
        }

        // Cargar listas de precios
        const { data: lists, error: listsError } = await getPriceLists();
        if (lists && !listsError) {
          setPriceLists(lists);
        }
        setLoadingPriceLists(false);

        // Setear datos del cliente en el formulario
        setFormData({
          name: client.name || '',
          contact_name: client.contact_name || '',
          phone: client.phone || '',
          email: client.email || '',
          address_delivery: client.address_delivery || '',
          price_list_id: client.price_list_id || '',
          requires_invoice: client.requires_invoice || false,
          tax_id: client.tax_id || '',
          tax_name: client.tax_name || '',
          tax_regime: client.tax_regime || '',
          tax_address: client.tax_address || '',
          tax_zip_code: client.tax_zip_code || '',
          cfdi_use: client.cfdi_use || 'G03',
        });
        setRequiresInvoice(client.requires_invoice || false);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        alert('Error al cargar datos del cliente');
        router.push('/comercial/clientes');
      }
    }
    loadData();
  }, [params, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data, error } = await updateClient(clientId, {
        ...formData,
        requires_invoice: requiresInvoice,
        // Convertir string vacío a null para price_list_id
        price_list_id: formData.price_list_id || null,
      });

      if (error) {
        alert('Error al actualizar cliente: ' + error);
      } else {
        alert('Cliente actualizado exitosamente');
        router.push('/comercial/clientes');
      }
    } catch (error) {
      alert('Error inesperado');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <PageContainer title="Editar Cliente">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-text-secondary">Cargando...</span>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageContainer
        title="Editar Cliente"
        subtitle="Modificar información del cliente"
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

                  {/* Lista de Precios */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Lista de Precios
                    </label>
                    <select
                      value={formData.price_list_id}
                      onChange={(e) => setFormData({ ...formData, price_list_id: e.target.value })}
                      disabled={loadingPriceLists}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Lista General (Default)</option>
                      {priceLists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.name}
                        </option>
                      ))}
                    </select>
                    {loadingPriceLists && (
                      <p className="text-xs text-text-muted mt-1">Cargando listas de precios...</p>
                    )}
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
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </form>
      </PageContainer>
    </AppLayout>
  );
}
