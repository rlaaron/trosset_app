/**
 * @file: src/components/ui/Card.tsx
 * @purpose: Componente Card para contenedores de contenido
 * @goal: Proporcionar tarjetas consistentes para organizar información
 * @context: Componente atómico base - Atomic Design
 */

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
}

export function Card({ children, className = '', elevated = false }: CardProps) {
  const baseStyles = 'bg-surface rounded-lg border border-border';
  const elevatedStyles = elevated ? 'shadow-lg' : 'shadow-sm';
  
  return (
    <div className={`${baseStyles} ${elevatedStyles} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-6 py-4 border-b border-border ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-6 py-4 border-t border-border bg-surface-elevated ${className}`}>
      {children}
    </div>
  );
}
