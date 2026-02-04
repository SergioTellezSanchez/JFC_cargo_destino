---
name: New Task Protocol
description: Protocol for handing new inquiries. It enforces gathering context, explaining relevance, and recommending specific skills.
---

# 📋 New Task Protocol

**Goal:** Ensure every new task starts with clear requirements and a solid plan that leverages existing skills.

## 1. Solicit Information (The "Why" Phase)
**CRITICAL:** Before doing anything, you must understand the request.
1.  **Analyze the Request:** What is vague? What is missing?
2.  **Ask the User:**
    *   **Jira Ticket ID:** "What is the Jira Ticket ID (e.g. SCRUM-20)? **Why:** I need this to link commits to the task."
    *   Formulate specific questions.
    *   **Explain WHY:** For every question, state clearly *why* this information is needed.
    *   *Example:* "Please provide the file path for the component. **Why:** I need to ensure I am modifying the correct version of the file."
3.  **Wait for Answer:** Do not proceed until you have the critical context.

## 2. Research & Context
1.  Identify relevant files.
2.  Use `view_file` to understand the current state.
3.  Check `docs/ARCHITECTURE.md` or `docs/TECH_STACK.md` if the request involves structural changes.

## 3. Develop Work Plan
Create a step-by-step plan for the user.
1.  **Breakdown:** Split the task into granular steps.
2.  **Skill Mapping:** Explicitly state which SKILL should be used for each step.
    *   *Example:* "Step 2: Create the backend API. **Skill to use:** `implement_feature`."
    *   *Example:* "Step 4: Update documentation. **Skill to use:** `validate_doc_update`."
3.  **Output:** Present this plan to the user for approval.

## 4. Execution
Once the plan is approved, switch to the appropriate SKILL and follow its specific protocol.
