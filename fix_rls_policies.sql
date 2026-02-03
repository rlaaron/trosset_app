-- =====================================================================
-- FIX: Políticas RLS faltantes para tabla clients
-- =====================================================================
-- Ejecutar en Supabase Dashboard → SQL Editor
-- Este script agrega las políticas de INSERT y UPDATE que faltan
-- =====================================================================

-- Política: Permitir INSERT a usuarios autenticados
CREATE POLICY "Enable insert for authenticated users" ON clients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política: Permitir UPDATE a usuarios autenticados
CREATE POLICY "Enable update for authenticated users" ON clients
    FOR UPDATE USING (auth.role() = 'authenticated');

-- =====================================================================
-- VERIFICACIÓN: Listar todas las políticas de la tabla clients
-- =====================================================================
-- Descomenta la siguiente línea para verificar:
-- SELECT * FROM pg_policies WHERE tablename = 'clients';
