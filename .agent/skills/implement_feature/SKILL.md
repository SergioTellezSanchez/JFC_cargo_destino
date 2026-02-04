---
name: Feature Implementation Protocol
description: Standard procedure for implementing new features while strictly adhering to JFC Architecture.
---

# 🛡️ Feature Implementation Protocol

**Goal:** Implement features that are robust, testable, and aligned with the `JFC Cargo Destino` architecture.

## 1. 🏗️ Phases of Construction

### Phase 1: Architectural Alignment (PLANNING)
Before writing a single line of code, you MUST:
1.  **Read the Sacred Texts:**
    *   `view_file docs/ARCHITECTURE.md`
    *   `view_file docs/TECH_STACK.md`
2.  **Identify the Component:**
    *   Which of the **7 Main Components** does this feature belong to? (e.g., *Customer Portal*, *JFC Core*, *Carrier Portal*).
    *   Does it require a new `Service` or `Hook`? (See `src/lib` vs `src/components`).
3.  **Draft Implementation Plan:**
    *   Create `implementation_plan.md` (or update existing).
    *   **CRITICAL:** Explicitly state: "This feature impacts [Component X] and adheres to [Pattern Y] defined in ARCHITECTURE.md".

### Phase 2: Controlled Execution (EXECUTION)
1.  **Strict Typing:** Use TypeScript interfaces for all new data structures. No `any`.
2.  **Atomic Commits:** Commit often with semantic messages (e.g., `feat:`, `fix:`, `refactor:`).
3.  **UI Compliance:**
    *   Use Tailwind CSS.
    *   Reuse components from `src/components/ui` (if available) or create generic ones.
    *   **Aesthetics:** Ensure "Rich Aesthetics" as per project guidelines (Glassmorphism, vibrant colors).

### Phase 3: QA & Verification (VERIFICATION)
1.  **Simulator Check:** If the feature affects pricing/logic, run the `QuoteCalculator` logic to verify no regressions.
2.  **Build Check:** Run `npm run build` to ensure no type errors.
3.  **Self-Correction:** If the build fails, fix it immediately. Do not ask the user.

## 2. 🚫 Forbidden Actions
*   Do NOT import directly from `node_modules` in client components if it breaks Server Components.
*   Do NOT create new top-level directories without justifying it against `ARCHITECTURE.md`.
*   Do NOT leave `console.log` in production code.
