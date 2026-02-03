/**
 * @file: src/app/inventarios/page.tsx
 * @purpose: Redirect de /inventarios a /inventarios/insumos
 * @goal: Evitar 404 cuando se hace click en Inventarios del sidebar
 * @context: Navegación - Redirect automático
 */

import { redirect } from 'next/navigation';

export default function InventariosPage() {
  redirect('/inventarios/insumos');
}
