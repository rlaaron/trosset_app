/**
 * @file: src/app/comercial/clientes/page.tsx
 * @purpose: Página de lista de clientes B2B (US-06)
 * @goal: Mostrar clientes con datos de contacto y facturación
 * @context: Módulo Comercial - Vista principal de clientes
 */

import React from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Plus, Users, Phone, Mail, FileText, Edit } from 'lucide-react';
import { getClients } from '@/actions/clients';
import { formatPhone } from '@/lib/utils/formatters';

export default async function ClientesPage() {
  const { data: clients, error } = await getClients();

  if (error) {
    return (
      <AppLayout>
        <PageContainer title="Clientes">
          <div className="text-center py-12">
            <p className="text-red-600">Error al cargar clientes: {error}</p>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  const totalClients = clients?.length || 0;
  const clientsWithInvoice = clients?.filter(c => c.requires_invoice).length || 0;

  return (
    <AppLayout>
      <PageContainer
        title="Gestión de Clientes"
        subtitle={`${totalClients} clientes activos`}
        actions={
          <Link 
            href="/comercial/clientes/nuevo"
            className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-base bg-primary text-white hover:bg-primary-dark focus:ring-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Link>
        }
      >
        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Clientes</p>
                <p className="text-2xl font-bold text-text-primary">{totalClients}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Con Facturación</p>
                <p className="text-2xl font-bold text-text-primary">{clientsWithInvoice}</p>
              </div>
              <FileText className="h-8 w-8 text-accent" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Sin Facturación</p>
                <p className="text-2xl font-bold text-text-primary">{totalClients - clientsWithInvoice}</p>
              </div>
              <Users className="h-8 w-8 text-text-muted" />
            </div>
          </Card>
        </div>

        {/* Tabla de Clientes */}
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-elevated border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Lista de Precios
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Facturación
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border">
                  {clients && clients.length > 0 ? (
                    clients.map((client) => (
                      <tr key={client.id} className="hover:bg-surface-elevated transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold mr-3">
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-text-primary">
                                {client.name}
                              </div>
                              {client.address_delivery && (
                                <div className="text-xs text-text-muted truncate max-w-xs">
                                  {client.address_delivery}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-text-primary">
                            {client.contact_name || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {client.phone ? (
                            <div className="flex items-center text-sm text-text-secondary">
                              <Phone className="h-4 w-4 mr-1" />
                              {formatPhone(client.phone)}
                            </div>
                          ) : (
                            <span className="text-sm text-text-muted">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {client.email ? (
                            <div className="flex items-center text-sm text-text-secondary">
                              <Mail className="h-4 w-4 mr-1" />
                              {client.email}
                            </div>
                          ) : (
                            <span className="text-sm text-text-muted">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {client.price_list ? (
                            <Badge variant="info">{client.price_list.name}</Badge>
                          ) : (
                            <Badge variant="neutral">General</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={client.requires_invoice ? 'success' : 'neutral'}>
                            {client.requires_invoice ? (
                              <div className="flex items-center">
                                <FileText className="h-3 w-3 mr-1" />
                                Sí
                              </div>
                            ) : (
                              'No'
                            )}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/comercial/clientes/${client.id}`}
                            className="inline-flex items-center text-primary hover:text-primary-dark font-medium"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Users className="h-12 w-12 text-text-muted mx-auto mb-4" />
                        <p className="text-text-secondary">No hay clientes registrados</p>
                        <p className="text-sm text-text-muted mt-1">
                          Comienza agregando tu primer cliente
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
