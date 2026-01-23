MINUTA DE EVOLUCIÓN DE PLATAFORMA - JFC CARGO DESTINO

CONTEXTO DEL PROYECTO
El ecosistema digital de JFC Cargo destino ha sido diseñado para transformar la logística de transporte en un proceso automatizado, rentable y transparente. El desarrollo se ha estructurado en dos fases estratégicas:
- Fase 1: Motor de Cotización Inteligente: El núcleo algorítmico que garantiza la viabilidad financiera de cada operación.
- Fase 2: Gestión Operativa y Control en Tiempo Real: La infraestructura que permite la ejecución, monitoreo y documentación de los servicios logísticos.

---

MÓDULOS Y FUNCIONALIDADES DETALLADAS

1. MÓDULO DE COTIZACIÓN (FASE 1)
Este módulo trasciende una simple calculadora de precios; es un motor de decisión que asegura que cada servicio sea rentable y técnicamente factible.
- Algoritmo de Pricing Multivariable: Calcula el costo basándose no solo en la distancia, sino en el desgaste del activo (depreciación por km), costos fijos operativos, y márgenes de utilidad dinámicos.
- Motor de Idoneidad Técnica: Valida automáticamente si el vehículo seleccionado cuenta con la capacidad de carga (kg), volumen (m3) y equipamiento especial (ej. suspensión neumática para electrónicos o químicos) requerido por el tipo de mercancía.
- Cálculo de Riesgo Portuario y de Carga: Integra automáticamente el costo del seguro basado en el valor declarado de la mercancía, garantizando la cobertura desde el primer momento.
- Diferenciación de Niveles de Servicio: Capacidad de ajustar costos para entregas estándar vs. express mediante multiplicadores logísticos.

2. GESTIÓN ADMINISTRATIVA Y FLEET MANAGEMENT (FASE 2)
El centro neurálgico donde los administradores orquestan los recursos de la empresa.
- Panel de Control de Flota: Gestión detallada de vehículos, incluyendo placas, tipos de suspensión y capacidades técnicas que alimentan al cotizador.
- Directorio de Conductores y Seguridad: Perfiles de conductores con gestión de identidades y fotografías, vinculándolos a empresas de logística específicas para una trazabilidad total.
- Dashboard de Rentabilidad (ROI): Visualización inmediata de la proyección de utilidad de cada paquete, permitiendo al administrador tomar decisiones informadas sobre la asignación de recursos.

3. APLICACIÓN PARA EL CONDUCTOR (FASE 2)
Una herramienta diseñada para la eficiencia en campo, minimizando errores operativos.
- Flujo de Trabajo Robusto (XState): Uso de una máquina de estados finitos que garantiza que el proceso logístico siga un orden lógico (Asignado -> En Carga -> En Tránsito -> Descargando -> Entregado), evitando saltos de estado inconsistentes.
- Sistema de Evidencia Digital: Permite al conductor capturar y subir pruebas visuales de la carga en origen y destino, integrándolas al expediente digital del envío.
- Actualización de Estatus Activa: Notifica al sistema central cada hito del viaje, permitiendo una reacción rápida ante "fallos" o retrasos.

4. PORTAL DE TRACKING Y DOCUMENTACIÓN AUTOMÁTICA (FASE 2)
La interfaz de transparencia hacia el cliente final y la formalización del servicio.
- Visor de Rastreo en Vivo: Permite al cliente monitorear el progreso de su envío sin necesidad de llamadas telefónicas, basándose en los hitos registrados por el conductor.
- Generador de Guías de Embarque (PDF): Automatización de la documentación legal. Genera guías con códigos QR que resumen los datos de la carga, conductor, vehículo y ruta, listos para descargar e imprimir.

---

INTERRELACIÓN SISTÉMICA ENTRE MÓDULOS

La fuerza de JFC Cargo destino radica en la comunicación fluida entre sus componentes:

1. De la Cotización a la Asignación: Los parámetros definidos durante la cotización (tipo de carga o valor) actúan como "filtros inteligentes" en el panel administrativo. Un administrador solo puede asignar un vehículo que cumpla con los requisitos técnicos validados en la Fase 1.
2. Sincronía Operativa (Admin <-> Driver): Cuando se realiza una asignación en el panel administrativo, la App del Conductor recibe la orden de trabajo instantáneamente. Los cambios de estado realizados por el conductor alimentan de vuelta el panel de control, permitiendo ver la rentabilidad real frente a la proyectada.
3. Trazabilidad hacia el Cliente: Las acciones de la App del Conductor (como pulsar "Iniciar Tránsito" o subir una foto) se reflejan de inmediato en el Portal de Tracking. No hay silos de información; el dato fluye desde el origen (Cotizador) hasta el final (Entrega Certificada).
4. Cierre Documental: El PDF de la Guía de Envío es el resultado final que consolida la información de todos los módulos: el costo y datos de carga (Cotización), el vehículo y conductor (Administración) y los sellos de tiempo de la operación (App Conductor).
