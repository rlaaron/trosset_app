/**
 * @file: src/lib/supabase/client.ts
 * @purpose: Cliente Supabase para uso en componentes del lado del cliente (browser)
 * @goal: Proporcionar instancia configurada de Supabase para Client Components
 * @context: Infraestructura base - Conexión a base de datos desde el navegador
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
