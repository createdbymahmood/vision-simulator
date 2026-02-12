# Phase 1: Foundation & Data Models

**Timeline Reference**: Foundational work preceding Phase 1 from Section 8 (Week 0-1)

---

## Phase Goal

Establish the foundational architecture, data models, routing structure, and state management infrastructure that all subsequent phases will build upon. This phase ensures all entity schemas, persistence mechanisms, and core application structure are in place before UI implementation begins.

---

## How Codex Should Use This Phase

- Implement all TypeScript schemas and utilities first; they are the contracts every later phase consumes.
- Wire scene/UI stores before UI; verify view switching with unit tests or a lightweight harness.
- Respect the no-routing rule: view switching is state only (no React Router/history changes).
- Enforce meters everywhere and auto IDs/color palette via helpers so later phases cannot bypass rules.
- Deliver persistence ports/adapters early so other phases can save/load scenes without refactors.
- If any field is unclear, defer to Section 7 schema names rather than inventing new ones.

---

## Scope & Responsibilities

### Included

- Project structure and architecture setup
- All entity data models per Section 7 (Enhanced Data Model)
- Scene root schema implementation
- Routing configuration (`/editor`, `/editor/preview`)
- State management setup (Zustand stores)
- Scene persistence port and adapters
- Coordinate system utilities (meters-based)
- ID generation utilities (auto-naming: area-1, camera-1, person-1, etc.)
- Color palette constants for cameras (20 colors from Section 5.3.1)

### Explicitly Excluded

- UI component implementation
- Drawing/placement logic
- 3D rendering
- Simulation logic
- Recording/export functionality

---

## Deliverables

### Data Models (Section 7)

- [ ] **Scene Root Schema** (Section 7.1)
  - `version: "1.1"`
  - `editorMode: "map" | "canvas"`
  - `mapVisible: boolean`
  - `units: "meters"`
  - `origin: { lat, lng, description }`
  - `simulationSeed: number`
  - `areas: Area[]`
  - `walls: Wall[]`
  - `shapes: Shape[]`
  - `cameras: Camera[]`
  - `people: Person[]`
  - `meta: { createdAt, updatedAt, mapStyle, radarEnabled, collisionVisualizationEnabled }`

- [ ] **Area Entity** (Section 7.2)
  - `id`, `type: "area"`, `name`
  - `geometry: { type: "polygon", coordinates, bezierControls }`
  - `pointCount`
  - `color` (unique from palette)
  - `style: { fillColor, fillOpacity, borderColor, borderWidth }`

- [ ] **Camera Entity** (Section 7.2 + Section 5.5.5)
  - `id`, `type: "camera"`, `areaId`, `sourceDeviceId`, `sourceDeviceName`
  - `x`, `y`, `height`, `direction`, `fovHorizontal`, `fovVertical`, `depth`, `zoom`
  - `resolution: { width, height }`
  - `sourceDeviceFeatures: Array<{ field, label, path, unit, value }>`
  - `color` (from 20-color palette)
  - `ptz: { pan, tilt, zoom, limits: { panMin, panMax, tiltMin, tiltMax, zoomMin, zoomMax } }`

- [ ] **Person Entity** (Section 7.2)
  - `id`, `type: "person"`, `areaId`
  - `name`, `x`, `y`, `height`, `speed`

- [ ] **Wall Entity**
  - `id`, `type: "wall"`, `areaId`
  - `points: Array<{x, y}>`
  - `thickness`, `height`
  - `color`

- [ ] **Shape Entity**
  - `id`, `type: "shape"`, `areaId`
  - `shapeType: "rectangle" | "circle" | "triangle" | "line"`
  - Shape-specific geometry fields
  - `height`, `color`

### Infrastructure

- [ ] **View Mode Management** (Section 4.1)
  - **No routing library** - single-page application
  - View state: `'editor' | 'preview'` (managed in state store)
  - View switching logic (Editor ↔ Preview) without URL changes
  - No React Router, no browser history manipulation

- [ ] **State Management**
- Scene store (entities, mode, selections)
- UI state store (active tool, popovers, panels, **current view mode**)

- [ ] **Persistence Layer** (Section 7)
  - Scene persistence port interface
  - Local storage adapter implementation
  - JSON export/import utilities

- [ ] **Utility Functions**
  - ID generation (auto-increment naming)
  - Coordinate conversion (lat/lng ↔ meters)
  - Color palette cycling (Section 5.3.1 - 20 colors + hue shift for >20)

- [ ] **Camera Color Palette** (Section 5.3.1)
  - All 20 predefined colors:
    1. `#FF6B6B` - Red
    2. `#4ECDC4` - Teal
    3. `#45B7D1` - Blue
    4. `#FFA07A` - Light Salmon
    5. `#98D8C8` - Mint
    6. `#F7DC6F` - Yellow
    7. `#BB8FCE` - Purple
    8. `#85C1E2` - Sky Blue
    9. `#F8B739` - Orange
    10. `#52B788` - Green
    11. `#E63946` - Crimson
    12. `#A8DADC` - Powder Blue
    13. `#F77F00` - Dark Orange
    14. `#06FFA5` - Bright Mint
    15. `#9D4EDD` - Violet
    16. `#FF006E` - Pink
    17. `#8338EC` - Purple Blue
    18. `#00B4D8` - Cyan
    19. `#90E0EF` - Light Blue
    20. `#FFB703` - Amber
  - Hue shift logic (+15°) for >20 cameras

---

## Dependencies

- None (this is the foundational phase)

---

## Acceptance Criteria

- [ ] All entity TypeScript interfaces/types match Section 7 schemas exactly
- [ ] Scene can be serialized to JSON and deserialized without data loss
- [ ] View mode switching works correctly between Editor and Preview views
- [ ] Camera color assignment correctly cycles through 20-color palette
- [ ] ID generation produces correct format (area-1, camera-1, person-1, etc.)
- [ ] Coordinate utilities correctly convert between geo-referenced and meters

---

## Risks & Mitigations

| Risk                                          | Mitigation                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| Data model changes required later             | Design schemas with extensibility in mind; version field allows migrations |
| State synchronization bugs                    | Comprehensive unit tests for all state mutations                           |

---

## Mapping to PRD Sections

- Section 3.2: Object Categories → Entity type definitions
- Section 4.1: View Modes → View mode state management (no routing)
- Section 5.2: Coordinate System & Units → Coordinate utilities
- Section 5.3.1: Camera Color Assignment → Color palette and cycling logic
- Section 5.5.5: PTZ Data Model → Camera PTZ schema
- Section 7: Enhanced Data Model → All entity schemas
