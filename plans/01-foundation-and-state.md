# 01 — Foundation & State Management

## Goal

Establish the core architecture, shared data model, and state management foundation that all other features will build upon.

---

## Deliverables

### 1.1 Shared Scene Data Model

Define the canonical scene schema that both Canvas and Map editors will use:

- **Scene Root**: version, mode (canvas|map), units (meters), background, areas, walls, shapes, cameras, people, meta
- **Wall Entity**: id, type, coordinates (x1,y1,x2,y2), height, thickness, color, opacity
- **Shape Entity**: id, type (rectangle|circle|triangle|line), x, y, rotation, width, length, height, color, opacity, lineThickness
- **Camera Entity**: id, typePreset, x, y, height, direction, fov, depth, zoom, resolution, nearPlane
- **Person Entity**: id, x, y, radius, height, speed, behavior, trailEnabled
- **Area Entity** (Map only): id, name, geometry, pointCount

### 1.2 State Management Setup

- Use **Zustand** for global state management
- Create scene store with actions for CRUD operations on all entity types
- Implement selection state (selectedObjectId, selectionMode toggle)
- Implement active tool state
- Setup local storage persistence adapter for autosave

### 1.3 Base Layout Shell

- Create the fixed layout structure: top panel, main content area, bottom nav, right sidebar slot
- Layout must use **100vh height, 100% width**
- Bottom nav and top nav are fixed and always visible
- Right sidebar is contextual (appears/disappears based on selection)

### 1.4 UI Overlay Closing Behavior

Implement the global click-outside behavior:

- Clicking blank space closes: properties panels, popovers, CMDK dialogs, area management popovers
- Switching tools closes overlays
- ESC key closes overlays

---

## Suggested Tools

- **Zustand** for state management
- **shadcn/ui** for base UI components (already in project)
- **cmdk** for command palette dialogs

---

## Acceptance Criteria

- [ ] Scene data model defined and integrated with Zustand store
- [ ] Selection state and active tool state working
- [ ] Base layout renders with all fixed regions
- [ ] Overlay closing behavior works globally
- [ ] Local storage autosave functional

