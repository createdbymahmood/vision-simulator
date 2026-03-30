# Phase 30: Documentation System Plan (How to Write the Docs)

**Timeline Reference**: Post-Phase 29 follow-up

---

## Phase Goal

Define a complete, repeatable plan for producing production-grade documentation for this project. The plan must explicitly cover how to analyze all project scopes, inventory every feature/workflow/capability, and generate a modular docs system under `docs/` with full, step-by-step usage guidance.

---

## How Codex Should Use This Phase

- Treat this plan as the authoritative process for documentation work. The output of this phase is a plan file only (no docs yet).
- The documentation effort must be comprehensive: **every feature and workflow described in `plan.md` and all files under `plans/` must be accounted for**.
- Use a strict coverage approach: inventory first, write second. No feature should be documented without being in the inventory.
- Keep documentation modular and navigable; avoid monoliths.
- Ensure developer- and user-facing sections are clearly separated.

---

## Scope & Responsibilities

### Included

- Documentation process definition (how to analyze and write)
- Feature and workflow inventory process
- Documentation structure and file hierarchy plan
- Standards for clarity, tone, and completeness
- Validation and completeness checklist

### Explicitly Excluded

- Writing the documentation itself
- Code changes outside documentation planning
- UI or feature implementation work

---

## Deliverables

### 1) Source Analysis Plan

- [ ] **Primary Sources**:
  - `plan.md`
  - All files under `plans/`
- [ ] **Secondary Sources** (optional but recommended for accuracy):
  - `README.md`, `backlog.md`
  - `src/` for actual UI/feature implementation details
  - `package.json` / `scripts/` for setup and run commands
- [ ] **Analysis Output**:
  - A complete feature/workflow/capability inventory list
  - A mapping table that links features → source file(s)

### 2) Feature & Workflow Inventory Method

- [ ] **Feature extraction rules**:
  - Treat every "Deliverable", "Requirement", and "Acceptance" item as a feature candidate.
  - Include UX behaviors, constraints, toggles, visual states, and validation rules as features.
  - Record optional features separately (still documented).
- [ ] **Workflow extraction rules**:
  - For each feature, identify user-triggered actions and end-to-end flows:
    - Setup → creation → editing → simulation → export
  - Include minor actions (undo/redo, map style changes, toggles, tool popovers).
- [ ] **Inventory output format**:
  - Feature name
  - Description
  - Access/entry point (UI or shortcut)
  - Step-by-step usage
  - Dependencies/constraints
  - Source file references

### 3) Documentation Architecture Plan

- [ ] **Docs root**: `docs/`
- [ ] **Top-level structure** (example categories):
  - `docs/README.md` (home + TOC)
  - `docs/setup/` (install, dev, build)
  - `docs/overview/` (concepts, architecture, modes)
  - `docs/features/` (editor tools, objects, panels)
  - `docs/workflows/` (end-to-end guides)
  - `docs/simulation/` (3D, radar, feeds, PTZ)
  - `docs/export/` (recording, snapshots, JSON)
  - `docs/configuration/` (map styles, tokens, module props)
  - `docs/advanced/` (history, validation, edge cases)
  - `docs/api/` (scene JSON schema)
- [ ] **Navigation rules**:
  - Always include a Table of Contents
  - Cross-link between related features and workflows
  - No orphan pages

### 4) Writing Standards

- [ ] **Tone**: Professional, developer-friendly, concise, and precise.
- [ ] **Clarity requirements**:
  - Step-by-step instructions for every feature
  - Explicit UI entry points and keyboard shortcuts
  - Default values and constraints stated clearly
- [ ] **Examples**:
  - Use concrete examples for configuration and exports
  - Include pseudo-JSON for schema explanations
- [ ] **Completeness**:
  - Every feature from inventory must appear in the docs
  - Optional features must be labeled as optional

### 5) Validation & Coverage Checklist

- [ ] **Coverage parity**:
  - All `plan.md` and `plans/*` features appear in docs
  - Each feature is linked to its usage steps
- [ ] **Workflow coverage**:
  - Setup → editor → simulation → export path documented
  - Minor actions (undo/redo, map styles, toggles) documented
- [ ] **Navigation validation**:
  - TOC links resolve
  - Cross-links between related pages are present
- [ ] **Gap review**:
  - Any missing info is logged with a TODO list

---

## Acceptance Checklist

- [ ] A complete documentation plan exists under `plans/` describing how to write the docs.
- [ ] The plan explicitly requires analyzing `plan.md` and all `plans/*` files.
- [ ] The plan defines feature/workflow inventory rules and output format.
- [ ] The plan defines a modular `docs/` structure with a TOC.
- [ ] The plan includes writing standards and a coverage validation checklist.
- [ ] The plan does **not** include actual documentation content.

---

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Missing a feature in docs | Inventory-first process; mapping table to sources |
| Docs become monolithic | Enforce modular structure and TOC |
| Inconsistent tone | Apply fixed writing standards and review pass |
| Ambiguity in features | Record assumptions and mark TODOs for verification |

---

## Mapping to PRD / Plans

- Applies to **all** requirements described in `plan.md` and all files under `plans/`.

