/**
 * @file: src/app/dashboard/page.tsx
 * @purpose: Página principal del Dashboard con KPIs y resumen operativo
 * @goal: Mostrar métricas clave, producción del día y alertas (US-02)
 * @context: Módulo Dashboard - Vista principal del sistema
 */

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DollarSign, ShoppingCart, Package, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';

export default function DashboardPage() {
  // TODO: Estos datos vendrán de Supabase
  const kpis = {
    monthlyRevenue: 45230,
    pendingOrders: 24,
    inProduction: 8,
    lowStock: 3,
  };

  const todayProduction = [
    { product: 'Baguette', quantity: 150 },
    { product: 'Rol de Canela', quantity: 80 },
    { product: 'Pan Francés', quantity: 200 },
    { product: 'Croissant', quantity: 60 },
  ];

  const recentOrders = [
    { id: '#PED-0024', client: 'Restaurante Luigi', date: 'Vie 25 Ene', items: 3, status: 'pending' },
    { id: '#PED-0023', client: 'Café Central', date: 'Vie 25 Ene', items: 5, status: 'in_production' },
    { id: '#PED-0022', client: 'Hotel Boutique', date: 'Jue 24 Ene', items: 8, status: 'completed' },
  ];

  const stockAlerts = [
    { name: 'Harina Fuerza', stock: '2 bultos', min: '5 bultos', level: 'critical' },
    { name: 'Mantequilla', stock: '3 kg', min: '10 kg', level: 'low' },
    { name: 'Levadura Fresca', stock: '0 kg', min: '2 kg', level: 'out' },
  ];

  return (
    <AppLayout>
      <PageContainer
        title="Dashboard"
        subtitle="Resumen general del sistema"
      >
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Facturación Mensual"
            value={formatCurrency(kpis.monthlyRevenue)}
            icon={<DollarSign className="h-6 w-6" />}
            trend={{ value: 12.5, isPositive: true }}
          />
          <KPICard
            title="Pedidos Pendientes"
            value={kpis.pendingOrders}
            icon={<ShoppingCart className="h-6 w-6" />}
            variant="warning"
          />
          <KPICard
            title="En Producción"
            value={kpis.inProduction}
            icon={<Package className="h-6 w-6" />}
            variant="info"
          />
          <KPICard
            title="Insumos Bajos"
            value={kpis.lowStock}
            icon={<AlertTriangle className="h-6 w-6" />}
            variant="error"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Producción del Día */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-text-primary">
                  Producción Hoy
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {todayProduction.map((item) => (
                    <div key={item.product} className="flex items-center justify-between">
                      <span className="text-text-primary font-medium">{item.product}</span>
                      <span className="text-text-secondary">{item.quantity} uds</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <button className="w-full px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors">
                    Ver Planificación Completa
                  </button>
                </div>
              </CardBody>
            </Card>

            {/* Pedidos Recientes */}
            <Card className="mt-6">
              <CardHeader>
                <h2 className="text-lg font-semibold text-text-primary">
                  Pedidos Recientes
                </h2>
              </CardHeader>
              <CardBody>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-sm font-medium text-text-secondary">Pedido</th>
                        <th className="text-left py-2 text-sm font-medium text-text-secondary">Cliente</th>
                        <th className="text-left py-2 text-sm font-medium text-text-secondary">Entrega</th>
                        <th className="text-left py-2 text-sm font-medium text-text-secondary">Items</th>
                        <th className="text-left py-2 text-sm font-medium text-text-secondary">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="border-b border-border last:border-0">
                          <td className="py-3 text-sm font-medium text-text-primary">{order.id}</td>
                          <td className="py-3 text-sm text-text-secondary">{order.client}</td>
                          <td className="py-3 text-sm text-text-secondary">{order.date}</td>
                          <td className="py-3 text-sm text-text-secondary">{order.items} productos</td>
                          <td className="py-3">
                            <Badge variant={
                              order.status === 'completed' ? 'success' :
                              order.status === 'in_production' ? 'neutral' : 'warning'
                            }>
                              {order.status === 'pending' ? 'Pendiente' :
                               order.status === 'in_production' ? 'En Producción' : 'Completado'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Alertas de Stock */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text-primary">
                    Alertas de Stock
                  </h2>
                  <Badge variant="error">{stockAlerts.length}</Badge>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {stockAlerts.map((alert) => (
                    <div
                      key={alert.name}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.level === 'out' ? 'bg-red-50 border-red-500' :
                        alert.level === 'critical' ? 'bg-orange-50 border-orange-500' :
                        'bg-yellow-50 border-yellow-500'
                      }`}
                    >
                      <div className="flex items-start">
                        <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                          alert.level === 'out' ? 'text-red-600' :
                          alert.level === 'critical' ? 'text-orange-600' :
                          'text-yellow-600'
                        }`} />
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-text-primary">{alert.name}</p>
                          <p className="text-xs text-text-muted mt-1">
                            Stock: {alert.stock} (mín: {alert.min})
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <button className="w-full px-4 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors">
                    Ver Todos los Insumos
                  </button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
