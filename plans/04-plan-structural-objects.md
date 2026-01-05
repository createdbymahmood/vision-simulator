# Phase 4: Structural Objects (Walls & Shapes)

**Timeline Reference**: Part of Phase 1 from Section 8 (Week 3)

---

## Phase Goal

Implement the complete drawing system for structural objects: Walls and Shapes (Rectangle, Circle, Triangle, Line). These objects must be placed within areas and serve as obstacles for simulation. This phase includes all visual feedback, measurement tooltips, enhanced cursors, and constraint validation.

---

## How Codex Should Use This Phase

- Gate all tools on existing areas; every wall/shape must validate against area boundaries during create/resize/drag.
- Match visuals to spec: solid wall previews with thickness, dashed shape previews, specified colors/dashes, and enhanced cursors.
- Build snapping (angle/grid) as toggles; show explicit snapped feedback in tooltips.
- Surface invalid states clearly (red previews, not-allowed cursor, tooltip message) instead of silently clamping.
- Keep measurement tooltips and additional distance/angle guides accurate; they are acceptance tests.
- Shape popover UX is required—do not skip the 2×2 selector or keyboard shortcuts.

---

## Scope & Responsibilities

### Included

- Wall drawing tool with polyline support
- Shape drawing tools (Rectangle, Circle, Triangle, Line)
- All visual feedback during drawing
- Measurement tooltips for walls and shapes
- Enhanced cursor states
- Angle snapping and grid snapping
- Area boundary constraint validation
- Shape popover UI

### Explicitly Excluded

- Camera and person placement
- 3D rendering of objects
- Simulation/collision logic

---

## Deliverables

### Draw Wall Tool (Section 5.10.2)

- [ ] **Workflow**:
  - Click first point: Wall start (8px red dot appears)
  - Mouse move: Preview line extends (solid red, actual thickness)
  - Click additional points: Continue polyline
  - Double-click: End wall drawing

- [ ] **Visual Design - Current Segment Preview**:
  - Solid line (not dashed)
  - Color: `#E63946` (red)
  - Width: Matches wall thickness property (default 0.2m)
  - Opacity: 0.6
  - End cap: round

- [ ] **Completed Segments**:
  - Full opacity (1.0)
  - Slightly darker shade
  - Vertices: 6px circles at junctions

- [ ] **Measurement Tooltip** (Section 5.7.3):
  - Content: `"12.8 m • 45°"` (length • angle)
  - Multi-segment: `"12.8 m • Total: 38.4 m"`

- [ ] **Enhanced Cursor** (Section 5.8.2):
  - Crosshair: thin cross
  - Circular dot: 8px diameter, filled with `#E63946` (red)
  - Harder shadow: `0 2px 6px rgba(0,0,0,0.5)`

- [ ] **Angle Snapping** (optional, toggle):
  - Snap to: 0°, 45°, 90°, 135°, 180°, etc.
  - Snap threshold: 5° proximity
  - Visual: Faint guide line at snap angle
  - Tooltip: `"12.8 m • 45° (snapped)"`

- [ ] **Grid Snapping** (if enabled):
  - Vertices snap to nearest grid intersection
  - Snap distance: 0.5m
  - Visual: Small magnet icon near cursor

- [ ] **Constraints**:
  - Entire wall must be inside area
  - **If wall would exit area**:
    - Preview line turns red at boundary
    - Line clipped at boundary (dashed red beyond)
    - Tooltip: `"Cannot extend outside area • 9.2 m (max)"`
    - Click beyond boundary ignored (error sound)

- [ ] **Self-Intersection**:
  - Allowed (no blocking)
  - Intersection points highlighted with warning icon (yellow ⚠️)
  - Tooltip: "Wall intersects itself - may affect simulation"

- [ ] **Invalid Wall Extension Cursor** (Section 5.8.3):
  - Cursor becomes `not-allowed` near boundary edge
  - Preview line turns red beyond valid region
  - Tooltip: "Wall cannot extend outside area"

### Draw Shapes Tool (Section 5.10.3)

- [ ] **Popover on Click**:
  - Appears at cursor position
  - Glassmorphism card (240px × 180px)
  - 4 shape options in 2×2 grid:
    - Rectangle (keyboard: R)
    - Circle (keyboard: C)
    - Triangle (keyboard: T)
    - Line (keyboard: L)
  - Each cell: Icon 32px centered, label below (12px)
  - Hover: background highlight, scale 1.05

### Rectangle (Section 5.10.3)

- [ ] **Drawing** (click and drag):
  - First click: Sets top-left corner (6px square handle)
  - Drag: Ghost rectangle extends
    - Fill: light gray, opacity 0.3
    - Border: 2px primary color, dashed (8px dash, 4px gap)
  - Release: Rectangle created

- [ ] **Measurement Tooltip**: `"W: 5.2 m × H: 3.1 m • Area: 16.1 m²"`

- [ ] **Proportional mode** (hold Shift):
  - Constrains to square (W = H)
  - Tooltip: `"5.2 m × 5.2 m (square)"`

- [ ] **Center mode** (hold Alt):
  - First click sets center (not corner)
  - Rectangle expands from center

### Circle (Section 5.10.3)

- [ ] **Drawing**:
  - First click: Sets center (6px dot)
  - Drag: Ghost circle expands
    - Fill: light gray, opacity 0.3
    - Border: 2px primary, dashed
  - Release: Circle created

- [ ] **Measurement Tooltip**: `"Radius: 4.5 m • Diameter: 9.0 m • Area: 63.6 m²"`

### Triangle (Section 5.10.3)

- [ ] **Drawing (3-click mode)**:
  - Click 1: First vertex
  - Click 2: Second vertex (line preview)
  - Click 3: Third vertex (triangle closes)
  - Ghost triangle preview after 2nd click

- [ ] **Alternative (drag mode)**:
  - Click and drag creates equilateral triangle
  - Base = drag distance
  - Tooltip: `"Base: 6.0 m • Height: 5.2 m"`

### Line (Section 5.10.3)

- [ ] **Drawing**:
  - Click: Start point
  - Drag: Line extends
  - Dashed preview: 8px dash, 4px gap, 2px width
  - Release: Line created
  - Properties: Has thickness (default 0.1m)

- [ ] **Measurement Tooltip**: `"8.3 m • 30°"` (length • angle)
- [ ] **Angle snapping**: Same as wall tool

### Enhanced Cursor States - Shapes (Section 5.8.2)

- [ ] Crosshair with ghost preview of shape at 50% opacity
- [ ] Rectangle: cursor shows top-left corner of future rectangle
- [ ] Circle: cursor shows center with radius preview
- [ ] Triangle: cursor shows first vertex
- [ ] Line: cursor shows start point with 6px dot

### Constraints (All Shapes) (Section 5.10.3)

- [ ] Must be fully inside area
- [ ] If resize/drag would exit area:
  - Shape preview turns red
  - Boundary line highlights red
  - Operation clamped to area boundary

### Additional Measurement Displays (Section 5.7.4)

- [ ] **Angle Guides** (walls):
  - Faint guide lines at 0°, 45°, 90°, etc.
  - Snap within 5° threshold
  - Tooltip updates: `"12.8 m • 45° (snapped)"`

- [ ] **Distance Markers** (optional, toggled):
  - Along lines >20m, show intermediate markers
  - Small tick marks every 5m with label

- [ ] **Object-to-Object Distance**:
  - When dragging object near another:
    - Faint line connects edges
    - Tooltip: `"Distance: 2.3 m"`

---

## Dependencies

- Phase 1: Foundation & Data Models (Wall/Shape entity schemas)
- Phase 2: Editor Layout & UI Framework (Tool buttons, popover infrastructure)
- Phase 3: Area System (Areas must exist for placement validation)

---

## Acceptance Criteria

### From Section 9 (QA)

- [ ] Wall drawing shows length and angle in tooltip
- [ ] Shape drawing shows dimensions (W×H, radius, etc.)
- [ ] Wall drawing cursor: crosshair + 8px red dot
- [ ] Wall preview lines are solid with actual thickness
- [ ] Shape previews show dashed borders
- [ ] Invalid placement cursor: not-allowed + red tint

### Additional Criteria

- [ ] Wall tool creates polyline with multiple segments
- [ ] Double-click ends wall drawing
- [ ] Angle snapping works at 45° increments
- [ ] Grid snapping works when enabled
- [ ] Shape popover shows 4 options in 2×2 grid
- [ ] All shapes constrained to area boundaries
- [ ] Rectangle Shift constraint creates square
- [ ] Rectangle Alt constraint expands from center
- [ ] Triangle supports both 3-click and drag modes
- [ ] Wall self-intersection shows warning icon
- [ ] Boundary exit attempts show red preview and error

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Complex polyline rendering performance | Use canvas path optimization; batch draws |
| Angle snapping interferes with precision drawing | Make snapping toggleable; show clear indicator |
| Shape bounds calculation errors | Comprehensive unit tests for geometry utilities |

---

## Mapping to PRD Sections

- Section 5.7.3: Measurement Tooltips by Tool (Wall, Shapes)
- Section 5.7.4: Additional Measurement Displays
- Section 5.8.2: Drawing Cursors (Wall, Shape)
- Section 5.8.3: Invalid/Error Cursors
- Section 5.10.2: Draw Wall Tool (Enhanced)
- Section 5.10.3: Draw Shapes Tool (Enhanced)
