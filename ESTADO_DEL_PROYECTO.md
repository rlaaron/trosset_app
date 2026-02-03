# Estado del Proyecto Trosset - AppV1

**Fecha de Actualización:** 3 de febrero de 2026  
**Versión:** 1.0.0-alpha  
**Estado:** En Desarrollo Activo

---

## Resumen Ejecutivo

Plataforma de gestión integral para panadería/pastelería que incluye: gestión de inventarios, productos con recetas, procesos de producción con timers, pedidos comerciales, listas de precios y kiosco de venta.

---

## Módulos Implementados

### ✅ Módulo de Inventarios (`/inventarios`)

#### Insumos (`/inventarios/insumos`)
- **Estado:** Funcional
- **Características:**
  - CRUD completo de insumos
  - Gestión de unidades (kg, g, L, ml, pz)
  - Costos por unidad de compra
  - Cálculo automático de costos unitarios
  - Soporte para insumos compuestos (mezclas)

#### Productos (`/inventarios/productos`)
- **Estado:** Funcional con variantes implementadas
- **Características:**
  - CRUD completo de productos
  - Receta por producto (ingredientes para 1 pieza)
  - Cálculo automático de costos de producción
  - **Productos Maestro con Variantes** (NUEVO)
    - Variantes como "Chocolate", "Integral", "Nuez"
    - Ingredientes extra por variante
    - Cálculo independiente de costos extra
  - Fases de producción con timers
  - Acciones internas (triggers) por fase:
    - Alertas informativas
    - Checkboxes de acción
    - Checkboxes bloqueantes

### ✅ Módulo Comercial (`/comercial`)

#### Clientes (`/comercial/clientes`)
- **Estado:** Funcional
- **Características:**
  - CRUD de clientes
  - Campo `is_b2b` para distinguir tipo de cliente
  - Integración con listas de precios

#### Pedidos (`/comercial/pedidos`)
- **Estado:** Parcialmente funcional
- **Características:**
  - Creación de pedidos
  - Selección de cliente
  - Agregar productos al pedido
  - Cálculo de totales
  - Estados del pedido
  - **Falta:** Integración completa con producción

#### Listas de Precios (`/listas-precios`)
- **Estado:** ✅ Recién implementado
- **Características:**
  - Crear/editar listas de precios
  - Asignar precios por producto
  - Cálculo de margen basado en costo
  - Activar/desactivar listas
  - Asignar lista de precios a clientes B2B

### ⚠️ Módulo de Planificación (`/planificacion`)
- **Estado:** Estructura base creada
- **Funcionalidad pendiente:**
  - Generación de batches de producción
  - Asignación de lotes a pedidos
  - Timeline de producción

### ✅ Kiosco (`/kiosco`)
- **Estado:** Funcional
- **Características:**
  - Punto de venta rápida
  - Catálogo de productos
  - Cálculo de cambio

---

## Arquitectura Técnica

### Stack Tecnológico
```
- Framework: Next.js 14 (App Router)
- Lenguaje: TypeScript
- Estilos: Tailwind CSS
- UI Components: Componentes propios (Card, Button, Input, Badge)
- Backend: Supabase (PostgreSQL)
- Autenticación: Supabase Auth
- Server Actions: Next.js Server Actions
```

### Estructura de Carpetas
```
src/
├── actions/          # Server Actions (CRUD operations)
├── app/              # Next.js App Router
│   ├── comercial/    # Módulo comercial
│   ├── inventarios/  # Módulo de inventarios
│   ├── listas-precios/ # NUEVO: Listas de precios
│   ├── planificacion/# Módulo de planificación
│   ├── kiosco/       # Punto de venta
│   └── ...
├── components/
│   ├── layout/       # Layout components (AppLayout, Sidebar)
│   ├── ui/           # UI components (Button, Card, Input, Badge)
│   └── shared/       # Componentes compartidos
├── lib/
│   ├── supabase/     # Cliente y servidor Supabase
│   └── utils/        # Utilidades (formatters, calculations, unitConversions)
└── types/            # Types de TypeScript
```

---

## Base de Datos (Supabase)

### Tablas Principales

#### `inventory_items`
- Insumos de inventario
- Campos: name, stock, unit_purchase, cost_per_purchase_unit, is_compound

#### `products`
- Productos finales
- Campos: name, description, batch_size_units, has_variants

#### `product_variants` (NUEVO)
- Variantes de productos maestro
- Campos: product_id, name, extra_cost, extra_ingredients (JSONB)

#### `recipes`
- Recetas de productos (tabla pivote)
- Campos: product_id, inventory_item_id, quantity, unit

#### `production_phases`
- Fases del proceso de producción
- Campos: product_id, name, sequence_order, estimated_duration_minutes

#### `phase_triggers`
- Acciones internas de cada fase
- Campos: phase_id, trigger_time_seconds, type, instruction_text

#### `orders`
- Pedidos de clientes
- Campos: client_id, status, total_amount, delivery_date

#### `order_items`
- Items de cada pedido
- Campos: order_id, product_id, variant_id, quantity, unit_price

#### `price_lists` (NUEVO)
- Listas de precios
- Campos: name, is_active, created_at

#### `price_list_items` (NUEVO)
- Precios por producto en cada lista
- Campos: price_list_id, product_id, price

---

## Insights y Decisiones Técnicas

### 1. Gestión de Unidades
**Problema:** Conversión entre diferentes unidades (kg ↔ g, L ↔ ml)  
**Solución:** Sistema de unidades compatible con `unitConversions.ts`
- Unidades agrupadas por tipo: PESO (kg, g, mg), VOLUMEN (L, ml), UNIDAD (pz)
- Validación de compatibilidad antes de operaciones
- Cálculo automático de costos basado en conversiones

### 2. Productos Maestro vs Simples
**Problema:** Algunos productos tienen variantes (ej. Baguette: Natural, Integral, Ajo)  
**Solución:** Campo `has_variants` + tabla `product_variants`
- Producto base define receta común
- Variantes tienen ingredientes EXTRA (recargos)
- Costo total = Costo base + Costo extra de variante

### 3. Procesos de Producción con Timers
**Problema:** Necesidad de guiar al operario durante la producción  
**Solución:** Fases con triggers temporizados
- Cada fase tiene duración estimada
- Triggers en segundos desde inicio de fase
- Tipos: info (azul), action_check (verde - requiere check), blocking (rojo - debe completarse)
- UI muestra countdown para cada acción

### 4. Cálculo de Costos en Tiempo Real
**Patrón:** Todo cálculo de costos se hace en el frontend durante la creación/edición  
**Beneficios:**
- Feedback inmediato al usuario
- Sin necesidad de guardar para ver costos
- Facilita ajustes antes de confirmar

### 5. Server Actions sobre API REST
**Decisión:** Usar Server Actions de Next.js para operaciones CRUD  
**Beneficios:**
- Menos código (no necesita endpoints API separados)
- RevalidatePath para actualización automática de UI
- Type safety de extremo a extremo

---

## Problemas Conocidos

### 1. TypeError en Fases (Línea 435)
```typescript
// Error: No se puede asignar 'number | undefined' a 'number'
{phase.estimated_duration_minutes !== undefined && (...)}
```
**Estado:** Corregido usando `!== undefined` en lugar de truthy check

### 2. Estados Compartidos en Variantes
**Problema:** Los ingredientes de variantes se compartían entre todas las variantes  
**Solución:** Añadido `editingVariantId` para trackear qué variante está en edición activa

### 3. Sidebar con Scroll
**Estado:** Solucionado - sidebar ahora tiene `overflow-y-auto` para manejar menús largos

---

## Funcionalidades Pendientes

### Críticas (Bloquean producción)

1. **Generación de Órdenes de Producción**
   - Convertir pedidos en batches de producción
   - Agrupar por producto y fecha de entrega
   - Calcular cantidad de batches necesarios

2. **Consumo de Inventario**
   - Al completar producción, descontar insumos usados
   - Registrar movimientos de inventario
   - Alertas de stock bajo

3. **Dashboard de Producción**
   - Vista para operarios con timers activos
   - Checkboxes de acciones internas
   - Marcado de fases completadas

### Importantes (Mejoran operación)

4. **Reportes**
   - Costos reales vs proyectados
   - Eficiencia de producción
   - Ventas por período
   - Rotación de inventario

5. **Notificaciones**
   - Pedidos nuevos
   - Stock bajo
   - Producción atrasada

6. **Múltiples Listas de Precios por Cliente**
   - Cliente puede tener precios específicos
   - Descuentos por volumen

### Mejoras (Nice to have)

7. **Imágenes de Productos**
   - Upload a Supabase Storage
   - Preview en catálogo

8. **Código de Barras**
   - Generación para productos
   - Escaneo en kiosco

9. **Integración con WhatsApp**
   - Notificaciones de pedidos listos
   - Confirmaciones de clientes

---

## Guía para Retomar el Proyecto

### 1. Entorno de Desarrollo

```bash
# Instalar dependencias
npm install

# Variables de entorno necesarias (.env.local)
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_key

# Iniciar desarrollo
npm run dev
```

### 2. Estructura de Datos Clave

Para entender el flujo completo:

```
Pedido (Order)
  └── Order Items (productos específicos)
       └── Producto (con o sin variante)
            └── Receta (ingredientes base)
            └── Variante (ingredientes extra si aplica)
                └── Ingredientes → Inventory Items

Producción (Production Batch)
  └── Asignado a Pedido
  └── Producto a fabricar
  └── Fases con timers y acciones
```

### 3. Archivos Clave para Modificar

| Funcionalidad | Archivos Principales |
|--------------|---------------------|
| Lógica de inventario | `src/actions/inventory.ts` |
| Lógica de productos | `src/actions/products.ts` |
| Lógica de pedidos | `src/actions/orders.ts` |
| Listas de precios | `src/actions/priceLists.ts` |
| Conversión de unidades | `src/lib/utils/unitConversions.ts` |
| Formatos de moneda | `src/lib/utils/formatters.ts` |
| Tipos de TypeScript | `src/types/database.types.ts` |

### 4. Patrones de UI

- **Formularios Wizard:** Usar pasos (Step 1, 2, 3...) como en `/productos/nuevo`
- **Tables:** Siempre con headers claros, hover states, acciones a la derecha
- **Cards:** Agrupar información relacionada
- **Badges:** Usar para estados (variant: 'success' | 'warning' | 'error' | 'info' | 'neutral')
- **Iconos:** Lucide React (`lucide-react`)

---

## Próximos Pasos Prioritarios

### Semana 1-2: Producción Operativa
1. Implementar `generateProductionBatches()` Server Action
2. Crear página `/produccion/activa` con timers funcionales
3. Implementar consumo de inventario al completar batches
4. Testeo end-to-end de flujo: Pedido → Producción → Entrega

### Semana 3-4: Dashboards y Reportes
5. Dashboard de producción para operarios
6. Dashboard administrativo con KPIs
7. Reporte de costos reales vs proyectados

### Semana 5: Optimizaciones
8. Mejorar performance de queries (índices en Supabase)
9. Implementar paginación en listados grandes
10. Añadir búsqueda/filtros avanzados

---

## Comandos Útiles

```bash
# Actualizar tipos de Supabase
npx supabase gen types typescript --project-id "your-project" --schema public > src/types/database.types.ts

# Reset de base de datos (cuidado!)
npx supabase db reset

# Deploy a producción
npm run build
```

---

## Contactos y Recursos

- **Supabase Dashboard:** https://app.supabase.com
- **Documentación Next.js:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Lucide Icons:** https://lucide.dev/icons

---

## Notas para el Equipo

1. **Siempre** usar el componente `Badge` para estados visuales
2. **Siempre** usar `formatCurrency()` para montos monetarios
3. **Nunca** hardcodear unidades, usar el sistema de `UnitType`
4. **Nunca** confiar en el estado del cliente para cálculos críticos (validar en server)
5. **Siempre** usar Server Actions con revalidatePath para actualizar UI
6. **Recordar:** Los productos con variantes almacenan ingredientes extra en JSONB

---

*Documento generado automáticamente. Última actualización: 3 de febrero de 2026*
