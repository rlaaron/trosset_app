/**
 * @file: src/app/listas-precios/page.tsx
 * @purpose: Página de gestión de listas de precios
 * @goal: Mostrar y gestionar listas de precios para clientes
 * @context: Módulo Comercial - Listas de precios
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Plus, 
  DollarSign, 
  Edit3, 
  Trash2, 
  Eye,
  Package,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { getPriceLists, togglePriceListStatus, deletePriceList } from '@/actions/priceLists';
import { formatCurrency } from '@/lib/utils/formatters';

export default function ListasPreciosPage() {
  const router = useRouter();
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPriceLists();
  }, []);

  const loadPriceLists = async () => {
    setLoading(true);
    const { data, error } = await getPriceLists();
    if (data) {
      setPriceLists(data);
    }
    setLoading(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!confirm(`¿Estás seguro de ${currentStatus ? 'desactivar' : 'activar'} esta lista?`)) return;
    
    const { success, error } = await togglePriceListStatus(id, !currentStatus);
    if (success) {
      loadPriceLists();
    } else {
      alert('Error: ' + error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la lista "${name}"?`)) return;
    
    const { success, error } = await deletePriceList(id);
    if (success) {
      loadPriceLists();
    } else {
      alert('Error: ' + error);
    }
  };

  return (
    <AppLayout>
      <PageContainer
        title="Listas de Precios"
        subtitle="Gestión de precios para clientes"
        actions={
          <Button 
            variant="primary" 
            onClick={() => router.push('/listas-precios/nuevo')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Lista de Precios
          </Button>
        }
      >
        {loading ? (
          <div className="text-center py-12">Cargando listas de precios...</div>
        ) : priceLists.length === 0 ? (
          <Card>
            <CardBody className="py-16 text-center">
              <DollarSign className="h-16 w-16 text-text-muted mx-auto mb-4" />
              <p className="text-lg text-text-secondary">No hay listas de precios registradas</p>
              <p className="text-sm text-text-muted mt-2">
                Crea listas de precios personalizadas para tus clientes
              </p>
              <Button 
                variant="primary" 
                className="mt-4"
                onClick={() => router.push('/listas-precios/nuevo')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Lista
              </Button>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-text-secondary">Nombre</th>
                      <th className="text-center py-3 px-4 font-medium text-text-secondary">Productos</th>
                      <th className="text-center py-3 px-4 font-medium text-text-secondary">Estado</th>
                      <th className="text-right py-3 px-4 font-medium text-text-secondary">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceLists.map((list) => (
                      <tr 
                        key={list.id} 
                        className="border-b border-border last:border-0 hover:bg-surface-elevated/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mr-3">
                              <DollarSign className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium text-text-primary">{list.name}</p>
                              <p className="text-xs text-text-muted">
                                Creada: {new Date(list.created_at).toLocaleDateString('es-MX')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center">
                            <Package className="h-4 w-4 text-text-muted mr-1" />
                            <span className="text-text-primary">{list.product_count || 0}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(list.id, list.is_active)}
                            className="cursor-pointer"
                          >
                            <Badge variant={list.is_active ? 'success' : 'neutral'}>
                              {list.is_active ? (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Activa</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" /> Inactiva</>
                              )}
                            </Badge>
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => router.push(`/listas-precios/${list.id}`)}
                              title="Ver detalle"
                            >
                              <Eye className="h-4 w-4 text-info" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => router.push(`/listas-precios/${list.id}`)}
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4 text-primary" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(list.id, list.name)}
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4 text-error" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}
      </PageContainer>
    </AppLayout>
  );
}
