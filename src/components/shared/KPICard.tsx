/**
 * @file: src/components/shared/KPICard.tsx
 * @purpose: Componente para mostrar métricas clave (KPIs) en el dashboard
 * @goal: Visualizar indicadores importantes como ventas, pedidos, stock
 * @context: US-02 - Dashboard con KPIs
 */

import React from 'react';
import { Card } from '@/components/ui/Card';

export interface KPICardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export function KPICard({ 
  title, 
  value, 
  icon, 
  trend, 
  subtitle,
  variant = 'default' 
}: KPICardProps) {
  const variantStyles = {
    default: 'bg-surface',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  };
  
  return (
    <Card className={`p-6 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{value}</p>
          
          {subtitle && (
            <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
          )}
          
          {trend && (
            <div className="mt-2 flex items-center">
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="ml-2 text-sm text-text-muted">vs mes anterior</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className="ml-4 flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
