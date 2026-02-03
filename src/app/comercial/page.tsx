/**
 * @file: src/app/comercial/page.tsx
 * @purpose: Redirect de /comercial a /comercial/clientes
 * @goal: Evitar 404 cuando se hace click en Comercial del sidebar
 * @context: Navegación - Redirect automático
 */

import { redirect } from 'next/navigation';

export default function ComercialPage() {
  redirect('/comercial/clientes');
}
