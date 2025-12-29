# 02 — Canvas Editor Layout & Drawing Tools

## Goal

Build the Canvas Editor UI with the grid board and core drawing tools (walls and shapes).

---

## Deliverables

### 2.1 Canvas Layout UI

Build the Canvas Editor layout regions:

**Top Panel (fixed):**

- Edit Mode toggle
- Clear Board button
- Undo button
- Redo button
- Export button
- Live Preview button

**Main Board:**

- Checkered grid background
- Pan/zoom controls (editor camera)
- Snap-to-grid toggle (recommended)
- Measurement overlay (recommended)
- Coordinate system in meters with visible origin

**Bottom Navigation (fixed):**

1. Selection mode toggle
2. Draw wall tool
3. Draw shapes (popover: rectangle/line/circle/triangle)
4. Place camera
5. Place person
6. Add background image

### 2.2 Draw Wall Tool

**Workflow:**

- Click first point → start wall segment
- Mouse move previews segment with length in meters near cursor
- Click additional points continues wall polyline
- Double-click ends drawing
- Show angle measurement while drawing

**Constraints:**

- Walls snap to grid (optional toggle)
- Zero-length segments prevented
- Self-intersection allowed visually

### 2.3 Draw Shapes Tool

Popover with choices: Rectangle, Circle, Triangle, Line

**Editor Behaviors:**

- Click-and-drag to size (or click to place default size)
- Handles for resize/rotate
- Live preview during drawing

**Collision Rules:**

- Rectangle/triangle/circle: solid obstacles by default
- Line: blocks camera view by default (preventing camera to see behind element)

### 2.4 Tool State Indicators

- Active tool highlighted in bottom nav
- Cursor changes:
  - Crosshair for draw tools
  - Default pointer for selection
  - Not-allowed when action is invalid

### 2.5 Clear Board

- Prompts confirmation dialog
- Clears all objects
- Resets history
- Removes background

---

## Suggested Tools

- **React Konva** for the 2D canvas rendering (better for drawing/shapes than React Flow)
- **use-gesture** for pan/zoom interactions

---

## Acceptance Criteria

- [ ] Canvas layout renders with all UI regions
- [ ] Grid board displays with pan/zoom functionality
- [ ] Wall drawing tool creates wall segments with polyline workflow
- [ ] Shapes tool creates rectangle, circle, triangle, line
- [ ] Inline measurements display during wall drawing (length in meters, angle)
- [ ] Active tool indicator works
- [ ] Clear board with confirmation works

