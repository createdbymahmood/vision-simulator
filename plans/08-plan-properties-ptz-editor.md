# Phase 8: Properties Panels & PTZ Controls (Editor)

**Timeline Reference**: Parts of Phase 1 and Phase 2 from Section 8 (Weeks 3-5)

---

## Phase Goal

Implement the complete Properties Panel system for all entity types and the PTZ (Pan-Tilt-Zoom) controls for cameras in the editor. This enables users to view and modify all object properties with instant apply and provides camera angle adjustment capabilities.

---

## How Codex Should Use This Phase

- Build the properties shell once and reuse per-entity forms; every field should live-update the entity with debounced history commits.
- PTZ controls here are the canonical implementation—later 3D PTZ reuses this logic/UI.
- Keep slide-in/out, close behaviors, and blur styling exactly; they are part of the UX contract.
- Use the schema fields listed; avoid inventing new names or omitting read-only computed values.
- Keyboard shortcuts (arrow keys, +/- , 0) must be scoped to selected camera only.
- Color picker and PTZ changes must immediately update editor visuals (FOV wedge, icon).

---

## Scope & Responsibilities

### Included

- Properties Panel shell and behavior
- Per-entity-type property forms (Area, Wall, Shape, Camera, Person)
- PTZ controls in editor properties panel
- PTZ presets management
- Real-time property updates
- History integration (debounced commits)
- Camera color picker

### Explicitly Excluded

- PTZ controls in 3D simulation (Phase 10)
- 3D visualization of PTZ changes (Phase 9)

---

## Deliverables

### Properties Panel Shell (Section 5.1.5)

- [ ] **Appearance**:
  - Slides in from right: 300ms ease-out
  - Width: 360px
  - Backdrop blur + semi-transparent background
  - Closes: ESC, outside click, tool switch

- [ ] **Header** (56px height):
  - Object type icon + name
  - Object ID (smaller, muted)
  - Close button (X)

- [ ] **Content**:
  - Scrollable
  - Organized sections with dividers
  - All inputs update instantly (no save button)
  - History commits debounced (300ms)

### Area Properties Panel

- [ ] **Fields**:
  - Name (text input)
  - Point Count (read-only)
  - Perimeter (read-only, calculated)
  - Area (read-only, calculated in m²)
  - Fill Color (color picker)
  - Fill Opacity (slider 0-1)
  - Border Color (color picker)
  - Border Width (slider)
  - Boundary Mode (dropdown: strict)

### Wall Properties Panel

- [ ] **Fields**:
  - Segment Count (read-only)
  - Total Length (read-only)
  - Thickness (slider/input, meters)
  - Height (slider/input, meters)
  - Color (color picker)

### Shape Properties Panel

- [ ] **Common Fields**:
  - Position X (meters)
  - Position Y (meters)
  - Rotation (circular slider + input, 0-360)
  - Height (meters)
  - Color (color picker)

- [ ] **Rectangle-specific**:
  - Width (meters)
  - Height/Depth (meters)

- [ ] **Circle-specific**:
  - Radius (meters)

- [ ] **Triangle-specific**:
  - Base (meters)
  - Triangle Height (meters)

- [ ] **Line-specific**:
  - Length (read-only)
  - Angle (read-only)
  - Thickness (meters)

### Camera Properties Panel

- [ ] **General Section**:
  - Name (text input)
  - Type Preset (read-only or dropdown)
  - Color (color picker with real-time preview)

- [ ] **Position Section**:
  - X position (meters)
  - Y position (meters)
  - Height (meters, default 2.5m)
  - Direction (circular slider, 0-360)

- [ ] **Optics Section**:
  - FOV (slider, degrees)
  - Depth (slider, meters)
  - Near Clipping (slider, meters)
  - Resolution (width × height)

- [ ] **PTZ Section** (see below for full details)

- [ ] **Advanced Section**:
  - Show Collisions (toggle)

### Person Properties Panel

- [ ] **Fields**:
  - Name (text input)
  - X position (meters)
  - Y position (meters)
  - Height (meters)
  - Speed (m/s)

### PTZ Controls in Editor (Section 5.5.2, 5.5.3)

#### PTZ UI Component Layout

```
┌─────────────────────────┐
│  Camera: cam-1          │ ← Header with camera name/color dot
├─────────────────────────┤
│         ▲               │
│      ◄  •  ►           │ ← D-pad for Pan/Tilt
│         ▼               │
│                         │
│  Pan:  [====•====] 90° │ ← Slider + value
│  Tilt: [===•=====] 15° │
│  Zoom: [==•======] 1.5x│
│                         │
│  [Reset] [Preset ▼]    │ ← Actions
└─────────────────────────┘
```

#### D-Pad Controls (90px × 90px)

- [ ] Center dot: camera color, 16px
- [ ] Arrows: 24px, clickable buttons
- [ ] **Up arrow**: Tilt up (+5° per click, hold for continuous)
- [ ] **Down arrow**: Tilt down (-5° per click)
- [ ] **Left arrow**: Pan left (-5° per click)
- [ ] **Right arrow**: Pan right (+5° per click)
- [ ] Hover: button highlights
- [ ] Active: button depresses slightly (2px translate)

#### Pan Slider

- [ ] Range: 0–360°
- [ ] Circular slider (optional) or linear
- [ ] Handle: camera color
- [ ] Label: "Pan: 90°"
- [ ] Live updates FOV wedge in editor

#### Tilt Slider

- [ ] Range: -45° to +90° (looking down to looking up)
- [ ] Default: 0° (horizontal)
- [ ] Constrained by camera type limits
- [ ] Label: "Tilt: 15°"

#### Zoom Slider

- [ ] Range: 1.0x to 10.0x (or camera-specific max)
- [ ] Logarithmic scale
- [ ] Affects FOV: `effectiveFOV = baseFOV / zoomFactor`
- [ ] Label: "Zoom: 1.5x"

#### Reset Button

- [ ] Returns to default: Pan 0°, Tilt 0°, Zoom 1x
- [ ] Animates smoothly (500ms ease-out)

#### Preset Dropdown

- [ ] Save current PTZ as preset (up to 5 per camera)
- [ ] Named presets: "Entrance", "Parking", "Main Hall"
- [ ] Quick apply presets
- [ ] Presets stored in camera entity

### PTZ Behavior in Editor (Section 5.5.3)

- [ ] **Real-time FOV update**: FOV wedge/cone redraws immediately on adjustment
- [ ] **Smooth transitions**: 200ms easing for slider, 100ms for button increments

- [ ] **Keyboard shortcuts** (when camera selected):
  - Arrow keys: Pan/Tilt (5° increments)
  - `+` / `-`: Zoom in/out
  - `0`: Reset PTZ

### Coordinate Display in Properties (Section 5.2)

- [ ] X and Y in meters (relative to scene origin)
  - Format: "X: 12.5 m", "Y: -3.2 m"
  - Precision: 0.1m
- [ ] Rotation degrees (0–360)
  - Format: "45°"
  - Visual: circular slider + number input

### History Integration

- [ ] All property changes create undo/redo entries
- [ ] Debounce: 300ms (batch rapid slider movements)
- [ ] Tooltip on undo button shows last action

---

## Dependencies

- Phase 1: Foundation & Data Models (All entity schemas, PTZ schema)
- Phase 2: Editor Layout & UI Framework (Properties panel shell)
- Phase 3-7: All entity types created (Areas, Walls, Shapes, Cameras, People)

---

## Acceptance Criteria

### From Section 9 (QA)

- [ ] PTZ controls adjust camera direction/tilt/zoom in real-time
- [ ] PTZ presets save and load correctly

### Additional Criteria

- [ ] Properties panel slides in from right on object selection
- [ ] Panel closes on ESC, outside click, or tool switch
- [ ] All inputs update entity instantly (no save button)
- [ ] Undo/redo captures property changes
- [ ] Camera color picker updates FOV wedge color in real-time
- [ ] D-pad buttons adjust pan/tilt with visual feedback
- [ ] Slider handles show camera color
- [ ] Reset button animates PTZ back to defaults
- [ ] Presets can be saved, named, and applied
- [ ] Arrow keys work for PTZ when camera selected
- [ ] FOV wedge updates live during PTZ adjustment
- [ ] Coordinate display shows meters format correctly

---

## Risks & Mitigations

| Risk                                      | Mitigation                                           |
| ----------------------------------------- | ---------------------------------------------------- |
| History stack overflow from rapid updates | Debounce at 300ms; merge similar consecutive changes |
| Circular slider interaction complexity    | Provide linear slider alternative; test thoroughly   |
| Preset management UX confusion            | Clear UI for save/apply/delete presets               |

---

## Mapping to PRD Sections

- Section 5.1.5: Properties Panel (contextual, right slide-over)
- Section 5.2: Coordinate System & Units (display in properties)
- Section 5.5.2: PTZ UI Component (Always Available)
- Section 5.5.3: PTZ Behavior in Editor
- Section 5.5.5: PTZ Data Model (presets)

