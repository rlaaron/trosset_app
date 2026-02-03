-- =====================================================================
-- SCHEMA SQL PARA SUPABASE - PANADERÍA B2B MVP
-- =====================================================================
-- Este script crea todas las tablas, tipos y relaciones necesarias
-- para el sistema ERP de panadería B2B
-- 
-- INSTRUCCIONES:
-- 1. Ir a Supabase Dashboard → SQL Editor
-- 2. Crear un nuevo query
-- 3. Copiar y pegar este script completo
-- 4. Ejecutar (Run)
-- =====================================================================

-- -----------------------------------------------------------------------------
-- CONFIGURACIÓN INICIAL
-- -----------------------------------------------------------------------------
-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tipos ENUM para integridad de estados
CREATE TYPE user_role AS ENUM ('admin', 'sales', 'baker', 'planner');
CREATE TYPE order_status AS ENUM ('pending', 'planned', 'in_production', 'completed', 'delivered', 'cancelled');
CREATE TYPE batch_status AS ENUM ('pending', 'in_progress', 'completed', 'qa_failed');
CREATE TYPE trigger_type AS ENUM ('info', 'action_check', 'blocking');
CREATE TYPE stock_move_type AS ENUM ('purchase', 'adjustment', 'production_usage', 'waste');

-- -----------------------------------------------------------------------------
-- 1. USUARIOS Y PERFILES (Extiende auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'baker',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. INVENTARIOS (Insumos)
-- -----------------------------------------------------------------------------
CREATE TABLE inventory_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    color_hex TEXT DEFAULT '#E5E7EB',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES inventory_categories(id),
    name TEXT NOT NULL,
    unit_purchase TEXT NOT NULL,
    unit_usage TEXT NOT NULL,
    cost_per_purchase_unit NUMERIC(10,2) DEFAULT 0,
    quantity_per_purchase_unit NUMERIC(10,4) DEFAULT 1,
    
    -- Stock Logic
    current_stock NUMERIC(12,4) DEFAULT 0,
    min_stock_threshold NUMERIC(12,4) DEFAULT 0,
    is_compound BOOLEAN DEFAULT false,
    
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla para Insumos Compuestos (Mezclas)
CREATE TABLE item_compositions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    ingredient_item_id UUID REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity_needed NUMERIC(10,4) NOT NULL,
    
    CONSTRAINT unique_composition UNIQUE (parent_item_id, ingredient_item_id)
);

-- Historial de movimientos (Log Auditoría)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    qty_change NUMERIC(12,4) NOT NULL,
    move_type stock_move_type NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. PRODUCTOS (Maestros con Variantes JSON)
-- -----------------------------------------------------------------------------
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    
    -- Configuración Producción
    batch_size_units INTEGER NOT NULL DEFAULT 1,
    
    -- Variantes (Opción B: JSON)
    has_variants BOOLEAN DEFAULT false,
    variants JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata UI
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Comentario sobre estructura de variantes JSON:
COMMENT ON COLUMN products.variants IS 'Array JSON: [{"name": "Chocolate", "extra_cost": 5.00, "extra_ingredients": [{"item_id": "uuid", "qty": 50}]}]';

-- Receta Unitaria (Escandallo)
CREATE TABLE product_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity NUMERIC(10,4) NOT NULL,
    unit TEXT DEFAULT 'g',  -- Unidad de medida para la receta (kg, g, ml, etc.)
    
    CONSTRAINT unique_product_ingredient UNIQUE (product_id, inventory_item_id)
);

-- -----------------------------------------------------------------------------
-- 4. PROCESOS Y FASES (Core del Kiosco)
-- -----------------------------------------------------------------------------
CREATE TABLE production_phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sequence_order INTEGER NOT NULL,
    estimated_duration_minutes INTEGER,
    
    CONSTRAINT unique_phase_order UNIQUE (product_id, sequence_order)
);

-- Triggers Temporales dentro de una fase
CREATE TABLE phase_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_id UUID REFERENCES production_phases(id) ON DELETE CASCADE,
    trigger_time_seconds INTEGER NOT NULL,
    type trigger_type NOT NULL DEFAULT 'info',
    instruction_text TEXT NOT NULL
);

-- -----------------------------------------------------------------------------
-- 5. COMERCIAL (Clientes y Pedidos)
-- -----------------------------------------------------------------------------
CREATE TABLE price_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE price_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    price_list_id UUID REFERENCES price_lists(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    price NUMERIC(10,2) NOT NULL,
    
    CONSTRAINT unique_price_list_product UNIQUE (price_list_id, product_id)
);

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address_delivery TEXT,
    notes TEXT,
    price_list_id UUID REFERENCES price_lists(id),
    
    -- Datos Fiscales (Nulleables según regla de Toggle)
    requires_invoice BOOLEAN DEFAULT false,
    tax_id TEXT,
    tax_name TEXT,
    tax_regime TEXT,
    tax_address TEXT,
    tax_zip_code TEXT,
    cfdi_use TEXT,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 6. PLANIFICACIÓN Y PRODUCCIÓN
-- -----------------------------------------------------------------------------
CREATE TABLE production_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_date DATE NOT NULL UNIQUE,
    delivery_date DATE,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Pedidos (Cabecera)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number SERIAL,
    client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
    delivery_date DATE NOT NULL,
    
    -- Link opcional a Día de Producción (Asignación)
    production_day_id UUID REFERENCES production_days(id) ON DELETE SET NULL,
    
    status order_status DEFAULT 'pending',
    total_amount NUMERIC(12,2) DEFAULT 0,
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Pedidos (Detalle)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_snapshot NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price_snapshot) STORED
);

-- Lotes de Producción (Calculados: Total Piezas / Batch Size)
CREATE TABLE production_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_day_id UUID REFERENCES production_days(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    
    batch_number INTEGER NOT NULL,
    total_units_in_batch INTEGER NOT NULL,
    
    status batch_status DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Ejecución de Fases (Persistencia del Kiosco)
CREATE TABLE batch_phase_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES production_batches(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES production_phases(id) ON DELETE RESTRICT,
    
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    CONSTRAINT unique_batch_phase UNIQUE (batch_id, phase_id)
);

-- Log de acciones dentro de una fase (Checkboxes y Modales)
CREATE TABLE batch_trigger_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID REFERENCES batch_phase_executions(id) ON DELETE CASCADE,
    trigger_id UUID REFERENCES phase_triggers(id) ON DELETE RESTRICT,
    
    acknowledged_at TIMESTAMPTZ DEFAULT now(),
    performed_by UUID REFERENCES auth.users(id)
);

-- -----------------------------------------------------------------------------
-- ÍNDICES PARA OPTIMIZACIÓN
-- -----------------------------------------------------------------------------
CREATE INDEX idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_items_stock ON inventory_items(current_stock);
CREATE INDEX idx_stock_movements_item ON stock_movements(item_id);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at DESC);

CREATE INDEX idx_product_recipes_product ON product_recipes(product_id);
CREATE INDEX idx_production_phases_product ON production_phases(product_id);
CREATE INDEX idx_phase_triggers_phase ON phase_triggers(phase_id);

CREATE INDEX idx_clients_active ON clients(is_active);
CREATE INDEX idx_clients_price_list ON clients(price_list_id);

CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_production_day ON orders(production_day_id);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE INDEX idx_production_days_date ON production_days(production_date);
CREATE INDEX idx_production_days_status ON production_days(status);
CREATE INDEX idx_production_batches_day ON production_batches(production_day_id);
CREATE INDEX idx_production_batches_product ON production_batches(product_id);
CREATE INDEX idx_batch_executions_batch ON batch_phase_executions(batch_id);

-- -----------------------------------------------------------------------------
-- POLÍTICAS RLS (Row Level Security) - Básicas
-- -----------------------------------------------------------------------------
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política: Lectura permitida para usuarios autenticados
CREATE POLICY "Enable read access for authenticated users" ON orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON clients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON inventory_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON production_batches
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Escritura permitida para usuarios autenticados
CREATE POLICY "Enable insert for authenticated users" ON orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON orders
    FOR UPDATE USING (auth.role() = 'authenticated');

-- -----------------------------------------------------------------------------
-- DATOS INICIALES (SEED DATA)
-- -----------------------------------------------------------------------------

-- Categorías de inventario
INSERT INTO inventory_categories (name, color_hex) VALUES
    ('Harinas', '#F4A460'),
    ('Lácteos', '#E3F2FD'),
    ('Levaduras', '#FFF3E0'),
    ('Otros', '#E8F5E9');

-- Lista de precios por defecto
INSERT INTO price_lists (name, is_active) VALUES
    ('General', true),
    ('Restaurantes', true),
    ('Mayoreo', true);

-- -----------------------------------------------------------------------------
-- FUNCIONES ÚTILES
-- -----------------------------------------------------------------------------

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para inventory_items
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- COMENTARIOS FINALES
-- -----------------------------------------------------------------------------
COMMENT ON TABLE orders IS 'Pedidos de clientes con folio secuencial (order_number)';
COMMENT ON TABLE production_days IS 'Días de producción con fecha de producción y entrega';
COMMENT ON TABLE production_batches IS 'Lotes calculados según BR-02 (sin redondeo hacia arriba)';
COMMENT ON TABLE batch_phase_executions IS 'Persistencia de cronómetros para BR-04 (multi-timer)';
COMMENT ON TABLE stock_movements IS 'Auditoría de movimientos de inventario para BR-01';

-- =====================================================================
-- FIN DEL SCRIPT
-- =====================================================================
-- Después de ejecutar este script:
-- 1. Verifica que todas las tablas se crearon correctamente
-- 2. Puedes comenzar a usar la aplicación Next.js
-- 3. Las políticas RLS están habilitadas pero permisivas para desarrollo
-- 4. En producción, ajusta las políticas según roles específicos
-- =====================================================================
