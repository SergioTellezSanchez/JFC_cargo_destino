# Minuta de Proyecto y Roadmap - AppEntregasCAFER
**Fecha:** 17 de diciembre de 2024
**Asunto:** Definición de Próximos Pasos y Evolución del Modelo de Negocio

---

## 1. Resumen de Estado Actual
Se ha avanzado significativamente en:
- Infraestructura base con Next.js y Firebase.
- Módulo de cotización (Quote Module) con UI moderna.
- Sistema de autenticación y roles básicos.
- Integración de mapas para selección de puntos de carga y destino.
- Soporte multi-idioma.

---

## 2. Definición de Próximos Pasos (Core Logístico)

### A. Documentación y Seguimiento
- **Generación de Guías:** Implementar la creación automática de guías de envío detalladas con toda la información de la carga, remitente y destinatario.
- **Máquina de Estados de Envío:** Implementar lógica de estados (Pendiente -> En Tránsito -> Entregado, etc.) con tracking en tiempo real para visibilidad total.

### B. Modelo Operativo y Legal
- **Seguros de Carga:** Evaluación de responsabilidades y coberturas entre:
  - Dueño de la carga.
  - Empresa de logística (CAFER).
  - Receptor final.
- **Definición de Cargos por Tipo de Mercancía:**
  - Carga Pesada.
  - Productos Químicos (Hazardous Materials).
  - Paquetería estándar (Nota: Este módulo se pausará temporalmente para priorizar B2B).

### C. Gestión de Flota y Costos
- **Configuración de Vehículos Especializados:** Definir parámetros detallados:
  - Tipo de suspensión.
  - Capacidad de carga (kg) y dimensiones.
  - Valor actual del activo.
  - Cálculo de depreciación e inversión en unidades nuevas para el pricing.
- **Métrica de Cobro:** Implementación de cálculo basado en **Km recorridos** + **Casetas**.
- **Logística Inversa y Eficiencia:** Rastreo en vivo para minimizar "viajes vacíos" y optimizar la administración de la flota.

---

## 3. Estructura de Usuarios y Roles
Se redefine la jerarquía de la plataforma:
1. **Admin Master:** Control total del sistema.
2. **Admin Jr:** Gestión específica de almacén y flota.
3. **Conductor:** Interfaz operativa para entregas.
4. **Usuario/Cliente:** Visualización de envíos y cotizaciones.

*Punto a definir:* Modelo de operación (¿Hombre-camión vs Empresa con conductores? ¿Quién realiza carga/descarga?).

---

## 4. Estrategia de Crecimiento (Roadmap)

### Fase 1: Consolidación de Partners
- Enfoque en la creación y registro de vehículos en la plataforma.
- Establecer alianzas con transportistas.

### Fase 2: Captación de Clientes B2B
- Enfoque prioritario en **Cargas Completas** y **Entregas Recurrentes**.
- Ejemplo de cliente objetivo: Sopas Nissin.
- Propuesta de valor: Transparencia total de la flotilla y tracking en tiempo real.

---

## 5. Acuerdos Inmediatos
- **PAUSAR módulo de paquetería minorista** para concentrar esfuerzos en logística pesada y B2B.
