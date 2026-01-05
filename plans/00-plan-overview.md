# Computer Vision Simulator - Build Plan Overview

**Source of Truth**: `plan.md` (Updated PRD — Computer Vision Simulator Application)

---

## Executive Summary

This document provides a comprehensive 12-phase build plan derived from `plan.md`. The plan covers the complete implementation of an interactive simulation tool that allows users to design environments, place cameras and people, and run live simulations with real-time camera visibility and POV feeds.

---

## How Codex Should Use This File

- Treat each phase file as the authoritative build brief for that slice of work; use this overview only to navigate and order the phases.
- Follow dependencies in the graph; do not start a phase until its prerequisites are finished.
- Keep PRD mappings visible while coding so no requirement is skipped; optional items are explicitly labeled.
- Use the acceptance criteria in each phase as the test checklist before moving on.
- When unsure, prefer the constraints and non-goals listed here over improvisation (e.g., no routing, areas are mandatory, 20-color camera palette).

---

## Phase Summary

| Phase | Name | Timeline | PRD Section Coverage |
|-------|------|----------|---------------------|
| 1 | Foundation & Data Models | Week 0-1 | Section 7, 4.1 (View Modes), 5.2, 5.3.1 |
| 2 | Editor Layout & UI Framework | Week 1-2 | Section 3.1, 4.2, 5.1 |
| 3 | Area System | Week 2-3 | Section 5.9, 5.7, 5.8.2 |
| 4 | Structural Objects (Walls & Shapes) | Week 3 | Section 5.10.2, 5.10.3, 5.7.3 |
| 5 | Selection & Transform Tools | Week 3 | Section 5.10.1, 5.8.4 |
| 6 | Camera System & Colors | Week 4-5 | Section 5.3, 5.10.4 |
| 7 | People Placement | Week 3 | Section 5.10.5, 5.8.3 |
| 8 | Properties Panels & PTZ (Editor) | Week 3-5 | Section 5.1.5, 5.5.2, 5.5.3 |
| 9 | 3D Simulation Core | Week 6-7 | Section 6.1-6.5 |
| 10 | 3D Advanced Features | Week 7-9 | Section 5.4, 5.5.4, 6.6 |
| 11 | Radar & POV Feeds | Week 9-10 | Section 5.6, 6.7, 6.2.5 |
| 12 | Recording, Export & Polish | Week 11-12 | Section 6.8, 6.9, Section 9 |

---

## Phase Dependencies Graph

```
Phase 1: Foundation
    │
    ▼
Phase 2: Editor Layout
    │
    ├────────────────────────────────┐
    ▼                                ▼
Phase 3: Areas ──────────────► Phase 8: Properties/PTZ
    │                                │
    ├───────────────┐                │
    ▼               ▼                │
Phase 4: Walls   Phase 7: People     │
    │               │                │
    ▼               │                │
Phase 5: Selection ◄────────────────┘
    │
    ▼
Phase 6: Cameras
    │
    ├───────────────────────────────────┐
    ▼                                   ▼
Phase 9: 3D Core                    Phases 3-8 Complete
    │
    ▼
Phase 10: 3D Advanced
    │
    ▼
Phase 11: Radar/POV Feeds
    │
    ▼
Phase 12: Recording/Polish
```

---

## PRD Section to Phase Mapping

### Section 0-2: Overview, Personas, Scope
- Covered across all phases as guiding requirements
- Explicit non-goals respected throughout

### Section 3: Product Requirements (High-Level)
- **3.1 Consistency Rules** → Phase 2
- **3.2 Object Categories** → Phase 1 (data models)
- **3.3 Interaction Categories** → Phases 3-12

### Section 4: Information Architecture
- **4.1 View Modes (No Routing)** → Phase 1 (view state management)
- **4.2 Mode Switching** → Phase 2

### Section 5: Unified Editor PRD
- **5.1 Editor Layout** → Phase 2
- **5.2 Coordinate System** → Phase 1, 8
- **5.3 Camera Color System** → Phase 1, 6
- **5.4 3D FOV Collision** → Phase 10
- **5.5 PTZ Controls** → Phase 8, 10
- **5.6 Radar Feature** → Phase 11
- **5.7 Measurement Tooltips** → Phase 3, 4, 6, 7
- **5.8 Cursor States** → Phase 3, 4, 5, 6, 7, 12
- **5.9 Areas** → Phase 3
- **5.10 Object Creation Tools** → Phase 4, 5, 6, 7

### Section 6: Simulation Analysis
- **6.1 Page Header** → Phase 9
- **6.2 Layout Regions** → Phase 9, 10, 11
- **6.3 Map/Canvas Mode** → Phase 9
- **6.4 Area Dropdown** → Phase 9
- **6.5 3D Simulation Engine** → Phase 9
- **6.6 Physics & Movement** → Phase 10
- **6.7 Camera Vision** → Phase 11
- **6.8 Recording** → Phase 12
- **6.9 Snapshot Export** → Phase 12

### Section 7: Enhanced Data Model
- All entity schemas → Phase 1

### Section 8: Implementation Roadmap
- Original 5-phase roadmap expanded to 12 detailed phases

### Section 9: QA Acceptance Criteria
- Verification checklist → Phase 12

---

## Key Architecture Decisions (from PRD)

1. **No Routing**: Single-page application with view mode switching (Editor ↔ Preview)
   - View switching handled by state management
   - Live Preview button switches from Editor → Preview
   - Back/Close button in Preview switches back to Editor
   - No URL changes, no browser history
2. **Unified Editor**: Map Mode is primary; Canvas Mode is Map Mode with tiles hidden
3. **Areas Mandatory**: All objects must be placed inside defined areas
4. **Camera Colors**: 20-color palette with auto-assignment
5. **PTZ Everywhere**: Controls available in both editor and simulation
6. **Deterministic Simulation**: Seeded RNG for reproducible results
7. **Web-First**: Desktop-first web application using Three.js for 3D

---

## Explicit Non-Goals (from Section 2.2)

The following are explicitly OUT OF SCOPE:

- ❌ Multiplayer collaboration
- ❌ Photorealistic rendering
- ❌ ML inference (no actual CV models)
- ❌ Account system / backend
- ❌ True "canvas-only" mode with infinite boundaries
- ❌ Physical PTZ motor simulation (speed limits, acceleration)

---

## Open Questions / Assumptions

These items were ambiguous or marked as optional in `plan.md`:

1. **Bundle Export**: Listed as "future" - not implemented in MVP
2. **Processors in Device Picker**: "Placeholders" - implementation deferred
3. **Annotation Mode on Snapshot**: "Optional" - may be deferred
4. **Recording Quality Presets**: "Optional" - may be deferred
5. **Ping Sound Effect**: "Optional, can be disabled" - may be deferred
6. **Timestamp Overlay in Recording**: "Optional" - may be deferred
7. **Camera Info Overlay in Recording**: "Optional" - may be deferred
8. **Person Trails Toggle in Radar**: Listed but details sparse
9. **Bezier Curve Sampling**: 1000 points specified - verify sufficiency
10. **Spatial Hash Grid Size**: 10m × 10m specified - verify performance

---

## File Structure

```
plans/
├── 00-plan-overview.md          (this file)
├── 01-plan-foundation-data-models.md
├── 02-plan-editor-layout-ui-framework.md
├── 03-plan-area-system.md
├── 04-plan-structural-objects.md
├── 05-plan-selection-transform.md
├── 06-plan-camera-system.md
├── 07-plan-people-placement.md
├── 08-plan-properties-ptz-editor.md
├── 09-plan-3d-simulation-core.md
├── 10-plan-3d-advanced-features.md
├── 11-plan-radar-pov-feeds.md
└── 12-plan-recording-export-polish.md
```

---

## How to Use This Plan

1. **Start with Phase 1** - All subsequent phases depend on it
2. **Follow dependencies** - Consult the dependency graph above
3. **Check acceptance criteria** - Each phase has explicit verification steps
4. **Reference PRD sections** - Each deliverable maps to specific PRD sections
5. **Track completion** - Use checklist format in each phase file

---

## Total Deliverables Count

| Category | Count |
|----------|-------|
| Data Models/Schemas | 6 |
| UI Components | 25+ |
| Tools | 8 |
| Animations/Micro-interactions | 25+ |
| 3D Rendering Components | 10+ |
| Export Features | 3 |
| Total Acceptance Criteria | 150+ |

---

*Generated from plan.md - Computer Vision Simulator PRD v1.1*
