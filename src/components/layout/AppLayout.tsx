/**
 * @file: src/components/layout/AppLayout.tsx
 * @purpose: Layout principal de la aplicación con Sidebar
 * @goal: Proporcionar estructura base con navegación lateral
 * @context: Layout wrapper - Usado en todas las páginas internas
 */

'use client';

import React from 'react';
import { Sidebar } from './Sidebar';

export interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
