# 📝 Minuta Maestra de Proyecto - JFC Cargo Destino

**Última Actualización:** 11 de Febrero de 2026

---

## 🚀 1. Estado Actual (Snapshot)
**Fase Actual:** Sprint 1 — Refactorización Motor de Cotización
**Objetivo Inmediato:** Motor de cotización desacoplado, simulador en vivo refinado, precios mínimos por vehículo.

### Módulos Activos
*   **Motor de Cotización (`calculations.ts`):** Refactorizado. Lógica desacoplada en hooks (`useQuoteCalculator`). Incluye precio mínimo por vehículo.
*   **Simulador en Vivo (`AdminSimulator`):** Funcional con inputs exactos de km, casetas separadas ida/vuelta, indicador de precio mínimo.
*   **Admin Panel (Configuración de Vehículos):** Campo `minPrice` editable por vehículo desde el panel.
*   **Tracking:** En diseño.

---

## 📜 2. Histórico de Minutas (Bitácora)

### 📅 [11-Feb-2026] Refactorización Motor de Cotización y Precio Mínimo por Vehículo
*   **Resumen:** Se completa la refactorización del motor de costos logísticos y el simulador en vivo del panel admin.
*   **Cambios Clave:**
    1.  **Precio Mínimo por Vehículo:** Se agrega campo `minPrice` al schema `PricingSettings.vehicleDimensions` (ej: Tráiler = $9,000). Si el costo calculado de ida+vuelta es menor al mínimo, se aplica el mínimo + IVA.
    2.  **Fix: Mismatch de campo** — El UI guardaba como `minPrice` pero el motor leía `minimumPrice`. Alineado a `minPrice` en schema, cálculos y defaults.
    3.  **Simulador Refinado:** Inputs numéricos exactos para km (ida/vuelta), casetas separadas, indicador visual (ámbar) cuando se aplica precio mínimo.
    4.  **Benchmark Tests:** Suite de 31 pruebas contra pricing de Transportes Duarte. Incluye test de precio mínimo.
    5.  **Hooks Desacoplados:** `useQuoteCalculator` y `useSimulatorState` extraídos de `AdminSimulator`.
*   **Archivos Principales:** `calculations.ts`, `pricing.ts`, `AdminSimulator.tsx`, `VehicleSettings.tsx`, `calculations.benchmark.test.ts`.
*   **Decisión:** Valores de `minPrice` deben configurarse desde el panel admin por vehículo; `DEFAULT_SETTINGS` solo sirve como fallback.

### 📅 [03-Feb-2026] Evolución de Plataforma & Arquitectura
*   **Resumen:** Se consolida la visión del "Momento Nexo" (Subastas) y se define el stack tecnológico final.
*   **Definición de Módulos:**
    1.  **Módulo de Cotización (Fase 1):** Motor de decisión que asegura rentabilidad técnica y financiera. Algoritmo multivariable (Distancia/Peso/Vehículo).
    2.  **Gestión Administrativa (Fase 2):** Panel de control de flota, directorio de conductores y dashboard de ROI.
    3.  **App de Conductor:** Máquina de estados (XState) para flujo de entrega (Asignado -> En Tránsito -> Entregado).
    4.  **Incertidumbre:** Se define "Imponderables" como variable de costo.
*   **Arquitectura:** Se migra oficialmente a **Next.js Serverless** + **Firebase Realtime Database**.

### 📅 [17-Dic-2024] Minuta Original - Inicio de Logística
**Asunto:** Definición de Próximos Pasos y Evolución del Modelo de Negocio

1.  **Modelo Operativo:**
    *   **Seguros:** Evaluación de responsabilidades (Dueño carga vs Logística).
    *   **Cargas:** Definición de tipos (Pesada, Químicos, Paquetería).
    *   **Acuerdo Clave:** **PAUSAR módulo de paquetería minorista** para priorizar B2B (Cargas completas).

2.  **Estructura de Usuarios:**
    *   **Admin Master:** Control total.
    *   **Admin Jr:** Almacén y flota.
    *   **Conductor:** Interfaz operativa.
    *   **Cliente:** Cotización y tracking.

3.  **Estrategia (Roadmap Inicial):**
    *   Fase 1: Registro de vehículos y alianzas con transportistas.
    *   Fase 2: Captación de clientes B2B (Ej. Sopas Nissin).

---

## 🔮 3. Próximos Pasos (Backlog)
1.  **Tech:** Refactorización `QuotePage` (Hooks).
2.  **Tech:** Type Safety en Admin.
3.  **Feature:** Notificaciones WhatsApp.
4.  **Feature:** Dashboard Financiero (Revenue vs Costos).
