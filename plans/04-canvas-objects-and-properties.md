# 03 — Canvas Objects & Properties Panel

## Goal

Complete object placement (cameras, people, background) and the full properties editing panel with instant-apply behavior.

---

## Deliverables

### 3.1 Place Camera Tool

**Workflow:**

- Click on board to place camera at cursor
- On placement, camera gets default config (medium preset)
- Immediately render: camera icon, direction indicator, vision cone polygon (occlusion-aware)

**Camera Vision Rendering:**

- Vision polygon computed via ray casting clipped by obstacles
- Updates on: camera property change, obstacle movement/creation/deletion

### 3.2 Place Person Tool

**Workflow:**

- Click to place person at cursor
- Person appears as circle/marker with collision radius

**Constraints:**

- Cannot place inside walls/shapes/lines (where line blocks movement)
- Cannot overlap other people at placement time (nudge or reject)

### 3.3 Background Image Tool

**Workflow:**

- Upload image via file picker
- Set as canvas background layer aligned to world coordinates

**Controls:**

- Opacity slider
- Scale (meters per pixel calibration)
- Rotation
- Position (x, y anchor)
- Lock/unlock to prevent accidental moves

### 3.4 Selection & Z-Ordering

When clicking in Selection mode, priority order:

1. People (top priority)
2. Cameras
3. Walls (segments)
4. Shapes
5. Background

- Selection cycle shortcut to iterate stacked objects (optional)
- Multi-select recommended for advanced usage

### 3.5 Properties Panel (Right Sidebar)

**General Behavior:**

- Title: object type + ID (e.g., "Camera • cam-3")
- Live-updating values; change triggers immediate render
- Close on outside click, nav click, or ESC

**Field Requirements:**

- Numeric fields: step increments, min/max, drag on label to adjust
- Angle: slider + number input
- Color: picker + opacity slider
- Validate and clamp values

**Per-Entity Properties:**

**Wall:**

- Start (x1, y1), End (x2, y2) in meters
- Height (m), Thickness (m)
- Material preset: drywall, concrete
- Color + opacity

**Shape (all types):**

- x, y, rotation (0-360°)
- width, length (>0)
- height (m)
- color, opacity

**Camera:**

- x, y
- direction (0-360°)
- FOV (1-180°)
- depth (≥0 m)
- height (≥0 m)
- zoom (unitless)
- near clipping (default 0.1m)
- camera type preset (optional)

**Person:**

- x, y
- radius
- speed (≥0 m/s)
- movement mode: random roam within boundary

**Background:**

- opacity, scale, rotation, position (x, y), lock toggle

---

## Suggested Tools

- **React Konva** for canvas rendering
- **react-colorful** for color picker
- **@radix-ui/react-slider** for sliders (via shadcn)

---

## Acceptance Criteria

- [ ] Camera placement shows camera icon with direction and FOV wedge
- [ ] Camera vision cone is occlusion-aware (updates when obstacles change)
- [ ] Person placement enforces collision constraints
- [ ] Background image uploads and allows calibration
- [ ] Properties panel opens on selection with correct fields per entity type
- [ ] All property changes apply instantly (no save button)
- [ ] Numeric fields support dragging on label to adjust
- [ ] Properties panel closes via outside click, nav click, or ESC

