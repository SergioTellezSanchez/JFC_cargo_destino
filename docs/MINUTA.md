# 📝 Minuta Maestra de Proyecto - JFC Cargo Destino

**Última Actualización:** 03 de Febrero de 2026

---

## 🚀 1. Estado Actual (Snapshot)
**Fase Actual:** Desarrollo de Sprint 1 (Refactorización & MVP Admins)
**Objetivo Inmediato:** Desacoplar lógica de cotización y estabilizar panel administrativo.

### Módulos Activos
*   **Cotizador:** Funcional (requiere refactor).
*   **Admin Panel:** Funcional (requiere type safety y mejoras UI).
*   **Tracking:** En diseño (Integración Google Maps lista).

---

## 📜 2. Histórico de Minutas (Bitácora)

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
