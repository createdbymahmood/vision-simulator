# Phase 2: Editor Layout & UI Framework

**Timeline Reference**: Part of Phase 1 from Section 8 (Weeks 1-2)

---

## Phase Goal

Implement the complete editor layout structure including the Top Panel, Bottom Navigation, Right Sidebar Vertical Buttons, and Main Viewport shell. Establish the visual framework, glassmorphism styling, and mode switching infrastructure before implementing specific tools.

---

## How Codex Should Use This Phase

- Ship layout shells, interactions, and keyboard plumbing only; leave tool behaviors to later phases.
- Keep Map vs Canvas purely visual (toggle hides map tiles only). No routing anywhere.
- Wire edit-mode gating: when OFF, every editing control and shortcut should be inert.
- Enforce area dependency: tools that require areas must render disabled states until Phase 3 creates areas.
- Use consistent glassmorphism tokens and spacing so later panels reuse the same primitives.
- Treat acceptance criteria and shortcut list as the smoke-test suite for this phase.

---

## Technical Implementation Requirements

**Mapbox Integration**: The viewport infrastructure MUST be set up with Mapbox GL JS:

- **Mapbox Map Instance**: Initialize Mapbox GL JS map in the main viewport
- **Map Container**: Create a container div that fills the viewport area
- **Map Configuration**:
  - Set initial center and zoom level
  - Configure map style URL (for Map Mode)
  - Enable/disable layers for Canvas Mode
- **Event Setup**: Wire up basic Mapbox event handlers for future tool implementations
- **Map Controls**: Position Mapbox attribution and navigation controls appropriately

This phase sets up the Mapbox foundation that Phases 3-7 will build upon for drawing and placing objects.

---

## Scope & Responsibilities

### Included

- Top Panel (fixed, 56px height) with all sections
- Bottom Navigation (fixed, 64px height, glassmorphism)
- Right Sidebar Vertical Buttons (48px width)
- Main Viewport shell structure
- Map/Canvas Mode Toggle implementation
- Edit Mode Toggle
- Keyboard shortcut infrastructure
- Global consistency rules (Section 3.1)
- App-wide layout (100vh height, 100% width)

### Explicitly Excluded

- Actual drawing tool implementations
- Properties panel content (shell only)
- 3D rendering
- Actual Mapbox integration (placeholder only)

---

## Deliverables

### Top Panel (Section 5.1.1)

- [ ] **Layout**: Fixed, height 56px
- [ ] **Left Section**:
  - Logo/App name (optional)
  - **Map/Canvas Mode Toggle** (segmented control)
    - Map icon + "Map" label
    - Canvas icon + "Canvas" label
    - Active state: background highlight
    - Transition: 200ms ease
- [ ] **Center Section**:
  - **Edit Mode Toggle** (switch)
    - Default: ON
    - Label: "Edit Mode"
    - When OFF: all editing tools disabled, selection only
  - **Clear Board** button
    - Icon: trash
    - Confirmation modal on click
  - **Undo** button (⌘Z / Ctrl+Z)
    - Icon: rotate-ccw
    - Disabled state when history empty
    - Tooltip shows last action
  - **Redo** button (⌘⇧Z / Ctrl+Shift+Z)
    - Icon: rotate-cw
    - Disabled state when future history empty
- [ ] **Right Section**:
  - **Export** dropdown
    - Scene JSON
    - Scene Image
    - Bundle (future, disabled)
  - **Live Preview** button (primary)
    - Icon: play
    - Switches to Preview View (no routing)

### Bottom Navigation (Section 5.1.3)

- [ ] **Layout**:
  - Centered flex row
  - Max-width: 800px
  - Glassmorphism effect
  - Fixed, height: 64px

- [ ] **Tool Items** (each 80px wide, icon + label):
  1. **Mode Popover** (Hand/Selector)
     - Icon: hand / cursor
     - Popover with Hand Mode and Selector Mode options
     - Active mode highlighted
     - Keyboard: `V` (selector), `H` (hand)
  2. **Create Area** tool
     - Icon: polygon
     - Badge: "Required" (if no areas exist)
     - Popover with Point Mode and Pen Mode options
     - Keyboard: `A`
  3. **Draw Wall** tool
     - Icon: wall/divider
     - Disabled if no areas exist (grayed out + tooltip)
     - Keyboard: `W`
  4. **Draw Shapes** tool
     - Icon: shapes (square/circle)
     - Popover with Rectangle, Circle, Triangle, Line options
     - Keyboard shortcuts: R, C, T, L
  5. **Place Device** tool
     - Icon: camera
     - Opens CMDK dialog
     - Keyboard: `D`
  6. **Place Person** tool
     - Icon: user
     - Keyboard: `P`

### Right Sidebar Vertical Buttons (Section 5.1.4)

- [ ] **Layout**:
  - Vertical stack
  - Glassmorphism
  - Gap: 8px
  - Width: 48px

- [ ] **Buttons** (each 48px × 48px):
  1. **Search Location** (Map Mode only)
     - Icon: search
     - Tooltip: "Search location (⌘K)"
  2. **Area Management**
     - Icon: layers
     - Badge shows area count
     - Tooltip: "Areas (⌘⇧A)"
  3. **Map View Mode** (Map Mode only)
     - Icon: map
     - Tooltip: "Map style"
  4. **Devices in Use**
     - Icon: video (camera)
     - Badge shows device count
     - Tooltip: "Devices (⌘⇧D)"

### Main Viewport Structure (Section 5.1.2)

- [ ] **Layout**: 100% - 56px top - 64px bottom
- [ ] **Placeholder content** for Map Mode / Canvas Mode
- [ ] **Coordinate Display** (bottom-left)
  - Always visible
  - Format: "X: 12.5 m | Y: -3.2 m"
  - Glassmorphism style, 8px padding
  - Updates in real-time as cursor moves
- [ ] **Snap-to-Grid Toggle** (bottom-right floating button)
  - Icon: grid
  - Active state: highlighted
  - Snap distance: 0.5m
- [ ] **Measurement Overlay Toggle** (bottom-right, below snap)
  - Icon: ruler

### Mode Switching (Section 4.2)

- [ ] **Map/Canvas Toggle behavior**:
  - Map Mode (default): Shows Mapbox tiles
  - Canvas Mode: Same editor with map tiles hidden, neutral grid shown
  - Toggle is purely visual—all functionality identical
  - Areas remain visible and enforced in both modes

### Global Consistency Rules (Section 3.1)

- [ ] Selection mode governs whether items are selectable
- [ ] Clicking "blank space" closes:
  - Properties panels
  - Popovers
  - CMDK dialogs
  - Area management popovers
  - PTZ control panels
- [ ] Bottom nav and top nav always visible
- [ ] Entire app uses 100vh height, 100% width

### Keyboard Shortcuts

- [ ] `V` - Selector Mode
- [ ] `H` - Hand Mode
- [ ] `A` - Create Area
- [ ] `W` - Draw Wall
- [ ] `R` - Rectangle Shape
- [ ] `C` - Circle Shape
- [ ] `T` - Triangle Shape
- [ ] `L` - Line Shape
- [ ] `D` - Place Device (opens CMDK)
- [ ] `P` - Place Person
- [ ] `⌘K` / `Ctrl+K` - Search Location
- [ ] `⌘⇧A` / `Ctrl+Shift+A` - Area Management
- [ ] `⌘⇧D` / `Ctrl+Shift+D` - Devices in Use
- [ ] `⌘Z` / `Ctrl+Z` - Undo
- [ ] `⌘⇧Z` / `Ctrl+Shift+Z` - Redo
- [ ] `ESC` - Cancel current action / close panels

---

## Dependencies

- Phase 1: Foundation & Data Models (state management, routing)

---

## Acceptance Criteria

- [ ] Top Panel renders with all three sections and correct 56px height
- [ ] Bottom Navigation renders with glassmorphism, centered, max-width 800px
- [ ] All 6 tool buttons in bottom nav are visible with correct icons
- [ ] Right Sidebar shows 4 buttons with correct conditional visibility (Map Mode only items)
- [ ] Map/Canvas toggle switches modes with 200ms transition
- [ ] Edit Mode toggle disables all tools when OFF
- [ ] Keyboard shortcuts trigger correct tool activations
- [ ] Clicking blank space closes all open panels/popovers
- [ ] Coordinate display updates in real-time on cursor move
- [ ] Clear Board button shows confirmation modal
- [ ] Live Preview button switches to Preview View (no routing/navigation)
- [ ] Undo/Redo buttons show correct disabled states
- [ ] Area-dependent tools (Wall, Shapes, Devices, People) disabled when no areas exist

---

## Risks & Mitigations

| Risk                                              | Mitigation                                            |
| ------------------------------------------------- | ----------------------------------------------------- |
| Glassmorphism performance on older browsers       | Provide fallback solid background styles              |
| Keyboard shortcut conflicts with browser defaults | Use `preventDefault()` and document conflicts         |
| Layout breaks on different screen sizes           | Test on multiple viewport sizes; minimum 1280px width |

---

## Mapping to PRD Sections

- Section 3.1: Consistency Rules → Global behaviors
- Section 4.2: Mode Switching → Map/Canvas toggle
- Section 5.1: Editor Layout (UI Regions) → All layout components
