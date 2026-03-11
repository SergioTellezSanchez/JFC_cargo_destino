---
description: Protocolo de cierre que valida calidad, actualiza documentación, ejecuta mentoría y sube cambios a Git.
---
## Pasos
1. **Entrevista de Cierre (Closure Interview):** Valida la promesa vs el entregable. Pregunta al usuario sobre alcance real completado y si queda deuda técnica (Known Issues). *Espera respuesta.*
2. **Sanity Check y QA Local:**
   - Busca red flags en el código: `console.log` olvidados, tipos `any`, valores hardcodeados.
   - Valida que el build compile de forma exitosa (`npx next build` o equivalente local). Arregla errores de TypeScript inmediatamente.
3. **Actualización de Documentación:**
   - Escribe en `docs/MINUTA.md` un histórico con la fecha, el alcance y los archivos clave alterados.
   - Constata si hay alteraciones estructurales para reflejarlos en `docs/ARCHITECTURE.md`.
4. **Flujo de Versionado Git:** Incluye archivos modificados pero evita la subida de archivos basura. Confirma con un commit semántico y consolida (push) a ramas como `dev` o `staging` (según aplique). Evita subidas directas a `main` sin UAT (User Acceptance Testing).
5. **Protocolo de Mentoría:** Añade un "Deep Dive" explicando de manera sencilla al usuario una decisión arquitectónica o mejora implementada (fomento de curiosidad).
