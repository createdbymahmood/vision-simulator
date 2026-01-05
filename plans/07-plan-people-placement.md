# Phase 7: People Placement System

**Timeline Reference**: Part of Phase 1 from Section 8 (Week 3)

---

## Phase Goal

Implement the complete Person placement system including real-time validation, collision prevention with obstacles and other people, visual feedback, and person entity management. People serve as the actors in the simulation that cameras will track.

---

## How Codex Should Use This Phase

- Build the placement flow with live validation: area boundary → walls/shapes → other people; show exact reason in tooltip for invalid states.
- Keep visuals consistent: person icon + collision radius preview, blue for valid, red/not-allowed for invalid, with the specified animations.
- Enforce collisions during drag after placement; people cannot overlap obstacles or each other at any time.
- Auto-open the properties panel after placement and allow immediate drag to adjust position.
- Use ID auto-naming (person-1, etc.) and ensure properties map to the schema for later simulation.
- Treat error toasts and shake/pulse animations as required acceptance criteria, not optional polish.

---

## Scope & Responsibilities

### Included

- Person placement tool
- Real-time placement validation
- Collision detection with walls, shapes, and other people
- Person visual design (icon, collision radius)
- Person cursor states
- Person measurement tooltips
- Person entity management

### Explicitly Excluded

- Person movement/physics (Phase 9)
- Trail visualization (Phase 10)
- 3D person rendering (Phase 8)

---

## Deliverables

### Place Person Tool (Section 5.10.5)

#### Activation

- [ ] Click "Place Person" in bottom nav or keyboard `P`
- [ ] Cursor changes: **Person icon (20px silhouette)** + **collision radius circle**
- [ ] **Collision radius preview**:
  - Diameter = person radius × 2 (default 0.6m)
  - Fill: blue `#4ECDC4`, opacity 0.3
  - Border: 2px solid blue, opacity 0.6

#### Real-Time Validation (Section 5.10.5)

- [ ] As cursor moves, check if position is:
  - Inside area: ✓
  - Not on wall/shape: ✓
  - Not overlapping other person: ✓

- [ ] **Valid position**:
  - Collision circle: blue
  - Cursor: person icon

- [ ] **Invalid position**:
  - Collision circle: red
  - Cursor: `not-allowed`
  - Reason shown in tooltip:
    - "Outside area boundary"
    - "Overlaps with wall"
    - "Too close to another person"

#### Placement (Section 5.10.5)

- [ ] Click valid position: Person placed
- [ ] **Animation**:
  - Person appears with fade-in (200ms)
  - Brief pulse animation (scale 1.0→1.15→1.0)
- [ ] Person assigned ID (person-1, person-2, etc.)

#### Post-Placement

- [ ] Person properties panel opens (if Selector mode active)
- [ ] Person can be immediately dragged to adjust position

### Person Cursor States (Section 5.8.2)

- [ ] **Person icon** (20px SVG): Simple person silhouette
- [ ] **Collision radius**: Solid circle (0.3m default) at 30% opacity
- [ ] Color: blue `#4ECDC4`

### Invalid Placement Cursors (Section 5.8.3)

- [ ] **Outside Area**:
  - Cursor: `not-allowed` (circle with slash)
  - Red tint overlay on cursor
  - Shake animation on click (±4px, 50ms × 3)
  - Error toast: "Cannot place object outside area boundaries"

- [ ] **Overlapping Obstacle** (person placement):
  - Cursor: `not-allowed`
  - Ghost person preview turns red
  - Tooltip: "Cannot place here - overlaps with obstacle"

### Person Measurement Tooltips (Section 5.7.3)

- [ ] **Before Placement**:
  - Circular collision radius preview (filled, 0.3m radius, 30% opacity)
  - Tooltip: `"Person • Radius: 0.3 m"`

### Person Entity Properties

- [ ] `id`, `type: "person"`, `areaId`
- [ ] `x`, `y`
- [ ] `radius` (default 0.3m)
- [ ] `height` (default 1.7m)
- [ ] `speed` (default 1.2 m/s)
- [ ] `behavior: "roam"`
- [ ] `trailEnabled: false`
- [ ] `trailLength: 20` (seconds)
- [ ] `trailHistory: []`

### Collision Detection

- [ ] **Check against walls**: Point-to-line distance < person radius + wall thickness/2
- [ ] **Check against shapes**:
  - Rectangle: Point inside expanded bounding box
  - Circle: Distance to center < person radius + shape radius
  - Triangle: Point-in-polygon + expansion for radius
  - Line: Point-to-line distance < person radius + line thickness/2
- [ ] **Check against other people**: Distance < person1.radius + person2.radius

### Person Properties Panel

- [ ] **Header**: Person icon + name (person-1)
- [ ] **Fields**:
  - Position X (meters)
  - Position Y (meters)
  - Radius (meters)
  - Height (meters)
  - Speed (m/s)
  - Behavior dropdown (roam)
  - Trail enabled toggle
  - Trail length (seconds)

---

## Dependencies

- Phase 1: Foundation & Data Models (Person entity schema)
- Phase 2: Editor Layout & UI Framework (Tool buttons, panels)
- Phase 3: Area System (Area boundaries for validation)
- Phase 4: Structural Objects (Walls/shapes for collision detection)

---

## Acceptance Criteria

- [ ] Person tool activates on `P` key or button click
- [ ] Cursor shows person icon + collision radius preview
- [ ] Valid positions show blue collision circle
- [ ] Invalid positions show red collision circle + not-allowed cursor
- [ ] Tooltip shows specific reason for invalid placement
- [ ] Person fade-in and pulse animation on placement
- [ ] Person cannot be placed on walls
- [ ] Person cannot be placed on shapes
- [ ] Person cannot overlap other people
- [ ] Error toast appears when clicking invalid position
- [ ] Properties panel opens after placement
- [ ] Person can be dragged after placement
- [ ] Person dragging respects all collision constraints

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Collision detection performance with many objects | Use spatial hash grid for broad phase |
| Precision issues with circle-polygon collision | Use robust geometry library |
| User confusion about why placement fails | Clear, specific tooltip messages |

---

## Mapping to PRD Sections

- Section 5.7.3: Measurement Tooltips (Person)
- Section 5.8.2: Person Placement Cursor
- Section 5.8.3: Invalid/Error Cursors (Outside Area, Overlapping)
- Section 5.10.5: Place Person Tool (Enhanced)
