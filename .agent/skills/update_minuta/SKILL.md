---
name: Update Project Minute
description: Procedure for updating the single source of truth for project agreements and progress (MINUTA.md).
---

# 📝 Update Project Minute Protocol

**Goal:** Keep `docs/MINUTA.md` as the living history and current status of the project.

## 1. When to Trigger
*   **Milestone Reached:** When a Sprint or major Feature is completed.
*   **Decision Made:** When the user changes a business rule (e.g., "Pause Retail Module").
*   **Pivot:** When the roadmap direction changes significantly.

## 2. Process
1.  **Solicit Information (The "Why"):**
    *   **Ask:** "What specific event or decision occurred? What is the date? Who made the decision?"
    *   **Explain:** "I need the exact date to maintain a chronological history. I need the decision maker's name for accountability."
2.  **Read Current State:** `view_file docs/MINUTA.md`
2.  **Determine Action:**
    *   **Status Update:** Update the "1. Estado Actual (Snapshot)" section at the top.
    *   **Logging History:** Create a new entry in "2. Histórico de Minutas (Bitácora)" with the format `### 📅 [DD-MMM-YYYY] Título del Evento`.
3.  **Content Rules:**
    *   **Summarize:** Do not copy-paste code. Synthesize agreements and decisions.
    *   **Append:** New history entries go to the top of the history list (reverse chronological).
    *   **Preserve:** Never delete past history entries unless they are duplicates.
4.  **Execution:** Use `replace_file_content` to insert the new section or update existing ones.

## 3. Formatting Rules
*   Use Emojis for headers to maintain readability.
*   Keep bullet points concise.
*   Do not create new `.md` files for minutes. Append or Edit `docs/MINUTA.md`.
