# Phase 3: Area System (Mandatory Foundation)

**Timeline Reference**: Part of Phase 1 from Section 8 (Weeks 2-3)

---

## Phase Goal

Implement the complete Area creation system, which is the mandatory foundation for all other objects. Areas define spatial boundaries where all objects must be placed. This phase includes both Point Mode and Pen Mode drawing, all visual feedback, measurement tooltips, first-time user experience, and area constraints.

---

## How Codex Should Use This Phase

- Enforce the global rule: nothing else can be placed without at least one area; keep wall/shape/camera/person tools disabled until then.
- Build both Point and Pen modes with the exact visuals, cursors, and measurements; sampling (1000 points) is required, not optional.
- Validation is strict: areas must close, min 3 vertices, and all later objects must remain inside area bounds.
- Deliver the first-time experience (prompt + tutorial) so later phases inherit correct gating states.
- Keep measurement tooltips, cursor states, and overlap visuals identical to the specs; treat toasts/animations as acceptance criteria.
- Add the area management panel and active-area highlighting so downstream tools can target the active area.

---

## Scope & Responsibilities

### Included

- Area drawing in Point Mode (click-to-add vertices)
- Area drawing in Pen Mode (Bezier curves)
- Area entity management (create, select, edit, delete)
- All visual feedback during drawing
- Measurement tooltips for area drawing
- Enhanced cursor states for area drawing
- Area constraints and validation
- First-Time User Experience (empty scene prompt, tutorial)
- Multi-area overlap handling
- Area Management slide-over panel

### Explicitly Excluded

- Wall, shape, camera, person placement (require areas first)
- 3D rendering of areas
- Simulation features

---

## Deliverables

### Area Entity Implementation (Section 5.9.1)

- [ ] **Entity Fields**:
  - `id`, `name` (auto: area-1, area-2...)
  - `geometry: { type: "polygon", coordinates, bezierControls }`
  - `pointCount`
  - `style: { fillColor/opacity, borderColor/width }`
  - `boundaryMode: "strict"`
  - `color` (unique from palette for multi-area distinction)

### Point Mode Drawing (Section 5.9.2)

- [ ] **Visual Design**:
  - First click: Pulsing dot (10px, primary color)
  - Subsequent clicks: Add vertex with animated connection
  - **Line preview** (last vertex to cursor):
    - Dashed line: `8px dash, 4px gap`
    - Color: primary blue `#4ECDC4`
    - Width: 2px
    - Opacity: 0.8
    - Animated dashes: flow toward cursor (2s loop)
  - **Vertices**:
    - Circles (8px diameter)
    - Filled with white
    - Border: 2px primary color
    - Drop shadow: `0 2px 4px rgba(0,0,0,0.2)`
    - Hover: expands to 10px (scale animation)

- [ ] **Closing indication**:
  - Near first vertex (within 10px):
    - First vertex pulses faster and grows (12px)
    - Dashed line from last vertex to first appears
    - Cursor becomes pointer (hand)
    - Tooltip: "Click to close polygon • Total: 84.2 m"

- [ ] **Keyboard controls**:
  - `ESC`: Cancel area drawing
  - `Enter`: Auto-close polygon
  - `Backspace`: Remove last vertex
  - `Double-click`: Close polygon

### Pen Mode Drawing (Section 5.9.2)

- [ ] **Visual Design**:
  - Click creates anchor point (10px square, rotated 45° → diamond)
  - **Drag from anchor**:
    - Creates control handles (two tangent handles)
    - Handles: 6px circles connected with thin lines
    - Handle lines: 1px, dashed
    - Live curve shape preview
  - **Curve preview**:
    - Smooth Bezier rendered in real-time
    - Same color/style as Point mode
    - Higher quality (subpixel rendering)

- [ ] **Keyboard modifiers**:
  - Hold `Shift`: Constrain handle angles to 45° increments
  - Hold `Alt`: Create sharp corner (no curve)

- [ ] **Conversion**:
  - Bezier curves sampled into polyline (1000 points per curve)

### Measurement Tooltips - Area (Section 5.7.3)

- [ ] **Tooltip Appearance** (Section 5.7.2):
  - Background: `rgba(0, 0, 0, 0.85)` with backdrop blur
  - Text: white, 13px, bold font
  - Padding: 6px 10px
  - Border-radius: 6px
  - Box-shadow: `0 2px 8px rgba(0, 0, 0, 0.3)`
  - Pointer: small triangle pointing to measurement line

- [ ] **Position**:
  - Follows cursor at offset (12px right, 12px down)
  - OR snaps to midpoint of line being drawn
  - Always within viewport bounds

- [ ] **Content**:
  - Current segment: `"15.3 m"`
  - After 3+ vertices: `"15.3 m • Total: 42.7 m"`
  - Near close: `"Click to close | Total: 84.2 m"`
  - Pen mode: `"Curve length: ~18.4 m"`

- [ ] **Animation**:
  - Fade in: 100ms
  - Updates: instant
  - Fade out: 200ms when drawing completes

- [ ] **Perimeter Display**:
  - After closing: toast `"Area created • Perimeter: 84.2 m • Area: 245.8 m²"`

### Enhanced Cursor States - Area (Section 5.8.2)

- [ ] **Area Drawing Cursor**:
  - Crosshair: thin cross (12px arms)
  - Circular dot at center: 12px diameter
  - Filled with `#4ECDC4`, opacity 0.8
  - Drop shadow: `0 2px 4px rgba(0,0,0,0.3)`
  - Dot pulses subtly (scale 1.0 to 1.1, 1s cycle)

### Area Constraints (Section 5.9.3)

- [ ] Areas must be closed polygons
- [ ] Minimum vertices: 3
- [ ] **Universal placement rule**: ALL objects must be fully inside an area

### First-Time User Experience (Section 5.9.4)

- [ ] **Empty Scene Prompt**:
  - Center of viewport
  - Large card with:
    - 🗺️ emoji + "Create an Area to Begin"
    - "Areas define boundaries where objects can be placed"
    - [Create Area] button (primary style, grows on hover)
  - Semi-transparent card with backdrop blur
  - Clicking button activates Area tool

- [ ] **Tutorial Mode** (first time only, dismissible):
  - Step-by-step overlay:
    1. "Click to add area vertices"
    2. "Continue clicking to extend"
    3. "Double-click or press Enter to close"
    4. "Great! Now you can add objects inside this area"
  - Progress indicator: "Step 1 of 3"
  - "Don't show again" checkbox

- [ ] **After First Area**:
  - Subtle confetti animation (3 particles, quick)
  - Toast: "✓ Area created! You can now place objects inside."
  - Other tool buttons animate (brief glow) to indicate enabled

### Multi-Area Overlap (Section 5.9.3)

- [ ] Overlapping region shows crosshatch pattern (faint)
- [ ] Placement uses "active area" (last created or explicitly selected)
- [ ] Active area highlighted with thicker border (4px vs 2px)

### Area Management Panel

- [ ] **Trigger**: Click "Area Management" button in right sidebar
- [ ] **Slide-over panel from right**
- [ ] **List of areas**:
  - Area name (editable)
  - Point count
  - Color indicator
  - Delete button
  - Click to select/focus

### Grid Overlay (Canvas Mode) (Section 5.1.2)

- [ ] 1m × 1m squares
- [ ] Line color: `rgba(0, 0, 0, 0.1)`
- [ ] Major grid every 10m: `rgba(0, 0, 0, 0.25)`, 2px width
- [ ] Grid labels every 10m showing coordinates

---

## Dependencies

- Phase 1: Foundation & Data Models (Area entity schema, state management)
- Phase 2: Editor Layout & UI Framework (Bottom nav, tooling infrastructure)

---

## Acceptance Criteria

### From Section 9 (QA)

- [ ] Area polygon lines are dashed (8px dash, 4px gap)
- [ ] Area drawing cursor: crosshair + 12px blue dot
- [ ] All dashed lines have smooth animations

### Additional Criteria

- [ ] Point Mode allows clicking to add vertices with visual feedback
- [ ] Pen Mode allows creating Bezier curves with control handles
- [ ] Closing polygon triggers perimeter/area toast
- [ ] ESC cancels drawing, Enter closes polygon, Backspace removes vertex
- [ ] Empty scene shows "Create an Area to Begin" prompt
- [ ] First area creation shows confetti and success toast
- [ ] Tutorial mode shows for first-time users with "Don't show again" option
- [ ] Other tools remain disabled until at least one area exists
- [ ] Area Management panel lists all areas with correct counts
- [ ] Multi-area scenes show crosshatch at overlaps
- [ ] Measurement tooltips show correct distances during drawing

---

## Risks & Mitigations

| Risk                              | Mitigation                                 |
| --------------------------------- | ------------------------------------------ |
| Bezier curve sampling too slow    | Optimize sampling algorithm; cache results |
| Complex polygon self-intersection | Allow self-intersection but warn user      |
| Tutorial annoys returning users   | Store "don't show again" in localStorage   |

---

## Mapping to PRD Sections

- Section 5.1.2: Grid Overlay (Canvas Mode)
- Section 5.7: Real-Time Measurement Tooltips
- Section 5.8.2: Drawing Cursors (Area)
- Section 5.9: Areas — Mandatory Foundation (entire section)

