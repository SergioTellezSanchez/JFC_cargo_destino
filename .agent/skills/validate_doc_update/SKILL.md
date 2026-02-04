---
name: Validate Architecture Documentation
description: Protocol to ensure ARCHITECTURE.md stays in sync with codebase changes.
---

# 🏗️ Validate Architecture Doc Protocol

**Goal:** Prevent "Documentation Drift". The map (`ARCHITECTURE.md`) must always match the territory (The Code).

## 1. When to Trigger
*   **New Integration:** Adding a library to `package.json` (e.g., `resend`, `stripe`).
*   **New Module:** Creating a new top-level directory in `src/app`.
*   **Schema Change:** Modifying `src/lib/firebase/schema.ts`.
*   **Infrastructure Change:** Changing deployment target, database, or core tech stack.

## 2. Validation Steps
1.  **Solicit Information (The "Why"):**
    *   **Ask:** "What was the intent of this code change? Is this a temporary hotfix or a permanent architectural shift?"
    *   **Explain:** "I need to know the intent because hotfixes shouldn't always alter the long-term architecture document."
2.  **Analyze the Change:** What structural component is being touched?
2.  **Check Documentation:** `view_file docs/ARCHITECTURE.md`
3.  **Compare:**
    *   *Code:* `Using Next.js API Routes` vs *Doc:* `Using Express` -> **CONFLICT**
    *   *Code:* `New 'Warehouses' collection` vs *Doc:* `Missing in Schema section` -> **CONFLICT**
4.  **Action:**
    *   If conflict found: **IMMEDIATELY** create a task to update `ARCHITECTURE.md`.
    *   Do not leave it for "later".

## 3. Self-Correction
*   If you are about to write code that violates the architecture defined in the doc, STOP.
*   Ask the user: "This change contradicts `ARCHITECTURE.md`. Should we update the architecture or change the approach?"
