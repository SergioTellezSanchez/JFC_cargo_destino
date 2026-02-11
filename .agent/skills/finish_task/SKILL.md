---
name: Finish Task Protocol
description: Structured procedure for closing a task — validates work, updates documentation, pushes code, and defines pre-production tests.
---

# ✅ Finish Task Protocol

**Goal:** Ensure every task is closed cleanly — reviewed, documented, tested, and deployed to the correct branches.

---

## 1. 🔍 Closure Interview (The "What Did We Deliver?" Phase)

**CRITICAL:** Before closing, align on what was accomplished.

Ask the user the following questions (skip any the user has already answered):

1.  **Objectives:** "¿Cuáles eran los objetivos principales de esta tarea?"
    *   **Why:** To verify what was promised vs what was delivered.
2.  **Deliverables:** "¿Cuáles son los entregables concretos? (archivos nuevos, features, fixes)"
    *   **Why:** To create a checklist of what to validate.
3.  **Scope:** "¿Hubo cambios de alcance durante la tarea? ¿Algo se dejó fuera o se agregó?"
    *   **Why:** To document deviations in the MINUTA.
4.  **Known Issues:** "¿Hay algo pendiente, incompleto, o que se deba monitorear?"
    *   **Why:** To flag technical debt or follow-up tasks.

**Wait for answers before proceeding.**

---

## 2. 🧹 Code Review & Sanity Check

Perform a self-review of all changes made during the task:

1.  **Run `git diff dev --stat`** to see all modified files.
2.  **Scan for Red Flags:**
    *   `console.log` statements left in production code.
    *   `any` types that should be properly typed.
    *   Commented-out code blocks with no explanation.
    *   Hardcoded values that should come from config/Firebase.
    *   Temp/debug files (e.g., `tsc_output*.txt`, `verify_*.ts`) staged for commit.
3.  **Assess Impact:**
    *   Does any change affect shared utilities (`calculations.ts`, `schema.ts`, `i18n.ts`)?
    *   Could any change break existing pages or components?
4.  **Report to User:**
    *   If issues found: "Encontré [N] items que recomiendo ajustar antes de cerrar." List them.
    *   If clean: "El código se ve limpio. No hay red flags."

---

## 3. 🏗️ Build Verification

**MANDATORY** — No code leaves without a passing build.

1.  Run `npx next build` locally.
2.  If it fails:
    *   Fix TypeScript errors immediately (do NOT ask the user).
    *   Common patterns: `?? 0` for optional numbers, type narrowing for union types.
    *   Re-run build until exit code is 0.
3.  If it passes: Proceed.

---

## 4. 📝 Documentation Update

Execute two existing skills in sequence:

### 4a. Update MINUTA (`update_minuta` skill)
1.  Read `docs/MINUTA.md`.
2.  Update **"1. Estado Actual (Snapshot)"** to reflect current project state.
3.  Add a new **history entry** at the top of the Bitácora with:
    *   Date in format `[DD-MMM-YYYY]`
    *   Summary of what was accomplished
    *   Key files changed
    *   Decisions made

### 4b. Validate Architecture (`validate_doc_update` skill)
1.  Read `docs/ARCHITECTURE.md`.
2.  Check if any changes touched:
    *   Firebase schema / new collections
    *   New integrations or dependencies
    *   New top-level modules or routing changes
    *   Tech stack changes
3.  If conflict found → Update `ARCHITECTURE.md`.
4.  If no conflict → State "ARCHITECTURE.md validado, sin conflictos."

---

## 5. 🔀 Git: Commit & Push to Dev + Staging

1.  **Stage changes:**
    *   Include all source files, docs, configs.
    *   **Exclude:** `tsc_output*.txt`, `*.log`, temp verification files.
    *   Use quoted paths for directories with special characters (e.g., `"src/app/(admin)/"`).
2.  **Commit** with a descriptive semantic message:
    ```
    feat|fix|refactor: [short description in Spanish]

    - Bullet 1: what changed
    - Bullet 2: what changed
    - Docs: MINUTA.md actualizada
    ```
3.  **Push** the feature branch to origin.
4.  **Merge into `dev`** with `--no-edit` flag and push.
5.  **Merge into `staging`** with `--no-edit` flag and push.
6.  **Do NOT merge into `main`** — this requires passing pre-production tests first.

---

## 6. 🧪 Pre-Production Test Plan

Before the code can go to `main` (production), the following must be verified:

### Automated
*   [ ] `npx next build` passes (exit code 0).
*   [ ] All unit/benchmark tests pass: `npx vitest run`.
*   [ ] No TypeScript errors: `npx tsc --noEmit`.

### Manual (User Responsibility)
*   [ ] **Staging URL:** Verify the Vercel staging deployment loads without errors.
*   [ ] **Affected Features:** Manually test every feature touched by this task.
*   [ ] **Regression:** Quick-check adjacent features that share modified files.
*   [ ] **Mobile:** If UI was changed, validate on mobile viewport.
*   [ ] **Firebase Console:** If schema or config changed, verify data integrity in Firebase.

### Sign-off
*   Once all tests pass, the user gives approval and the assistant runs:
    ```
    git checkout main
    git merge staging --no-edit
    git push origin main
    ```

---

## 7. 🚫 Forbidden Actions
*   Do NOT push to `main` without explicit user approval.
*   Do NOT skip the build verification step.
*   Do NOT delete or overwrite past MINUTA history entries.
*   Do NOT leave temp files in the commit.
