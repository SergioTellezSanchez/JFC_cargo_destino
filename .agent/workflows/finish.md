---
description: Protocolo de cierre que valida calidad, actualiza documentación, ejecuta mentoría y sube cambios a Git.
---
## Pasos
1. **Entrevista de Cierre (Closure Interview):**
   - Pregunta: ¿Cuáles eran los objetivos? ¿Qué se entregó? ¿Hubo cambios de alcance? ¿Hay Known Issues pendientes? *Espera respuesta.*
2. **Sanity Check y QA Local:**
   - Revisa `git diff <branch> --stat`.
   - Elimina `console.log` de producción, asegúrate de no usar `any`, sin valores hardcodeados ni archivos temporales.
3. **Build Verification (Obligatorio):**
   - Corre `npx next build` localmente (o equivalente).
   - Corrige errores de TypeScript inmediatos hasta lograr exit code 0. No continues sin esto.
4. **Actualización de Documentación:**
   - **MINUTA.md:** Añade en top histórico la fecha, alcance y archivos clave modificados. Actualiza el snapshot del proyecto. (Mantén el historial).
   - **ARCHITECTURE.md & PROCESS_FLOWS.md:** Valida y documenta si hubo alteraciones de backend/esquemas.
5. **Flujo de Versionado Git:**
   - Haz commit semántico (`feat:`, `fix:`, `refactor:` detallando cambios y Docs).
   - Haz push a la rama en curso (ej. `dev`).
   - Sube (merge) los cambios a `staging` para pruebas.
   - 🚫 **Nunca fusiones a `main` sin UAT (User Acceptance Testing) y confirmación expresa del usuario.**
6. **Protocolo de Mentoría:** Añade un "Deep Dive" explicando de manera sencilla al usuario alguna decisión arquitectónica o mejora proactiva tomada en el código (SOLID, DRY, Clean Architecture).
