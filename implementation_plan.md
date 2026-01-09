# Plan de Implementación - Expansión de Plataforma JFC Cargo Destino

Este plan detalla los pasos para implementar las nuevas funcionalidades solicitadas, organizadas por módulos.

## Fase 1: Actualización de Entidades y Administración (Vehículos y Choferes)
- [ ] **Módulo Vehículos**:
    - [ ] Agregar campo `year` (Año del modelo).
    - [ ] Cambiar selección de tipo por Checkboxes (Refrigerada, Caja Seca, Plataforma, Cama Baja, Pirámide).
    - [ ] Implementar cálculo automático de depreciación por km (basado en vida útil de 5 años).
- [ ] **Módulo Choferes**:
    - [ ] Agregar campo `age` (Edad).
    - [ ] Agregar campo `dailySalary` (Sueldo diario).
    - [ ] Agregar/Asegurar campo `license` (Licencia).
    - [ ] Mostrar foto en el listado principal.
- [ ] **Configuración Global**:
    - [ ] Asegurar que la actualización de precios de combustible no afecte registros históricos.
    - [ ] Agregar traducciones para Chino, Alemán y Francés en `lib/i18n.ts`.

## Fase 2: Rediseño del Módulo de Cotización
- [ ] **UI/UX del Mapa**:
    - [ ] Ocultar mapa en el paso 1 (Unidad).
    - [ ] Mostrar mapa con ruta y KM en los pasos de Ruta y Servicio.
    - [ ] Desactivar modo oscuro en Google Maps.
- [ ] **Lógica de Formulario**:
    - [ ] Eliminar "Detalle Operativo (Avanzado)" del paso de Ruta.
    - [ ] Agregar selección de tipo de carga (Heavy, Hazard, Packages).
    - [ ] Agregar selección de modalidad: FTL (Full), PTL (Partial), LTL (Less than Truckload).
    - [ ] Agregar opciones extras: Seguro JFC (con valor declarado), Soporte Carga/Descarga, Apilable, Emplayado.
- [ ] **Motor de Cálculo Core**:
    - [ ] Integrar cálculo de casetas (Investigar API o tabla de referencia).
    - [ ] Cálculo de "Otros Gastos" dinámico por KM.
    - [ ] Desglose técnico de la lógica en el resumen final.
    - [ ] Mostrar costo operativo por KM en el último paso.

## Fase 3: Órdenes de Servicio y Logística
- [ ] **Guías de Envío**:
    - [ ] Implementar generación de PDF para la guía (abrir en pestaña nueva).
- [ ] **Tracking**:
    - [ ] Crear interfaz de seguimiento en tiempo real.
- [ ] **Módulo de Almacenes**:
    - [ ] Listar órdenes entrantes vs órdenes sin vehículo asignado.
    - [ ] Indicador visual de ocupación actual (%) en metros cúbicos.
- [ ] **Empresas de Logística**:
    - [ ] Implementar lógica de "Viajes de Retorno" (Backhaul) para optimizar rutas aprovechando entregas pendientes.

## Fase 4: Módulos Operativos (Carga y Descarga)
- [ ] **Vista Operario - Carga**:
    - [ ] Selección de orden y visualización de guía de carga.
    - [ ] Sistema de subida de múltiples fotos de evidencia.
- [ ] **Vista Operario - Descarga**:
    - [ ] Selección de orden y guía de descarga.
    - [ ] Subida de fotos de evidencia de entrega.

---

### Próximos Pasos Inmediatos:
1.  **Actualizar Interfaces**: Modificar `src/lib/logistics.ts` para soportar los nuevos campos en Vehículos, Choferes y Paquetes.
2.  **Módulos Administrativos**: Implementar los cambios en `VehicleManagement` y `DriverManagement`.
3.  **Traducciones**: Agregar los nuevos idiomas.
