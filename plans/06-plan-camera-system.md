# Phase 6: Camera System & Colors

**Timeline Reference**: Phase 2 from Section 8 (Weeks 4-5)

---

## Phase Goal

Implement the complete Camera placement system including the Device Picker CMDK, camera color assignment from the 20-color palette, 2D FOV rendering in the editor, and camera entity management. This phase establishes cameras as first-class entities with unique visual identification.

---

## Scope & Responsibilities

### Included

- Device Picker CMDK dialog
- Camera placement tool
- Camera color auto-assignment and customization
- 2D FOV wedge/cone rendering in editor
- Camera visual design (icon, direction indicator, FOV)
- Camera placement validation (inside area)
- Camera cursor states
- Camera measurement tooltips
- Devices in Use panel

### Explicitly Excluded

- PTZ controls (Phase 7)
- 3D FOV frustum rendering (Phase 8-9)
- Camera POV feeds (Phase 11)
- Radar visualization (Phase 10)

---

## Deliverables

### Device Picker CMDK (Section 5.10.4)

- [ ] **Opens**: Click "Place Device" or keyboard `D`
- [ ] **Position**: Centered on screen
- [ ] **Dimensions**: Width 600px, height 400px
- [ ] **Search input**: Autofocus
- [ ] **Camera types list**:
  - Each item: Icon (32px) + Name + FOV/Depth specs
  - Hover: Background highlight, shows more details
  - Selected: Press Enter or click
- [ ] **Close behavior**: 200ms fade on selection or ESC

### Camera Color System (Section 5.3)

#### Color Assignment (Section 5.3.1)

- [ ] **Auto-Assignment**:
  - Each camera receives unique color from palette on creation
  - Next available color from 20-color palette
  - If >20 cameras: cycle with hue shift (+15°)
  - Color stored: `color: "#FF6B6B"`

- [ ] **Palette** (20 colors):
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

- [ ] **User Customization**:
  - Properties panel includes color picker
  - Real-time preview in editor

#### Visual Application in Editor (Section 5.3.2)

- [ ] **Camera icon**: Filled with camera's color (opacity 0.9)
- [ ] **Direction indicator**: Bold arrow in camera color
- [ ] **FOV wedge/cone**:
  - Fill: camera color with opacity 0.15
  - Border: camera color, 2px solid, opacity 0.6
  - Hover: opacity increases to 0.25 (fill), 1.0 (border)

### Camera Placement Tool (Section 5.10.4)

#### After CMDK Selection

- [ ] Cursor changes: **Camera icon (24px)** + **range circle**
- [ ] **Range circle**:
  - Diameter = camera depth × 2 (scaled to view)
  - Stroke: Camera's assigned color
  - Dashed (12px dash, 6px gap)
  - Rotates slowly (10s per rotation) - subtle animation
  - Opacity: 0.3

- [ ] **Color Assignment Preview**:
  - As soon as camera type selected, next available color assigned
  - Small colored dot (8px) attached to cursor (top-right of icon)

#### Placement (Section 5.10.4)

- [ ] Click inside area: Camera placed
- [ ] **Immediate rendering**:
  1. Camera icon appears (filled with camera color)
  2. Direction arrow extends from icon (initial direction: 0°)
  3. FOV wedge/cone renders (camera color, opacity 0.15, border 0.6)
  4. Success animation: Camera icon "drops in" (scale 0.8→1.2→1.0, 300ms bounce)

- [ ] **Post-Placement**:
  - Properties panel auto-opens (right slide-over)
  - User can adjust direction by dragging FOV wedge edge (live preview)

#### Outside Area (Section 5.10.4)

- [ ] Cursor becomes `not-allowed` + red tint
- [ ] Range circle turns red
- [ ] Click: Error toast `"Cannot place camera outside area"`

### Camera Cursor States (Section 5.8.2)

- [ ] **Camera icon** (24px SVG): Shows camera symbol
- [ ] **Range circle**: Faint dashed circle showing depth range
- [ ] Circle follows cursor
- [ ] Icon color: next available color from palette
- [ ] Cursor "lifts" objects visually (translate-y: -2px, shadow grows)

### Camera Measurement Tooltips (Section 5.7.3)

- [ ] **Before Placement**:
  - Circular range indicator (FOV depth)
  - Tooltip: `"Camera • Range: 20 m"`

- [ ] **After Placement** (adjusting FOV):
  - Dragging FOV cone edge: `"FOV: 75° • Depth: 20 m"`

### Camera Entity Properties

- [ ] `id`, `type: "camera"`, `areaId`
- [ ] `typePreset` (from CMDK selection)
- [ ] `x`, `y`, `height`
- [ ] `direction` (0-360)
- [ ] `fov`, `depth`, `zoom`
- [ ] `nearClipping`
- [ ] `resolution: { width, height }`
- [ ] `color` (auto-assigned)
- [ ] `showCollisions: boolean` (default true)

### Devices in Use Panel (Section 5.1.4)

- [ ] **Trigger**: Right sidebar button or `⌘⇧D`
- [ ] **Slide-over panel from right**
- [ ] **Content**:
  - Badge shows device count
  - List of all cameras with:
    - Color dot
    - Name (editable)
    - FOV/Depth specs
    - Click to select/focus

---

## Dependencies

- Phase 1: Foundation & Data Models (Camera entity schema, color palette)
- Phase 2: Editor Layout & UI Framework (CMDK infrastructure, panels)
- Phase 3: Area System (Area boundaries for validation)

---

## Acceptance Criteria

### From Section 9 (QA)

- [ ] Each camera has unique color from palette
- [ ] Camera colors visible in: editor FOV
- [ ] Camera placement cursor: camera icon + range circle

### Additional Criteria

- [ ] Device Picker CMDK opens on `D` key or button click
- [ ] CMDK shows searchable list of camera types
- [ ] Selecting camera type assigns next available color
- [ ] Cursor shows camera icon + range circle preview
- [ ] Placing camera inside area creates entity with FOV wedge
- [ ] Camera drop-in animation plays on placement
- [ ] Properties panel auto-opens after placement
- [ ] FOV wedge edge can be dragged to adjust direction
- [ ] Placing outside area shows error and prevents placement
- [ ] Color picker in properties allows customization
- [ ] Devices in Use panel lists all cameras with colors
- [ ] >20 cameras correctly cycles palette with hue shift

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Color conflicts with similar shades | Palette carefully selected for distinction; provide color picker |
| FOV rendering performance with many cameras | Use canvas/WebGL for FOV; only render visible |
| CMDK search performance | Virtualize list; keep camera types list small |

---

## Mapping to PRD Sections

- Section 5.3: Camera Color System (entire section)
- Section 5.7.3: Measurement Tooltips (Camera)
- Section 5.8.2: Camera Placement Cursor
- Section 5.10.4: Place Camera Tool (Enhanced)

