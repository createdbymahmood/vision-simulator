# Phase 5: Selection & Transform Tools

**Timeline Reference**: Part of Phase 1 from Section 8 (Week 3)

---

## Phase Goal

Implement the complete Selection Tool with multi-select, drag operations, transform handles (resize, rotate), and all associated cursor states and constraints. Enable users to manipulate placed objects within area boundaries.

---

## How Codex Should Use This Phase

- Treat Hand vs Selector as modes with exclusive behaviors; Selector never pans, Hand never selects.
- Implement hit testing order exactly (People > Cameras > Walls > Shapes > Areas); this affects every click.
- Enforce area boundaries during drag/resize/rotate; provide visual boundary feedback instead of silent clamping.
- Build transform handles and cursors to spec; they are required for all object types created so far.
- Multi-select needs bulk actions (delete/duplicate) and a visible selection count—do not skip UX cues.
- Collision prevention for people during drag is part of acceptance; wire geometry checks before release.

---

## Scope & Responsibilities

### Included

- Selection Tool (Selector Mode)
- Hand Mode (pan/navigation)
- Single-click selection with z-index priority
- Multi-select (Shift+click)
- Drag operations with area constraints
- Transform handles (resize corners, edges, rotation)
- Selection cursors and visual feedback
- Collision prevention during drag

### Explicitly Excluded

- Camera/Person placement (separate phases)
- 3D manipulation
- Properties panel content (shell only)

---

## Deliverables

### Mode Popover (Section 5.1.3)

- [ ] **Hand Mode**:
  - Icon: hand
  - Map drag enabled
  - Selection disabled
  - Keyboard: `H`

- [ ] **Selector Mode**:
  - Icon: cursor
  - Selection enabled
  - Keyboard: `V`

- [ ] Active mode highlighted in popover

### Selection Tool (Section 5.10.1)

- [ ] **Click Selection**:
  - Clicking selects topmost object
  - Z-index priority: People > Cameras > Walls > Shapes > Areas
  - Clicking blank space deselects all

- [ ] **Multi-select** (Shift+click):
  - Selected objects have blue outline glow
  - Selection count badge (top-left): `"3 objects selected"`
  - Bulk actions available: Delete, Duplicate, Group

### Selection Cursors (Section 5.8.4)

- [ ] **Default Cursors**:
  - Arrow (default): Standard pointer
  - Hand (Hand mode): `cursor: grab` hovering, `cursor: grabbing` dragging

- [ ] **Hovering Selectable Object** (Selector mode):
  - Cursor: pointer (hand with pointing finger)
  - Object highlights:
    - Outline glow (2px, color: accent blue)
    - Opacity increases slightly (+10%)
  - Tooltip shows object type + ID after 500ms hover

- [ ] **Dragging Object**:
  - Cursor: `move` (four-directional arrows)
  - Object follows with 20ms latency (smooth feel)
  - If approaching invalid region: preview turns red, cursor becomes `not-allowed`

### Dragging Selected Objects (Section 5.10.1)

- [ ] Must remain fully inside area boundaries

- [ ] **Constraint visualization** (near boundary):
  - Area boundary line turns red where object would exit
  - Object "pushes against" boundary (cursor becomes `not-allowed`)
  - Object snaps to maximum valid position

- [ ] **Collision prevention** (people only):
  - People cannot overlap obstacles/people
  - If drag would cause overlap:
    - Ghost preview turns red
    - Object "bounces back" to last valid position on release
    - Error sound (optional)

### Transform Handles (Section 5.10.1)

- [ ] **Bounding box**: Dashed rectangle around selected object

- [ ] **Corner handles**: 8px squares, white fill, primary border
  - NW, NE, SW, SE: Resize diagonally
  - Hold Shift: Constrain proportions

- [ ] **Edge handles**: 6px circles, midpoint of each edge
  - N, S: Resize vertically
  - E, W: Resize horizontally

- [ ] **Rotation handle**: Circle (10px) connected to top edge by 20px line
  - Drag to rotate
  - Shows angle tooltip: `"Rotation: 45°"`
  - Snap to 15° increments (hold Shift for free rotation)

### Resize Handles Cursors (Section 5.8.4)

- [ ] Corner handles: `nwse-resize`, `nesw-resize` (diagonal arrows)
- [ ] Edge handles: `ew-resize`, `ns-resize` (horizontal/vertical arrows)
- [ ] Rotate handle: custom rotate cursor icon

### Area Boundary Constraints

- [ ] During resize: shape cannot extend outside area
- [ ] During rotate: all corners must remain inside area
- [ ] Visual feedback when approaching/hitting boundary

---

## Dependencies

- Phase 1: Foundation & Data Models (Entity schemas, state management)
- Phase 2: Editor Layout & UI Framework (Mode popover, tooling)
- Phase 3: Area System (Area boundaries for validation)
- Phase 4: Structural Objects (Objects to select and transform)

---

## Acceptance Criteria

- [ ] Clicking object selects it with visual highlight
- [ ] Z-index priority correctly handles overlapping objects
- [ ] Shift+click adds to selection, shows count badge
- [ ] Hand mode allows map panning, disables selection
- [ ] Selector mode enables selection, shows pointer cursor on hover
- [ ] Object tooltip appears after 500ms hover
- [ ] Dragging respects area boundaries
- [ ] Drag near boundary shows red highlight
- [ ] Transform handles appear when object selected
- [ ] Corner resize maintains aspect with Shift held
- [ ] Rotation handle shows angle tooltip
- [ ] Rotation snaps to 15° increments
- [ ] People cannot be dragged to overlap obstacles
- [ ] Bulk delete/duplicate works for multi-selection

---

## Risks & Mitigations

| Risk                                      | Mitigation                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| Transform performance with complex shapes | Use bounding box for visual feedback during drag; apply to geometry on release |
| Rotation calculation edge cases           | Use well-tested rotation matrix library                                        |
| Multi-select state complexity             | Clear selection state management with tests                                    |

---

## Mapping to PRD Sections

- Section 5.1.3: Mode Popover (Hand/Selector)
- Section 5.8.1: Default Cursors
- Section 5.8.4: Selection Cursors
- Section 5.10.1: Selection Tool (Enhanced)

