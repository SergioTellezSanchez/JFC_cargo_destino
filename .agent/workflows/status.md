---
description: Audita el estado actual del código frente a la documentación para evitar la "deriva" del proyecto y el tech debt.
---
## Pasos
1. **Entrevista de Contexto:** Pregunta al usuario si hubo cambios de arquitectura recientes, integraciones temporales o decisiones ad-hoc que deban conocerse.
2. **Análisis de Documentos Clave:** Lee `docs/ARCHITECTURE.md`, `docs/WORKING_PLAN.md`, `docs/PROCESS_FLOWS.md` y `docs/MINUTA.md`.
3. **Auditoría de Código y Arquitectura:** Escanea la estructura de archivos, dependencias (`package.json`) y la implementación actual cruzando contra la documentación.
4. **Detección de Inconsistencias:** Genera una tabla comparativa resaltando:
   - Código que viola la arquitectura definida o desvía de los `PROCESS_FLOWS`.
   - Tecnologías usadas no declaradas en el stack.
   - Tareas en el plan que no coinciden con el progreso listado en `MINUTA.md`.
5. **Resolución:** Pregunta al usuario si prefiere actualizar los documentos o refactorizar el código para alinearlos.
