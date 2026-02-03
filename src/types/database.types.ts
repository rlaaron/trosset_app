/**
 * @file: src/types/database.types.ts
 * @purpose: Definiciones de tipos TypeScript basadas en el esquema SQL de Supabase
 * @goal: Proporcionar tipado fuerte para todas las operaciones de base de datos
 * @context: Tipos generados manualmente del esquema SQL proporcionado
 */

// ENUMs del sistema
export type UserRole = 'admin' | 'sales' | 'baker' | 'planner';
export type OrderStatus = 'pending' | 'planned' | 'in_production' | 'completed' | 'delivered' | 'cancelled';
export type BatchStatus = 'pending' | 'in_progress' | 'completed' | 'qa_failed';
export type TriggerType = 'info' | 'action_check' | 'blocking';
export type StockMoveType = 'purchase' | 'adjustment' | 'production_usage' | 'waste';
export type ProductionDayStatus = 'draft' | 'published' | 'closed';

// Tablas de la base de datos
export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  color_hex: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  category_id: string | null;
  name: string;
  unit_purchase: string;
  unit_usage: string;
  cost_per_purchase_unit: number;
  quantity_per_purchase_unit: number;
  current_stock: number;
  min_stock_threshold: number;
  is_compound: boolean;
  updated_at: string;
}

export interface ItemComposition {
  id: string;
  parent_item_id: string;
  ingredient_item_id: string;
  quantity_needed: number;
}

export interface StockMovement {
  id: string;
  item_id: string;
  qty_change: number;
  move_type: StockMoveType;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  batch_size_units: number;
  has_variants: boolean;
  variants: ProductVariant[];
  is_active: boolean;
  created_at: string;
}

export interface ProductVariant {
  name: string;
  extra_cost: number;
  extra_ingredients: {
    item_id: string;
    qty: number;
  }[];
}

export interface ProductRecipe {
  id: string;
  product_id: string;
  inventory_item_id: string;
  quantity: number;
}

export interface ProductionPhase {
  id: string;
  product_id: string;
  name: string;
  sequence_order: number;
  estimated_duration_minutes: number | null;
}

export interface PhaseTrigger {
  id: string;
  phase_id: string;
  trigger_time_seconds: number;
  type: TriggerType;
  instruction_text: string;
}

export interface PriceList {
  id: string;
  name: string;
  is_active: boolean;
}

export interface PriceListItem {
  id: string;
  price_list_id: string;
  product_id: string;
  price: number;
}

export interface Client {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address_delivery: string | null;
  notes: string | null;
  price_list_id: string | null;
  requires_invoice: boolean;
  tax_id: string | null;
  tax_name: string | null;
  tax_regime: string | null;
  tax_address: string | null;
  tax_zip_code: string | null;
  cfdi_use: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ProductionDay {
  id: string;
  production_date: string;
  delivery_date: string | null;
  status: ProductionDayStatus;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: number;
  client_id: string;
  delivery_date: string;
  production_day_id: string | null;
  status: OrderStatus;
  total_amount: number;
  internal_notes: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price_snapshot: number;
  subtotal: number;
}

export interface ProductionBatch {
  id: string;
  production_day_id: string;
  product_id: string;
  batch_number: number;
  total_units_in_batch: number;
  status: BatchStatus;
  started_at: string | null;
  completed_at: string | null;
}

export interface BatchPhaseExecution {
  id: string;
  batch_id: string;
  phase_id: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface BatchTriggerLog {
  id: string;
  execution_id: string;
  trigger_id: string;
  acknowledged_at: string;
  performed_by: string | null;
}

// Tipos de respuesta con relaciones (para queries complejas)
export interface OrderWithDetails extends Order {
  client: Client;
  items: (OrderItem & { product: Product })[];
}

export interface ProductionBatchWithDetails extends ProductionBatch {
  product: Product;
  executions: (BatchPhaseExecution & { phase: ProductionPhase })[];
}

export interface InventoryItemWithCategory extends InventoryItem {
  category: InventoryCategory | null;
}
