/**
 * @file: src/components/layout/PageContainer.tsx
 * @purpose: Contenedor principal para páginas con header y contenido
 * @goal: Proporcionar estructura consistente para todas las páginas
 * @context: Layout base - Wrapper de contenido
 */

import React from 'react';

export interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageContainer({ children, title, subtitle, actions }: PageContainerProps) {
  return (
    <div className="flex-1 overflow-auto">
      {(title || actions) && (
        <div className="bg-surface border-b border-border px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              {title && <h1 className="text-2xl font-bold text-text-primary">{title}</h1>}
              {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center space-x-3">{actions}</div>}
          </div>
        </div>
      )}
      <div className="p-8">{children}</div>
    </div>
  );
}
