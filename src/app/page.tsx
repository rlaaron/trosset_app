/**
 * @file: src/app/page.tsx
 * @purpose: Página de inicio que redirige al dashboard
 * @goal: Redirigir automáticamente a la página principal del sistema
 * @context: Página raíz de Next.js App Router
 */

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
}
