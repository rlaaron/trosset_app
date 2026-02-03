/**
 * @file: src/lib/utils/constants.ts
 * @purpose: Constantes globales de la aplicación
 * @goal: Centralizar valores constantes y configuración
 * @context: Configuración base - ENUMs, colores, opciones de UI
 */

// Estados de pedidos
export const ORDER_STATUS = {
  PENDING: 'pending',
  PLANNED: 'planned',
  IN_PRODUCTION: 'in_production',
  COMPLETED: 'completed',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  planned: 'Planificado',
  in_production: 'En Producción',
  completed: 'Completado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning-light text-warning',
  planned: 'bg-info-light text-info',
  in_production: 'bg-accent-light text-primary',
  completed: 'bg-success-light text-success',
  delivered: 'bg-success text-white',
  cancelled: 'bg-error-light text-error',
};

// Estados de lotes de producción
export const BATCH_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  QA_FAILED: 'qa_failed',
} as const;

export const BATCH_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En Proceso',
  completed: 'Completado',
  qa_failed: 'Falló QA',
};

// Estados de días de producción
export const PRODUCTION_DAY_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CLOSED: 'closed',
} as const;

export const PRODUCTION_DAY_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  closed: 'Cerrado',
};

// Tipos de movimiento de stock
export const STOCK_MOVE_TYPES = {
  PURCHASE: 'purchase',
  ADJUSTMENT: 'adjustment',
  PRODUCTION_USAGE: 'production_usage',
  WASTE: 'waste',
} as const;

export const STOCK_MOVE_TYPE_LABELS: Record<string, string> = {
  purchase: 'Compra',
  adjustment: 'Ajuste',
  production_usage: 'Uso en Producción',
  waste: 'Merma',
};

// Roles de usuario
export const USER_ROLES = {
  ADMIN: 'admin',
  SALES: 'sales',
  BAKER: 'baker',
  PLANNER: 'planner',
} as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  sales: 'Ventas',
  baker: 'Panadero',
  planner: 'Planificador',
};

// Unidades de medida comunes
export const UNITS = {
  WEIGHT: ['g', 'kg', 'lb', 'oz'],
  VOLUME: ['ml', 'l', 'gal'],
  COUNT: ['pz', 'unidad', 'docena', 'caja'],
} as const;

// Factores de conversión (a gramos o mililitros)
export const CONVERSION_FACTORS: Record<string, number> = {
  // Peso
  'g': 1,
  'kg': 1000,
  'lb': 453.592,
  'oz': 28.3495,
  // Volumen
  'ml': 1,
  'l': 1000,
  'gal': 3785.41,
  // Conteo
  'pz': 1,
  'unidad': 1,
  'docena': 12,
  'caja': 1,
};

// Días de la semana
export const WEEKDAYS = [
  { value: 'lun', label: 'Lun' },
  { value: 'mar', label: 'Mar' },
  { value: 'mie', label: 'Mié' },
  { value: 'jue', label: 'Jue' },
  { value: 'vie', label: 'Vie' },
  { value: 'sab', label: 'Sáb' },
  { value: 'dom', label: 'Dom' },
] as const;

// Regímenes fiscales (México)
export const TAX_REGIMES = [
  { value: '601', label: '601 - General de Ley Personas Morales' },
  { value: '603', label: '603 - Personas Morales con Fines no Lucrativos' },
  { value: '605', label: '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { value: '606', label: '606 - Arrendamiento' },
  { value: '607', label: '607 - Régimen de Enajenación o Adquisición de Bienes' },
  { value: '608', label: '608 - Demás ingresos' },
  { value: '610', label: '610 - Residentes en el Extranjero sin Establecimiento Permanente en México' },
  { value: '611', label: '611 - Ingresos por Dividendos (socios y accionistas)' },
  { value: '612', label: '612 - Personas Físicas con Actividades Empresariales y Profesionales' },
  { value: '614', label: '614 - Ingresos por intereses' },
  { value: '615', label: '615 - Régimen de los ingresos por obtención de premios' },
  { value: '616', label: '616 - Sin obligaciones fiscales' },
  { value: '620', label: '620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos' },
  { value: '621', label: '621 - Incorporación Fiscal' },
  { value: '622', label: '622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { value: '623', label: '623 - Opcional para Grupos de Sociedades' },
  { value: '624', label: '624 - Coordinados' },
  { value: '625', label: '625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
  { value: '626', label: '626 - Régimen Simplificado de Confianza' },
] as const;

// Usos de CFDI
export const CFDI_USES = [
  { value: 'G01', label: 'G01 - Adquisición de mercancías' },
  { value: 'G02', label: 'G02 - Devoluciones, descuentos o bonificaciones' },
  { value: 'G03', label: 'G03 - Gastos en general' },
  { value: 'I01', label: 'I01 - Construcciones' },
  { value: 'I02', label: 'I02 - Mobiliario y equipo de oficina por inversiones' },
  { value: 'I03', label: 'I03 - Equipo de transporte' },
  { value: 'I04', label: 'I04 - Equipo de cómputo y accesorios' },
  { value: 'I05', label: 'I05 - Dados, troqueles, moldes, matrices y herramental' },
  { value: 'I06', label: 'I06 - Comunicaciones telefónicas' },
  { value: 'I07', label: 'I07 - Comunicaciones satelitales' },
  { value: 'I08', label: 'I08 - Otra maquinaria y equipo' },
  { value: 'D01', label: 'D01 - Honorarios médicos, dentales y gastos hospitalarios' },
  { value: 'D02', label: 'D02 - Gastos médicos por incapacidad o discapacidad' },
  { value: 'D03', label: 'D03 - Gastos funerales' },
  { value: 'D04', label: 'D04 - Donativos' },
  { value: 'D05', label: 'D05 - Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)' },
  { value: 'D06', label: 'D06 - Aportaciones voluntarias al SAR' },
  { value: 'D07', label: 'D07 - Primas por seguros de gastos médicos' },
  { value: 'D08', label: 'D08 - Gastos de transportación escolar obligatoria' },
  { value: 'D09', label: 'D09 - Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones' },
  { value: 'D10', label: 'D10 - Pagos por servicios educativos (colegiaturas)' },
  { value: 'S01', label: 'S01 - Sin efectos fiscales' },
  { value: 'CP01', label: 'CP01 - Pagos' },
  { value: 'CN01', label: 'CN01 - Nómina' },
] as const;

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// Límites de texto
export const TEXT_LIMITS = {
  SHORT_TEXT: 100,
  MEDIUM_TEXT: 500,
  LONG_TEXT: 2000,
} as const;
