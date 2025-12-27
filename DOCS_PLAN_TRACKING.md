# Plan de Implementación: Máquina de Estados y Tracking Logístico

Este plan detalla los pasos para robustecer el seguimiento de envíos y la gestión operativa de la flota.

## 1. Definición de la Máquina de Estados
A diferencia de un simple campo de texto, implementaremos una lógica de transición.

### Estados Propuestos:
- **CREADO (CREATED):** Pedido registrado, pendiente de asignación.
- **ASIGNADO (ASSIGNED):** Vehículo/Conductor asignado.
- **EN_RECOLECCIÓN (PICKING_UP):** Conductor en camino al origen.
- **RECOLECTADO (PICKED_UP):** Carga confirmada en el vehículo.
- **EN_TRÁNSITO (IN_TRANSIT):** Viaje en curso hacia el destino.
- **EN_ESPERA (ON_HOLD):** Problemas en ruta, aduanas, o almacenaje solicitado.
- **ENTREGADO (DELIVERED):** Carga entregada y confirmada.
- **CANCELADO (CANCELLED):** Envío anulado.

## 2. Actualización de Base de Datos (Firebase)
Cada documento en `packages` (o cambiar a `shipments`) deberá incluir:
- `history`: Array de objetos `{ state: string, timestamp: string, updatedBy: string, notes: string, location: { lat, lng } }`.
- `currentStatus`: Estado actual extraído del último registro del historial.
- `assignedVehicleId`: ID del vehículo (relacionado con la nueva colección de flota).
- `assignedDriverId`: ID del conductor (relacionado con el rol Conductor).

## 3. Generación de Guía (PDF/Digital)
- Crear un endpoint que genere un formato imprimible (PDF) con:
  - Código QR con el `trackingId`.
  - Detalles de carga (Peso, Dimensiones, Peligrosidad).
  - Seguros aplicados.
  - Firma digital de recolección/entrega.

## 4. Visualización en Tiempo Real (Tracking Admin/User)
- **Vista Conductor:** App móvil (o vista optimizada) para actualizar estado y enviar posición GPS.
- **Vista Cliente:** Mapa simplificado con el historial de eventos.
- **Vista Admin Master:** Mapa global con todos los vehículos activos y alertas de retrasos.

## 5. Próximos Pasos Técnicos
1.  Crear esquema de validación para transiciones de estados (ej. no pasar de CREADO a ENTREGADO sin pasar por RECOLECTADO).
2.  Desarrollar componentes de UI para el "Timeline" del envío.
3.  Configurar Webhooks o listeners de Firebase para actualizaciones "Push" en el mapa.
