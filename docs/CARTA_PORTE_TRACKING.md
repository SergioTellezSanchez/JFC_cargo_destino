# Estandarización y Seguimiento de Carta Porte (SAT)

Este documento detalla los requerimientos, consideraciones y el estado de la implementación del complemento **Carta Porte (Versión 3.0 del SAT)** dentro del sistema JFC Cargo Destino.

## 1. Contexto Normativo
La Carta Porte es un documento fiscal digital obligatorio en México que ampara el traslado de bienes y mercancías en territorio nacional. Se divide principalmente en dos responsabilidades:
1. **El Cliente (Generador de la Carga):** Responsable de proporcionar información verídica, exacta y completa sobre la mercancía (descripción, peso, cantidad, clave SAT) y las ubicaciones (origen y destino precisos con código postal).
2. **El Transportista (JFC Cargo Destino):** Responsable de emitir el CFDI de Ingreso o Traslado con el complemento Carta Porte incorporando los datos proporcionados por el cliente más los datos logísticos operativos del vehículo, los seguros y el operador.

## 2. Puntos Clave a Considerar en la Implementación

### A. Información Recabada del Cliente (Interfaz Cotizador)
Para que el cliente nos pueda proporcionar exitosamente la información del SAT, interfaces de Cotización u Órdenes deben requerir:
- [x] **Clave SAT del Producto/Servicio:** Código de 8 dígitos según el catálogo de productos/servicios del SAT para carta porte (ej. `24101600`).
- [x] **Clave de Unidad de Medida (SAT):** Por ejemplo, `KGM` para kilogramos o `H87` para pieza.
- [x] **Material Peligroso:** Confirmación (Sí / No) y, en caso afirmativo, captura de la clave correspondiente (Catálogo `c_MaterialPeligroso`).
- [x] **Peso Bruto Total (KGM):** Declaración exacta del peso de los bienes.
- [x] **Fechas y Horas Exactas:** Fecha y hora tanto para Recolección (Origen) como para Entrega (Destino).
- [ ] **Desglose Multidestino (Próximamente):** Si hay múltiples puntos de recolección u entrega, todos deben quedar documentados paso por paso (Ruta).
- [ ] **Detalle de Embalaje:** En caso de material peligroso, clave de Tipo de Embalaje (`c_TipoEmbalaje`).

### B. Información de Ubicaciones
- [x] Coordinadas Lat/Lng (Ya implementado vía Google Maps).
- [ ] **Dirección SAT Estandarizada:** Calle, número exterior, Código Postal, Colonia, Municipio/Delegación, Estado, País. (El CP es *indispensable* para la validación del SAT).
- [ ] **RFC de Remitente(s) y Destinatario(s):** Datos fiscales de recolección y entrega.

### C. Información Operativa (JFC Admin / Transportista)
El panel de administración o transportista debe inyectar la información de la unidad que provee el servicio:
- [x] **Tipo de Vehículo:** Rabón, Torton, Tráiler, etc.
- [x] **Ejes del Vehículo:** Ahora requerido para el cálculo de Casetas e indispensable como Configuración Vehicular SAT (`c_ConfigAutotransporte`).
- [ ] **Placas del Vehículo y Remolque.**
- [ ] **Permisos SCT:** Clave del permiso SCT y número del permiso de la unidad.
- [ ] **Seguros:** Nombre de aseguradora y número de póliza por Responsabilidad Civil, Daños al Medio Ambiente (si es material peligroso) y Carga.
- [ ] **Información del Operador:** RFC y No. de Licencia vigente.

## 3. Estado Actual de la Implementación (Checklist)

### ✅ Fase 1: UI Cliente y Esquemas Base (Marzo 2026)
- [x] Actualización de dependencias/esquemas TypeScript (`orders.ts`, `shared.ts`).
- [x] Adaptación de la Interfaz del Cotizador (`quote/page.tsx`) para recolectar Fecha/Hora de Carga y Entrega.
- [x] UI/UX del cotizador: Aviso de obligatoriedad de datos SAT (Clave SAT, Material Peligroso).
- [x] Lógica de casetas actualizada basada en los ejes del vehículo seleccionado para hacer viable la cotización.

### ⏳ Fase 2: Validaciones y Catálogos SAT SAT (En Progreso / Pendiente)
- [ ] Agregar un Autocomplete básico o pre-carga de los catálogos de **Claves de Productos SAT** principales.
- [ ] Validar que las direcciones devueltas por Google Maps desglosen correctamente y guarden el **Código Postal**.
- [ ] Captura del **RFC de Remitentes y Destinatarios** de carga (Dirección Fiscal) durante la cotización o justo después.

### ⏳ Fase 3: Portal Transportista (Pendiente)
- [ ] Modales en el portal de asignación de carga para inyectar Placas, Operador, Licencia y Pólizas.
- [ ] Generación automática de un JSON estructurado listo para enviarse al PAC (Proveedor Autorizado de Certificación) e intentar el Timbrado.
- [ ] Flujo de Manejo de Errores de timbrado Carta Porte (Avisos si la clave SAT del cliente no es válida, CP erróneo, etc).

---
*Este documento se mantendrá vivo como Bitácora Central de la migración de JFC a la estructura oficial Carta Porte.*
