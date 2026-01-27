# Updated PRD — Computer Vision Simulator Application (Enhanced)

## Product Name: Computer Vision Simulator

## Live Preview Title: **Simulation Analysis**

## Platforms: Web (desktop-first)

## View Modes: **Map Mode** (primary editor) with **Canvas Mode Toggle** (removes map styling)

## Primary Outputs: Real-time simulation + camera POV feeds + recording + snapshots + scene export

---

## 0) Executive Summary

We are building an interactive simulation tool that lets users:

1. Design an environment in **Map Mode** (Mapbox-based) with **Canvas Mode** as a simplified view (same editor, map tiles removed)
2. Place **areas, walls, shapes, cameras, people**
3. Run a live simulation with:
   - **Real-time agent motion** with collision avoidance
   - **Realistic camera visibility** with individual camera colors and 3D FOV collision rendering
   - **Per-camera PTZ controls** (pan, tilt, zoom) in both editor and simulation
   - **3D world preview** (default) with radar mini-map showing people and cameras
   - Multi-camera **CCTV-like POV feeds**

4. Export:
   - **Recording** (video capture of 3D view)
   - **Snapshot** (screenshot of 3D)
   - **Scene Export** (JSON)

**Key Architecture Decision**: Everything is built in Map Mode. Canvas Mode is simply Map Mode with map tiles/styling disabled, showing a neutral grid background instead.

**New Enhanced Features**:

- Individual camera FOV colors for visual distinction in 3D
- 3D FOV collision visualization with walls/shapes/obstacles
- Per-camera PTZ (Pan-Tilt-Zoom) controllers
- Radar view with person ping animations
- Real-time measurement tooltips during drawing
- Refined cursor states and visual feedback

---

## 1) Users, Personas, Jobs-to-be-Done

### 1.1 Personas

- **Security Designer**: Plans camera placement for coverage, blind spots, and obstructions.
- **Operations Engineer**: Validates device constraints and coverage in real environments (Map Mode).
- **Camera Operator**: Uses PTZ controls to adjust camera angles and test coverage in real-time.
- **Analyst / Stakeholder**: Reviews recorded simulation outputs and snapshots.
- **Product/Integrator**: Uses exported scene JSON to integrate simulation results elsewhere.

### 1.2 Primary JTBD

- "When I design an environment, I want to see which people each camera can detect with distinct visual indicators, so I can validate camera placement and configuration before deployment."
- "When I adjust a camera's direction, I want to see exactly what obstacles block its view in 3D, so I can optimize placement."
- "When I operate cameras, I want PTZ controls to simulate real camera movement, so I can test operational scenarios."

---

## 2) Scope

### 2.1 In Scope (MVP+)

- **Unified Map-based editor** with Canvas Mode toggle (removes map styling)
- **Areas** as mandatory spatial boundaries (all objects must be inside areas)
- Drawing tools with **real-time measurement tooltips**: walls, shapes, device placing, people placing
- **Individual camera FOV colors** for visual distinction
- **3D FOV collision rendering** showing camera view intersections with obstacles
- **Per-camera PTZ controls** (pan, tilt, zoom) in editor and simulation
- **Radar mini-map** with person ping animations
- Full selection + property editing (instant apply)
- Undo/redo for _all_ edits
- Live preview / simulation:
  - **3D view** (default) with colored camera FOVs and collision visualization
  - **Map visibility toggle** (shows/hides map tiles)
  - **Radar view** with real-time tracking and ping animations
  - Multi-camera POV feeds (CCTV tiles)

- Recording + snapshot
- Export JSON

### 2.2 Explicit Non-Goals (for now)

- Multiplayer collaboration
- Photorealistic rendering
- ML inference (no actual CV models—only visibility simulation & bounding boxes)
- Account system / backend (unless required later)
- True "canvas-only" mode with infinite boundaries (areas are always required)
- Physical PTZ motor simulation (speed limits, acceleration)

---

## 3) Product Requirements: High-Level

### 3.1 Consistency Rules (Global)

- **Selection mode** governs whether items are selectable
- **Areas are mandatory**: All objects (walls, shapes, cameras, people) must be placed inside defined areas
- **Each camera has a unique color**: Auto-assigned from predefined palette, user-customizable
- **Measurement tooltips** appear during all drawing operations
- Clicking "blank space" closes:
  - Properties panels
  - Popovers
  - CMDK dialogs
  - Area management popovers
  - PTZ control panels

- Bottom nav and top nav are **fixed** and always visible
- Entire app uses **100vh height, 100% width**

### 3.2 Object Categories

- **Spatial Boundaries**: areas (mandatory first step)
- **Structural**: walls, shapes
- **Actors**: people
- **Devices**: cameras (plus processors as placeholders in device picker)

### 3.3 Interaction Categories

- Define areas (required first)
- Create: draw/place objects (within areas) with measurement feedback
- Select: pick object
- Modify: drag/resize/rotate and edit properties
- Control: PTZ camera adjustments
- Simulate: run live preview with radar tracking
- Export: record/snapshot/scene export
- History: undo/redo

---

## 4) Information Architecture & Navigation

### 4.1 View Modes (No Routing)

**Single-Page Application**: The application operates as a single page with two view modes:
- **Editor View** (Unified Map Editor) - default view
- **Preview View** (Simulation Analysis) - toggled via Live Preview button

No client-side routing is used. View switching is handled by state management.

### 4.2 Mode Switching

- **Map/Canvas Toggle** in top panel:
  - **Map Mode** (default): Shows Mapbox tiles with all editing features
  - **Canvas Mode**: Same editor with map tiles hidden, neutral grid background shown
  - Toggle is purely visual—all functionality remains identical
  - Areas remain visible and enforced in both modes

---

## 5) Unified Editor PRD (Map-Based with Canvas Mode)

### 5.1 Editor Layout (UI Regions)

1. **Top Panel (fixed, height: 56px)**
   - **Left Section**:
     - Logo/App name (optional)
     - **Map/Canvas Mode Toggle** (segmented control)
       - Map icon + "Map" label
       - Canvas icon + "Canvas" label
       - Active state: background highlight
       - Transition: 200ms ease
   - **Center Section**:
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
   - **Right Section**:
     - **Export** dropdown
       - Scene JSON
       - Scene Image
       - Bundle (future)
     - **Live Preview** button (primary)
       - Icon: play
       - Switches to Preview View (no routing)

2. **Main Viewport (100% - 56px top - 64px bottom)**
   - Mapbox map (Map Mode) OR neutral grid (Canvas Mode)
   - Pan/zoom controls (Mapbox native + mouse/trackpad)
   - **Cursor States**:
     - Default: arrow
     - Pan (Hand mode): grab / grabbing
     - Draw Area: crosshair + **12px circular dot** at cursor tip (color: primary blue, opacity: 0.8)
     - Draw Wall: crosshair + **8px circular dot** (color: red)
     - Draw Shape: crosshair + shape preview ghost
     - Place Camera: camera icon (24px) + circular range indicator (faint circle showing depth)
     - Place Person: person icon (20px) + collision radius preview
     - Invalid placement: not-allowed (circle-slash) + red tint on cursor
   - **Grid Overlay** (Canvas Mode):
     - 1m × 1m squares
     - Line color: rgba(0, 0, 0, 0.1)
     - Major grid every 10m: rgba(0, 0, 0, 0.25), 2px width
     - Grid labels every 10m showing coordinates
   - **Snap-to-Grid Toggle** (bottom-right floating button):
     - Icon: grid
     - Active state: highlighted
     - Snap distance: 0.5m
   - **Measurement Overlay Toggle** (bottom-right, below snap):
     - Icon: ruler
     - Shows distances between objects when active

3. **Bottom Navigation (fixed, height: 64px, glassmorphism effect)**

   **Layout**: Centered flex row, max-width 800px

   **Items** (each 80px wide, icon + label):
   1. **Mode Popover** (Hand/Selector)
      - Icon: hand / cursor
      - Popover on click:
        - Hand Mode (map drag enabled, selection disabled)
        - Selector Mode (selection enabled)
      - Active mode highlighted
      - Keyboard: `V` (selector), `H` (hand)
   2. **Create Area** tool
      - Icon: polygon
      - Badge: "Required" (if no areas exist)
      - Click activates area drawing mode
      - Popover shows:
        - Point Mode (click to add vertices)
        - Pen Mode (Bezier curves)
      - Keyboard: `A`
   3. **Draw Wall** tool
      - Icon: wall/divider
      - Click activates wall drawing
      - Disabled if no areas exist (grayed out + tooltip: "Create an area first")
      - Keyboard: `W`
   4. **Draw Shapes** tool
      - Icon: shapes (square/circle)
      - Popover on click:
        - Rectangle (keyboard: `R`)
        - Circle (keyboard: `C`)
        - Triangle (keyboard: `T`)
        - Line (keyboard: `L`)
      - Each shape shows icon + label
   5. **Place Device** tool
      - Icon: camera
      - Opens CMDK dialog
      - Keyboard: `D`
   6. **Place Person** tool
      - Icon: user
      - Click activates person placement
      - Keyboard: `P`

4. **Right Sidebar Vertical Buttons (fixed, right edge, width: 48px)**

   **Layout**: Vertical stack, glassmorphism, gap: 8px

   **Buttons** (each 48px × 48px):
   1. **Search Location** (Map Mode only)
      - Icon: search
      - Opens CMDK with geocoding
      - Tooltip: "Search location (⌘K)"
   2. **Area Management**
      - Icon: layers
      - Opens slide-over panel from right
      - Badge shows area count
      - Tooltip: "Areas (⌘⇧A)"
   3. **Map View Mode** (Map Mode only)
      - Icon: map
      - Popover shows style options
      - Tooltip: "Map style"
   4. **Devices in Use**
      - Icon: video (camera)
      - Opens slide-over panel
      - Badge shows device count
      - Tooltip: "Devices (⌘⇧D)"

5. **Properties Panel (contextual, right slide-over, width: 360px)**

   **Appearance**:
   - Slides in from right: 300ms ease-out
   - Backdrop blur + semi-transparent background
   - Closes: ESC, outside click, tool switch

   **Header** (56px height):
   - Object type icon + name
   - Object ID (smaller, muted)
   - Close button (X)

   **Content** (scrollable):
   - Organized sections with dividers
   - All inputs update instantly (no save button)
   - History commits debounced (300ms)

---

### 5.2 Coordinate System & Units

- World coordinate system in **meters** (2D)
- Geo-referenced coordinates (lat/lng) stored internally but presented as meters in UI
- Origin anchored to first area created or scene center
- Property panel always shows:
  - **X and Y in meters** (relative to scene origin)
    - Format: "X: 12.5 m", "Y: -3.2 m"
    - Precision: 0.1m
  - **Rotation degrees** (0–360)
    - Format: "45°"
    - Visual: circular slider + number input

- **Coordinate Display** (bottom-left of viewport):
  - Always visible
  - Shows cursor position in meters
  - Format: "X: 12.5 m | Y: -3.2 m"
  - Updates in real-time as cursor moves
  - Glassmorphism style, 8px padding

- Rendering scale factor (px per meter) internal; never leaks into UI

---

### 5.3 Camera Color System (NEW)

#### 5.3.1 Color Assignment

**Auto-Assignment**:

- Each camera receives a unique color from predefined palette on creation
- Palette (20 distinct colors optimized for visibility):
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

- If >20 cameras: cycle through palette with slight hue shift (+15°)
- Color stored in camera entity: `color: "#FF6B6B"`

**User Customization**:

- Properties panel includes color picker
- Real-time preview in editor and 3D view
- Color affects:
  - FOV cone/wedge in editor
  - 3D FOV frustum visualization
  - Camera icon outline
  - POV feed tile border
  - Radar indicator

#### 5.3.2 Visual Application

**Editor (2D Top-Down)**:

- Camera icon: filled with camera's color (opacity: 0.9)
- Direction indicator: bold arrow in camera color
- FOV wedge/cone:
  - Fill: camera color with opacity 0.15
  - Border: camera color, 2px solid, opacity 0.6
  - Hover: opacity increases to 0.25 (fill), 1.0 (border)

**3D View**:

- FOV frustum volume:
  - Wireframe edges: camera color, 2px width
  - Semi-transparent planes: camera color, opacity 0.12
  - Collision surfaces (see 5.4): camera color, opacity 0.3
- Camera model: small camera mesh with colored lens/body accent

**POV Feeds**:

- Tile border: 3px solid border in camera color
- Active tile (selected): border 4px, glow effect
- Detection count badge: background in camera color

**Radar**:

- Camera indicator: dot with camera color
- FOV wedge: outline in camera color

---

### 5.4 3D FOV Collision Visualization (NEW)

#### 5.4.1 Collision Detection

**Purpose**: Show exactly where camera's 3D viewing frustum intersects with obstacles.

**Collision Surfaces Rendered**:

1. **Wall Intersections**:
   - When camera FOV frustum intersects wall geometry:
     - Compute intersection polygon on wall surface
     - Render as **quad mesh** with camera's color
     - Opacity: 0.35
     - Effect: pulsing glow (0.3–0.4 opacity, 2s cycle)
   - Shows which parts of walls block camera view

2. **Shape Intersections**:
   - When frustum intersects shape (rectangle, circle, triangle):
     - Compute intersection volume
     - Render intersection surface on shape
     - Opacity: 0.4
     - Optional: slight emission for highlight
   - Shows exactly what obstacles are in view

3. **Floor Intersections** (FOV footprint):
   - Where FOV cone hits the ground plane
   - Rendered as flat polygon on floor
   - Camera color with opacity 0.15
   - Dashed outline (camera color, 2px)
   - This is the "visible area" on the ground

4. **Area Boundary Intersections**:
   - Where FOV hits area edges (vertical walls at area boundaries)
   - Rendered same as wall intersections
   - Helps visualize coverage limits

#### 5.4.2 Collision Conditions

**Wall Collision Rendering Conditions**:

- Wall height >= ray height at intersection: **Full occlusion** (bright collision surface)
- Wall height < camera height but > floor: **Partial occlusion** (dimmer collision surface, opacity 0.2)
- Wall thickness considered: ray enters front face and exits back face (show both)

**Shape Collision Rendering Conditions**:

- Shape is solid (not transparent material): **Full occlusion**
- Shape height considerations:
  - If shape height < camera height: only bottom part shown as collision
  - If shape height >= camera height: full intersection surface shown
- Line shapes: render as thin plane intersection

**Multiple Obstacle Intersections**:

- When FOV intersects multiple obstacles:
  - Render all collision surfaces
  - Use additive blending for overlapping colors
  - Z-fighting prevention: slight depth offset per surface

#### 5.4.3 Performance Optimization

- Collision geometry computed per frame only for:
  - Selected camera (always)
  - Cameras in viewport (if < 10 cameras)
  - Or: all cameras at reduced update rate (10 FPS)
- Use Three.js Raycaster with triangle intersection
- Cache static obstacle geometry
- Recompute only when:
  - Camera moves/rotates/zooms
  - Obstacles move/change
  - Area boundaries change

#### 5.4.4 UI Controls

**Collision Visualization Toggle** (3D view, top-right):

- Icon: eye-slash
- Label: "Show FOV Collisions"
- Default: ON
- When OFF: only FOV frustum wireframe shown, no collision surfaces

**Per-Camera Toggle** (Properties panel):

- "Show Collisions" checkbox
- Allows hiding collision for specific camera while keeping others visible

---

### 5.5 Per-Camera PTZ Controls (NEW)

#### 5.5.1 PTZ Definition

**PTZ = Pan-Tilt-Zoom**:

- **Pan**: Horizontal rotation (yaw) - left/right
- **Tilt**: Vertical angle (pitch) - up/down
- **Zoom**: Optical zoom factor affecting FOV

#### 5.5.2 PTZ UI Component (Always Available)

**Location**:

- **Editor**: Properties panel when camera selected
- **3D Simulation**: Floating panel for selected camera (default: first camera)

**Layout** (PTZ Control Panel):

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

**Components**:

1. **D-Pad Controls** (90px × 90px):
   - Center dot: camera color, 16px
   - Arrows: 24px, clickable buttons
   - **Up arrow**: Tilt up (+5° per click, hold for continuous)
   - **Down arrow**: Tilt down (-5° per click)
   - **Left arrow**: Pan left (-5° per click)
   - **Right arrow**: Pan right (+5° per click)
   - Hover: button highlights
   - Active: button depresses slightly (2px translate)

2. **Pan Slider**:
   - Range: 0–360°
   - Circular slider (optional) or linear
   - Handle: camera color
   - Label: "Pan: 90°"
   - Live updates 3D view

3. **Tilt Slider**:
   - Range: -45° to +90° (looking down to looking up)
   - Default: 0° (horizontal)
   - Constrained by camera type (some cameras have limited tilt)
   - Label: "Tilt: 15°"

4. **Zoom Slider**:
   - Range: 1.0x to 10.0x (or camera-specific max zoom)
   - Logarithmic scale (feels natural)
   - Affects FOV: `effectiveFOV = baseFOV / zoomFactor`
   - Label: "Zoom: 1.5x"

5. **Reset Button**:
   - Returns to default: Pan 0°, Tilt 0°, Zoom 1x
   - Animates smoothly (500ms ease-out)

6. **Preset Dropdown**:
   - Save current PTZ as preset (up to 5 per camera)
   - Named presets: "Entrance", "Parking", "Main Hall"
   - Quick apply presets
   - Presets stored in camera entity

#### 5.5.3 PTZ Behavior in Editor

- **Real-time FOV update**: As user adjusts Pan/Tilt/Zoom, FOV wedge/cone redraws immediately
- **Collision surfaces update**: 3D intersections recompute in real-time
- **Smooth transitions**: 200ms easing for slider changes, 100ms for button increments
- **Keyboard shortcuts** (when camera selected):
  - Arrow keys: Pan/Tilt (5° increments)
  - `+` / `-`: Zoom in/out
  - `0`: Reset PTZ

#### 5.5.4 PTZ Behavior in 3D Simulation

**PTZ Panel in Simulation** (floating, draggable):

- Position: bottom-right by default
- Width: 280px, height: 320px
- Backdrop blur, semi-transparent
- Minimize button (collapses to small floating PTZ icon)
- Drag handle at top

**Live Operation**:

- Adjusting PTZ updates:
  - 3D FOV frustum
  - Collision surfaces
  - Camera POV feed (rendered view changes)
  - Radar indicator
  - Detection results (people visibility recalculated)

#### 5.5.5 PTZ Data Model

**Camera Entity Addition**:

```json
{
  "id": "camera-1",
  // ... existing fields ...
  "ptz": {
    "pan": 90, // degrees, 0–360
    "tilt": 0, // degrees, -45 to +90
    "zoom": 1.0, // multiplier, 1.0 to 10.0
    "limits": {
      // camera-specific constraints
      "panMin": 0,
      "panMax": 360,
      "tiltMin": -45,
      "tiltMax": 90,
      "zoomMin": 1.0,
      "zoomMax": 10.0
    }
  },
  "ptzPresets": [
    {
      "name": "Entrance",
      "pan": 45,
      "tilt": -10,
      "zoom": 1.5
    }
  ]
}
```

**Effective FOV Calculation**:

```javascript
effectiveFOV = baseFOV / ptz.zoom
direction = ptz.pan // horizontal rotation
elevation = ptz.tilt // vertical angle
```

---

### 5.6 Radar Feature (NEW)

#### 5.6.1 Radar Purpose

**Radar = Real-time 2D Tactical View**:

- Shows all people and cameras in simplified top-down view
- Person selection triggers "ping" animation highlighting their position
- Provides situational awareness during simulation
- Helps operators track movement patterns

#### 5.6.2 Radar UI Component

**Location**:

- **Editor**: Optional toggle (bottom-right floating button)
- **3D Simulation**: Always visible (top-left overlay, above 2D mini-map OR replaces it)

**Layout**:

```
┌──────────────────────────┐
│  RADAR          [−] [×]  │ ← Header with minimize/close
├──────────────────────────┤
│                          │
│    📷  👤   📷           │
│         👤               │ ← Tactical view
│  👤        📷👤          │
│       📷                 │
│                          │
├──────────────────────────┤
│  People: 5  Cameras: 4   │ ← Stats footer
└──────────────────────────┘
```

**Dimensions**:

- Width: 300px
- Height: 300px (square for isometric view)
- Resizable: drag corners (min 200px, max 500px)
- Semi-transparent background with backdrop blur
- Border: 2px solid rgba(255, 255, 255, 0.3)

#### 5.6.3 Radar Visualization

**Camera Indicators**:

- Icon: Small camera symbol (16px) or solid circle with dot (camera lens)
- Color: Camera's assigned color
- FOV Wedge:
  - Simplified cone (not occlusion-aware, just direction + FOV angle)
  - Fill: camera color, opacity 0.1
  - Border: camera color, 1px, opacity 0.4
- Rotation indicator: small arrow extending from camera
- Hover: highlights camera, shows name tooltip

**Person Indicators**:

- Icon: Solid circle (10px diameter)
- Color: Default blue `#4ECDC4`, changes to yellow `#F7DC6F` when selected
- Movement: position updates every frame (smooth interpolation)
- Trail (optional toggle): faint line showing last 5s of movement

**Area Boundaries**:

- Rendered as subtle polygon outlines
- Color: white with opacity 0.2
- Helps contextualize positions

**Grid** (optional toggle):

- Faint grid lines matching editor grid (every 5m)
- Color: rgba(255, 255, 255, 0.1)

#### 5.6.4 Ping Animation (Person Selection)

**Trigger**: Click person in 3D view, or click person indicator in radar

**Animation Sequence**:

1. **Concentric Circles** (radar "ping"):
   - Origin: person's position
   - 3 circles expand outward from person
   - Circle appearance:
     - Stroke: yellow `#F7DC6F`
     - Width: 2px
     - Opacity: starts 1.0, fades to 0 as expands
   - Expansion:
     - Start radius: 0
     - End radius: 50px (scaled to radar view)
     - Duration: 1200ms ease-out
     - Circles released at 0ms, 200ms, 400ms (staggered)

2. **Person Highlight**:
   - Person indicator grows (10px → 14px over 300ms, bounce easing)
   - Color shifts to bright yellow
   - Glow effect (box-shadow: 0 0 20px rgba(247, 220, 111, 0.8))
   - Persists while person is selected

3. **Connection Line** (optional):
   - If person is visible by a camera:
     - Draw dashed line from person to camera(s)
     - Color: camera color
     - Animation: dashes "travel" along line (200ms loop)
     - Shows which cameras currently detect person

**Sound** (optional):

- Subtle "ping" sound effect (sonar-like)
- Volume: 30% of system
- Can be disabled in settings

#### 5.6.5 Radar Interactions

**Click Person Indicator**:

- Selects person
- Triggers ping animation
- Shows person trail in 3D view
- Updates person properties panel (if open)

**Click Camera Indicator**:

- Selects camera
- Highlights camera in 3D view
- Opens camera properties panel

**Drag Radar**:

- If position is not locked, user can drag to reposition
- Snap to corners: top-left, top-right, bottom-left, bottom-right

**Zoom Radar**:

- Mouse wheel over radar: zoom in/out
- Range: 0.5x to 3x
- Pan: click and drag background (shift radar viewport)

**Context Menu** (right-click radar):

- Toggle camera FOV wedges
- Toggle person trails
- Toggle grid
- Lock position
- Reset zoom

#### 5.6.6 Radar Footer Stats

**Always visible at bottom of radar**:

- People count: "People: 5" (all areas or current area if filtered)
- Camera count: "Cameras: 4"
- Detections: "Detections: 12" (total person-camera detection pairs)
- Update rate: Real-time (30 FPS)

---

### 5.7 Real-Time Measurement Tooltips (NEW)

#### 5.7.1 Purpose

Display precise measurements during drawing operations to help users create accurate layouts.

#### 5.7.2 Tooltip Appearance

**Design**:

- Small rectangular tooltip
- Background: rgba(0, 0, 0, 0.85) with backdrop blur
- Text: white, 13px, bold font
- Padding: 6px 10px
- Border-radius: 6px
- Box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3)
- Pointer: small triangle pointing to measurement line

**Position**:

- Follows cursor at offset (12px right, 12px down)
- OR snaps to midpoint of line being drawn (better for longer lines)
- Always within viewport bounds (edge detection)

**Animation**:

- Fade in: 100ms
- Updates: no transition (instant update for responsive feel)
- Fade out: 200ms when drawing completes

#### 5.7.3 Measurement Tooltips by Tool

**1. Area Drawing**:

**Line Preview** (while drawing):

- Current segment (from last vertex to cursor):
  - Line style: **dashed** (dash pattern: 8px dash, 4px gap)
  - Color: primary blue `#4ECDC4`
  - Width: 2px
  - Opacity: 0.8
- Tooltip shows: `"15.3 m"` (distance from last vertex to cursor)
- When hovering near first vertex to close: `"Click to close | Total: 84.2 m"`

**Perimeter Display**:

- After closing polygon: brief toast showing `"Area created • Perimeter: 84.2 m • Area: 245.8 m²"`

**2. Wall Drawing**:

**Line Preview**:

- Current segment:
  - Line style: **solid** (not dashed, more definitive)
  - Color: red `#E63946`
  - Width: shows actual thickness (if thickness = 0.2m, line renders 0.2m thick)
  - Opacity: 0.6
- Tooltip shows: `"12.8 m • 45°"` (length • angle from horizontal)
- When continuing multi-segment wall: cumulative length `"12.
8 m • Total: 38.4 m"`

**3. Shape Drawing**:

**Rectangle**:

- Ghost preview: semi-transparent rectangle at cursor
- Tooltip during drag: `"W: 5.2 m × H: 3.1 m • Area: 16.1 m²"`

**Circle**:

- Ghost preview: semi-transparent circle
- Tooltip: `"Radius: 4.5 m • Diameter: 9.0 m • Area: 63.6 m²"`

**Triangle**:

- Ghost preview: semi-transparent triangle
- Tooltip: `"Base: 6.0 m • Height: 4.2 m • Area: 12.6 m²"`

**Line**:

- Preview: dashed line from start to cursor
- Tooltip: `"8.3 m • 30°"` (length • angle)

**4. Camera Placement**:

**Before Placement**:

- Circular range indicator (FOV depth)
  - Circle diameter = camera depth × 2
  - Stroke: camera color (assigned on hover)
  - Dashed line
  - Opacity: 0.3
- Tooltip: `"Camera • Range: 20 m"`

**After Placement** (adjusting FOV):

- If dragging FOV cone edge to adjust: `"FOV: 75° • Depth: 20 m"`

**5. Person Placement**:

**Before Placement**:

- Circular collision radius preview
  - Filled circle showing person size
  - Color: blue, opacity 0.3
- Tooltip: `"Person • Radius: 0.3 m"`

#### 5.7.4 Additional Measurement Displays

**Angle Guides**:

- When drawing walls, faint guide lines appear at 0°, 45°, 90°, 135°, 180°, etc.
- Snap to these angles if within 5° threshold
- Tooltip updates: `"12.8 m • 45° (snapped)"`

**Distance Markers** (optional, toggled):

- Along longer lines (>20m), show intermediate distance markers
- Small tick marks every 5m with label

**Object-to-Object Distance**:

- When dragging object near another object:
  - Faint line connects edges
  - Tooltip: `"Distance: 2.3 m"` (shortest distance between objects)
- Helps maintain spacing requirements

---

### 5.8 Enhanced Cursor States (Refined)

Building on earlier cursor descriptions, adding more detail:

#### 5.8.1 Default Cursors

- **Arrow** (default): Standard pointer
- **Hand** (Hand mode): `cursor: grab` when hovering map, `cursor: grabbing` when dragging

#### 5.8.2 Drawing Cursors

**Area Drawing**:

- Crosshair: thin cross (12px arms)
- **Circular dot at center**: 12px diameter, filled with `#4ECDC4`, opacity 0.8
- Drop shadow on dot: `0 2px 4px rgba(0,0,0,0.3)`
- Dot pulses subtly (scale 1.0 to 1.1, 1s cycle) to indicate active drawing mode

**Wall Drawing**:

- Crosshair: thin cross
- **Circular dot**: 8px diameter, filled with `#E63946` (red)
- Harder shadow: `0 2px 6px rgba(0,0,0,0.5)` (more definitive)

**Shape Drawing**:

- Crosshair with **ghost preview** of shape at 50% opacity
- Rectangle: cursor shows top-left corner of future rectangle
- Circle: cursor shows center of future circle with radius preview
- Triangle: cursor shows first vertex
- Line: cursor shows start point with 6px dot

**Camera Placement**:

- **Camera icon** (24px SVG): Shows camera symbol
- **Range circle**: Faint dashed circle showing depth range
- Circle follows cursor
- Icon color: next available color from palette
- Cursor "lifts" objects visually (translate-y: -2px, shadow grows)

**Person Placement**:

- **Person icon** (20px SVG): Simple person silhouette
- **Collision radius**: Solid circle (0.3m default) at 30% opacity
- Color: blue `#4ECDC4`

#### 5.8.3 Invalid/Error Cursors

**Outside Area**:

- Standard cursor changes to `not-allowed` (circle with slash)
- **Red tint overlay**: cursor has red color filter
- **Shake animation** on click: cursor shakes horizontally (±4px, 50ms × 3)
- Error toast appears: "Cannot place object outside area boundaries"

**Overlapping Obstacle** (person placement):

- Cursor becomes `not-allowed`
- Ghost person preview turns red
- Tooltip: "Cannot place here - overlaps with obstacle"

**Invalid Wall Extension**:

- When wall would exit area boundary
- Cursor becomes `not-allowed` near boundary edge
- Preview line turns red beyond valid region
- Tooltip: "Wall cannot extend outside area"

#### 5.8.4 Selection Cursors

**Hovering Selectable Object** (Selector mode):

- Cursor: pointer (hand with pointing finger)
- Object highlights:
  - Outline glow (2px, color: accent blue)
  - Opacity increases slightly (+10%)
- Tooltip shows object type + ID after 500ms hover

**Dragging Object**:

- Cursor: `move` (four-directional arrows)
- Object follows with 20ms latency (smooth feel)
- If approaching invalid region: object preview turns red, cursor becomes `not-allowed`

**Resize Handles** (when object selected):

- Corner handles: `nwse-resize`, `nesw-resize` (diagonal arrows)
- Edge handles: `ew-resize`, `ns-resize` (horizontal/vertical arrows)
- Rotate handle (circle at top): custom rotate cursor icon

---

### 5.9 Areas — Mandatory Foundation (Unified)

#### 5.9.1 Area Entity

**Critical Rule**: At least one area must exist before any other objects can be placed.

Each area has:

- id, name (auto area-1, area-2...)
- geometry: polygon (with optional curves → store as control points + baked polygon)
- point count
- style: fill color/opacity, border color/width
- boundaryMode: "strict" (default - nothing can be placed outside)
- color: unique color from palette (for multi-area distinction)

#### 5.9.2 Drawing Modes (Enhanced)

**1. Point Mode** (Click-to-add vertices):

**Visual Design**:

- First click: Shows starting point as **pulsing dot** (10px, primary color)
- Subsequent clicks: Add vertex, previous vertex animates connection
- **Line preview** (from last vertex to cursor):
  - **Dashed line** pattern: `8px dash, 4px gap`
  - Color: primary blue `#4ECDC4`
  - Width: 2px
  - Opacity: 0.8
  - Animated dashes: dashes "flow" toward cursor (subtle movement, 2s loop)

- **Vertices**:
  - Rendered as circles (8px diameter)
  - Filled with white
  - Border: 2px primary color
  - Drop shadow: `0 2px 4px rgba(0,0,0,0.2)`
  - Hover: expands to 10px (scale animation)

- **Closing indication**:
  - When cursor hovers near first vertex (within 10px):
    - First vertex pulses faster and grows (12px)
    - Dashed line from last vertex to first vertex appears
    - Cursor becomes pointer (hand)
    - Tooltip: `"Click to close polygon • Total: 84.2 m"`

- **Measurement tooltip**:
  - Always shows during drawing
  - Position: midpoint of current preview line
  - Content: `"15.3 m"` (current segment length)
  - After 3+ vertices: `"15.3 m • Total: 42.7 m"`

**Keyboard**:

- `ESC`: Cancel area drawing
- `Enter`: Auto-close polygon (connects last vertex to first)
- `Backspace`: Remove last vertex
- `Double-click`: Close polygon

**2. Pen Mode** (Bezier curves):

**Visual Design**:

- Click creates **anchor point** (10px square, rotated 45° → diamond shape)
- **Drag from anchor**:
  - Creates **control handles** (two tangent handles extending from anchor)
  - Handles: 6px circles connected to anchor with thin lines
  - Handle lines: 1px, dashed
  - Dragging handle adjusts curve shape (live preview)

- **Curve preview**:
  - Smooth Bezier curve rendered in real-time
  - Same color/style as Point mode dashed line
  - Higher quality (subpixel rendering)

- **Closing**:
  - Hover first anchor: highlight + tooltip
  - Click or drag to add final curve handle

**Measurement**:

- Tooltip shows: `"Curve length: ~18.4 m"` (approximate arc length)
- Total perimeter after closure

**Conversion**:

- Bezier curves sampled into polyline (1000 points per curve) for physics/collision

**Keyboard**:

- Hold `Shift` while dragging: Constrain handle angles to 45° increments
- Hold `Alt`: Create sharp corner (no curve) at current anchor

#### 5.9.3 Area Constraints (Enhanced)

- Areas must be closed polygons
- Minimum vertices: 3
- **Universal placement rule**: ALL objects (walls, shapes, cameras, people) must be fully inside an area

**Invalid Placement Feedback** (outside area):

- Cursor: `not-allowed` with red tint
- Click triggers:
  - Error toast (bottom-center): `"⚠️ Cannot place object outside area boundaries"`
  - Toast auto-dismisses after 3s
  - Optional: gentle shake animation of viewport (3px horizontal, 100ms)

**Multi-Area Overlap**:

- When areas overlap:
  - Overlapping region shows crosshatch pattern (faint)
  - Placement uses: "active area" (last created or explicitly selected)
  - Active area highlighted with thicker border (4px vs 2px)

#### 5.9.4 First-Time User Experience (Enhanced)

**Empty Scene**:

- Center of viewport shows **large prompt**:

  ```
  ┌────────────────────────────────┐
  │                                │
  │    🗺️  Create an Area to Begin │
  │                                │
  │    Areas define boundaries     │
  │    where objects can be placed │
  │                                │
  │    [ Create Area ]             │
  │                                │
  └────────────────────────────────┘
  ```

  - Semi-transparent card with backdrop blur
  - Button: primary style, animates on hover (grows slightly)
  - Clicking button activates Area tool

**Tutorial Mode** (first time only, dismissible):

- Step-by-step overlay:
  1. "Click to add area vertices"
  2. "Continue clicking to extend"
  3. "Double-click or press Enter to close"
  4. "Great! Now you can add objects inside this area"

- Progress indicator: "Step 1 of 3"
- "Don't show again" checkbox

**After First Area**:

- Subtle confetti animation (3 particles, quick)
- Toast: `"✓ Area created! You can now place objects inside."`
- Other tool buttons animate (brief glow) to indicate they're now enabled

---

### 5.10 Object Creation: Tools (Enhanced)

#### 5.10.1 Selection Tool (Enhanced)

**Workflow**:

- Clicking selects topmost object (z-index priority: People > Cameras > Walls > Shapes > Areas)
- **Multi-select** (Shift+click):
  - Selected objects have blue outline glow
  - Selection count badge appears (top-left): `"3 objects selected"`
  - Bulk actions available: Delete, Duplicate, Group

**Dragging Selected Objects**:

- Must remain fully inside area boundaries
- **Constraint visualization** (when dragging near boundary):
  - Area boundary line turns red where object would exit
  - Object "pushes against" boundary (cursor becomes `not-allowed`)
  - Object snaps to maximum valid position

- **Collision prevention**:
  - People cannot overlap obstacles/people
  - If drag would cause overlap:
    - Ghost preview turns red
    - Object "bounces back" to last valid position on mouse release
    - Error sound (optional)

**Transform Handles** (when object selected):

- **Bounding box**: Dashed rectangle around object
- **Corner handles**: 8px squares, white fill, primary border
  - NW, NE, SW, SE: Resize diagonally
  - Hold Shift: Constrain proportions
- **Edge handles**: 6px circles, midpoint of each edge
  - N, S: Resize vertically
  - E, W: Resize horizontally
- **Rotation handle**: Circle (10px) connected to top edge by 20px line
  - Drag to rotate
  - Shows angle tooltip: `"Rotation: 45°"`
  - Snap to 15° increments (hold Shift for free rotation)

#### 5.10.2 Draw Wall Tool (Enhanced)

**Workflow**:

- Click first point: Wall start (8px red dot appears)
- Mouse move: Preview line extends (solid red, actual thickness)
- **Measurement tooltip**: `"12.8 m • 45°"`
- Click additional points: Continue polyline
- **Double-click**: End wall drawing

**Visual Design**:

- **Current segment preview**:
  - Solid line (not dashed)
  - Color: `#E63946` (red)
  - Width: Matches wall thickness property (default 0.2m)
  - Opacity: 0.6
  - End cap: round

- **Completed segments**:
  - Full opacity (1.0)
  - Slightly darker shade
  - Vertices: 6px circles at junctions

**Angle Snapping** (optional, toggle in settings):

- Snap to: 0°, 45°, 90°, 135°, 180°, etc.
- Snap threshold: 5° proximity
- Visual indicator: Faint guide line at snap angle
- Tooltip: `"12.8 m • 45° (snapped)"`

**Grid Snapping** (if enabled):

- Vertices snap to nearest grid intersection
- Snap distance: 0.5m
- Visual: Small magnet icon near cursor when snap occurs

**Constraints**:

- Entire wall must be inside area
- **If wall would exit area**:
  - Preview line turns red at boundary
  - Line is clipped at boundary (dashed red line beyond)
  - Tooltip: `"Cannot extend outside area • 9.2 m (max)"`
  - Click attempts beyond boundary ignored (error sound)

**Self-Intersection**:

- Allowed (no blocking), but:
  - Intersection points highlighted with warning icon (yellow ⚠️)
  - Tooltip: "Wall intersects itself - may affect simulation"

#### 5.10.3 Draw Shapes Tool (Enhanced)

**Popover on Click**:

- Appears at cursor position
- Glass morphism card (240px × 180px)
- 4 shape options in 2×2 grid:
  ```
  ┌──────────┬──────────┐
  │ Rectangle│  Circle  │
  │    ▭     │    ●     │
  ├──────────┼──────────┤
  │ Triangle │   Line   │
  │    △     │    ―     │
  └──────────┴──────────┘
  ```
- Each cell:
  - Icon: 32px, centered
  - Label below (12px)
  - Hover: background highlight, scale 1.05
  - Keyboard: R, C, T, L

**1. Rectangle**:

**Drawing** (click and drag):

- First click: Sets top-left corner (6px square handle appears)
- Drag: Ghost rectangle extends toward cursor
  - Fill: light gray, opacity 0.3
  - Border: 2px primary color, dashed (8px dash, 4px gap)
- **Measurement tooltip**: `"W: 5.2 m × H: 3.1 m"`
- Release: Rectangle created

**Proportional mode** (hold Shift):

- Constrains to square (W = H)
- Tooltip: `"5.2 m × 5.2 m (square)"`

**Center mode** (hold Alt):

- First click sets center (not corner)
- Rectangle expands from center in all directions

**2. Circle**:

**Drawing**:

- First click: Sets center (6px dot)
- Drag: Ghost circle expands
  - Fill: light gray, opacity 0.3
  - Border: 2px primary, dashed
- **Measurement tooltip**: `"Radius: 4.5 m • Diameter: 9.0 m"`
- Release: Circle created

**3. Triangle**:

**Drawing** (3-click mode):

- Click 1: First vertex
- Click 2: Second vertex (line preview)
- Click 3: Third vertex (triangle closes)
- Ghost triangle preview after 2nd click

**Alternative** (drag mode):

- Click and drag creates equilateral triangle
- Base = drag distance
- Tooltip: `"Base: 6.0 m • Height: 5.2 m"`

**4. Line**:

**Drawing**:

- Click: Start point
- Drag: Line extends
- **Dashed preview**: 8px dash, 4px gap, 2px width
- **Measurement tooltip**: `"8.3 m • 30°"`
- Release: Line created
- Properties: Has thickness (default 0.1m for visibility)

**Angle snapping**: Same as wall tool

**Constraints (All Shapes)**:

- Must be fully inside area
- If resize/drag would exit area:
  - Shape preview turns red
  - Boundary line highlights red
  - Operation clamped to area boundary

#### 5.10.4 Place Camera Tool (Enhanced)

**Device Picker CMDK** (already defined, adding detail):

- Opens centered on screen
- Width: 600px, height: 400px
- Search input: Autofocus
- Camera types list:
  - Each item: Icon (32px) + Name + FOV/Depth specs
  - Hover: Background highlight, shows more details
  - Selected: Press Enter or click

**After Selection**:

- CMDK closes with 200ms fade
- Cursor changes: **Camera icon (24px)** + **range circle**
- Range circle:
  - Diameter = camera depth × 2 (scaled to view)
  - Stroke: Camera's assigned color (from palette)
  - Dashed (12px dash, 6px gap)
  - Rotates slowly (10s per rotation) - subtle animation
  - Opacity: 0.3

**Color Assignment**:

- As soon as camera type selected, next available color assigned
- Color preview: Small colored dot (8px) attached to cursor (top-right of icon)

**Placement**:

- Click inside area: Camera placed
- **Immediate rendering**:
  1. Camera icon appears (filled with camera color)
  2. Direction arrow extends from icon (showing initial direction, default 0°)
  3. FOV wedge/cone renders (camera color, opacity 0.15, border 0.6)
  4. Brief success animation: Camera icon "drops in" (scale 0.8→1.2→1.0, 300ms bounce)

**Post-Placement**:

- Properties panel auto-opens (right slide-over)
- PTZ controls immediately available
- User can adjust direction by dragging FOV wedge edge (live preview)

**Outside Area**:

- Cursor becomes `not-allowed` + red tint
- Range circle turns red
- Click: Error toast `"Cannot place camera outside area"`

#### 5.10.5 Place Person Tool (Enhanced)

**Activation**:

- Click "Place Person" in bottom nav
- Cursor changes: **Person icon (20px silhouette)** + **collision radius circle**
- Collision radius:
  - Diameter = person radius × 2 (default 0.6m)
  - Fill: blue `#4ECDC4`, opacity 0.3
  - Border: 2px solid blue, opacity 0.6

**Validation (Real-Time)**:

- As cursor moves:
  - Check if position is:
    - Inside area: ✓
    - Not on wall/shape: ✓
    - Not overlapping other person: ✓
- **Valid position**:
  - Collision circle: blue
  - Cursor: person icon
- **Invalid position**:
  - Collision circle: red
  - Cursor: `not-allowed`
  - Reason shown in tooltip:
    - "Outside area boundary"
    - "Overlaps with wall"
    - "Too close to another person"

**Placement**:

- Click valid position: Person placed
- Animation:
  - Person appears with fade-in (200ms)
  - Brief pulse animation (scale 1.0→1.15→1.0)
- Person assigned ID (person-1, person-2, etc.)

**After Placement**:

- Person properties panel opens (if Selector mode active)
- Person can be immediately dragged to adjust position

---

## 6) Simulation Analysis — Live Preview (Unified, Enhanced)

### 6.1 Page Header Requirements (Enhanced)

- Title: **"Simulation Analysis"** (24px, bold)
- Description: `• Click a person to select and show trail` (14px, muted color)
- **Mode badge**: Pill badge showing current mode
  - Map Mode: `"🗺️ Map Mode"`
  - Canvas Mode: `"📐 Canvas Mode"`
  - Background: mode-specific color (teal for map, gray for canvas)

### 6.2 Layout Regions (Enhanced)

**1. Top Bar (fixed, height: 64px)**

**Left Section**:

- **Back to Editor** button
  - Icon: arrow-left or X
  - Label: "Back to Editor" or "Close Preview"
  - Switches back to Editor View (no routing)
- **Map/Canvas Mode Toggle** (segmented control)
- **Map Visibility Toggle** (only visible in Map Mode)
  - Switch component
  - Label: "Map View"
  - Icon: map / map-off
  - Default: ON
  - When OFF: map tiles hidden, neutral grid shown

**Center Section**:

- **Area Dropdown** (when multiple areas exist)
  - Width: 200px
  - Shows: Area name + object count
  - Format: `"Area 1 (12 objects)"`
  - Dropdown opens: List of all areas
  - Click area: FlyTo animation (1s ease-out)

**Right Section**:

- **Start Recording** button (toggle)
  - Inactive: `"⏺ Start Recording"` (gray)
  - Active: `"⏹ Stop Recording"` (red, pulsing dot animation)
  - Recording indicator: Timer showing duration `"REC 00:15"`
- **Export Snapshot** button
  - Icon: camera
  - Label: "Snapshot"
  - Click: Captures frame, auto-downloads PNG

**2. Main Viewport (3D View)**

**Layout**:

- Full screen minus top bar (64px) and overlays
- **3D Scene**:
  - Clear sky gradient background (light blue → white)
  - OR: Current map texture as ground (if map visibility ON)
  - Orbit controls: Rotate (drag), Pan (right-click drag), Zoom (scroll)

**Camera FOV Frustums** (3D visualization):

- Each camera renders:
  - **Frustum wireframe**:
    - Edges: Camera's color, 2px width
    - Near plane, far plane, connecting edges
  - **FOV volume**:
    - Semi-transparent planes: Camera color, opacity 0.12
    - Blending mode: additive (overlapping frustums create brighter regions)
  - **Collision surfaces** (if enabled):
    - Wall intersections: Camera color, opacity 0.35, pulsing glow
    - Shape intersections: Camera color, opacity 0.4
    - Floor footprint: Camera color, opacity 0.15, dashed outline

**People**:

- Rendered as capsules (cylinder + hemisphere top)
- Default color: blue `#4ECDC4`
- Selected person: Yellow `#F7DC6F`, with glow effect
- Height: 1.7m (configurable)
- Real-time movement (30 FPS)

**Trail Visualization** (when person selected):

- Trail: Line strip on ground plane
- Color: Yellow (matching selected person)
- Width: 2px
- Length: Last 20 seconds of movement
- Fades at older end (opacity 1.0 → 0.2)

**Lighting**:

- Directional light (sun): From top-front, casts soft shadows
- Ambient light: Subtle, ensures no fully dark areas
- Hemisphere light: Sky color influences overall tone

**3. Top-Left Overlay: Radar (300px × 300px)**

- Always visible (cannot be closed, can be minimized)
- Position: 16px from top-left corner
- Draggable: User can reposition
- Components:
  - Header: "RADAR" + minimize button
  - Tactical 2D view (as detailed in 5.6)
  - Footer stats: People/Cameras/Detections count

**4. PTZ Control Panel (floating, draggable)**

- Position: Bottom-right by default (16px margins)
- Width: 280px, Height: 320px
- Shows selected camera's PTZ controls (as detailed in 5.5)
- Header: Camera name + color dot
- Minimize: Collapses to small floating button (48px × 48px) with camera icon

**5. Right Sidebar (collapsible, width: 360px)**

**Upper Section: Camera List** (scrollable):

- Header: "Cameras (4)" + collapse toggle
- Each camera item (64px height):

  ```
  ┌────────────────────────────────┐
  │ 🎥 cam-1      [PTZ] [Focus]    │  ← Color dot next to name
  │ FOV: 60° • Depth: 20m          │
  │ Detections: 2 🟢               │
  └────────────────────────────────┘
  ```

  - Click name: Opens properties
  - Click `[PTZ]`: Opens PTZ controls for this camera
  - Click `[Focus]`: Centers 3D view on this camera
  - Grouped by area (if multi-area)

**Lower Section: Camera POV Feeds** (grid):

- Header: "Camera Feeds" + grid size toggle (2×2, 3×3, 4×4)
- Each feed tile:

  ```
  ┌─────────────────────────┐
  │ ▒▒▒ Live Feed ▒▒▒       │  ← Camera POV render
  │ ▒▒  📦  ▒▒              │  ← Bounding box on person
  │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒          │
  ├─────────────────────────┤
  │ cam-1 | 2 detections 🔴 │  ← Footer with badge
  └─────────────────────────┘
  ```

  - Border: 3px solid, camera's color
  - Active tile (selected camera): 4px border, glow effect
  - Real-time updates: 30 FPS
  - Bounding boxes:
    - Rectangle overlays on detected people
    - Color: Yellow (for visibility)
    - Label: Person ID (e.g., "P1")
    - Thickness: 2px
  - Click tile: Sets camera as active

---

### 6.3 Map/Canvas Mode in Preview (Enhanced)

**Map Mode**:

- 3D ground plane textured with Mapbox tiles
- Area boundaries: Rendered as subtle vertical semi-transparent planes (0.5m height)
- Map visibility toggle controls texture:
  - ON: Shows live map tiles
  - OFF: Replaces with neutral grid texture

**Canvas Mode**:

- 3D ground plane: Neutral grid texture (1m squares)
- Area boundaries: Colored polygon outlines on ground + subtle vertical lines
- Map visibility toggle: Hidden (no effect since no map)

**Unified Behavior**:

- All simulation identical: Camera FOVs, collisions, people movement
- Mode switch: Smooth transition (fade texture over 400ms)
- No simulation pause required

---

### 6.4 Area Dropdown Behavior (Enhanced)

**Dropdown Design**:

- Trigger button: Shows current area name + icon
- Width: 200px
- Max height: 400px (scrollable if many areas)

**Dropdown Menu**:

- Option: "All Areas" (default if no area selected)
- Divider
- List of areas:
  - Area name (editable inline)
  - Object count: `"(12 objects: 3 cameras, 5 walls, 4 people)"`
  - Color indicator: Area's color dot (8px)
  - Hover: Background highlight

**Selection Behavior**:

- Click area:
  1. Dropdown closes
  2. **FlyTo animation**:
     - Duration: 1000ms
     - Easing: ease-in-out
     - Camera moves to fit area bounds + 20% padding
     - Smooth arc trajectory (not linear)
  3. 3D view focuses on selected area
  4. Optional: Dim objects outside selected area (opacity 0.3)

**Single Area Scene**:

- Dropdown hidden
- No dropdown rendered

---

### 6.5 3D Simulation Engine (Enhanced)

**Engine**: Three.js r150+

**Scene Setup**:

- Renderer: WebGLRenderer with antialias
- Color space: sRGB
- Shadows: Enabled (soft shadows, VSM preferred)
- Post-processing (optional):
  - Bloom effect for glows
  - SSAO for depth (subtle)

**World Generation**:

**1. Ground Plane**:

- Geometry: PlaneGeometry (1000m × 1000m, large enough for all areas)
- Material:
  - Map Mode (map visible): TextureLoader with Mapbox static tile
  - Map Mode (map hidden): Grid texture (1m squares)
  - Canvas Mode: Grid texture
- Receives shadows

**2. Area Boundaries**:

- Vertical semi-transparent walls at area edges
- Geometry: ExtrudeGeometry from area polygon (0.5m height)
- Material: MeshStandardMaterial
  - Color: Area color
  - Opacity: 0.25
  - Transparent: true
  - Side: DoubleSide
- Helps define simulation boundaries visually

**3. Walls**:

- Geometry: BoxGeometry (length × thickness × height)
- Material: MeshStandardMaterial
  - Color: Wall color (default gray)
  - Roughness: 0.8
  - Metalness: 0.1
- Casts and receives shadows

**4. Shapes**:

- Rectangle: BoxGeometry
- Circle: CylinderGeometry
- Triangle: ExtrudeGeometry from triangle path
- Line: BoxGeometry (length × thickness × height)
- Materials: Similar to walls, with user-defined colors

**5. Cameras**:

- Model: Simple mesh (box body + cone lens)
- Material: MeshStandardMaterial with camera color
- Emissive: Camera color (subtle glow)
- Height: Elevated on cylinder stand
- Direction indicator: Arrow mesh extending forward

**6. People**:

- Geometry: CapsuleGeometry (radius × height) OR Cylinder + Sphere
- Material: MeshStandardMaterial
  - Default color: blue
  - Selected: yellow with emissive glow
- Animation: Position updates every frame (smooth interpolation)

**Controls**:

- OrbitControls from Three.js
- Target: Scene center OR selected object
- Min distance: 5m
- Max distance: 500m
- Damping: Enabled (feels smooth)
- Auto-rotate: Optional (disabled by default)

**Focus Selection** (double-click person or camera):

- Animates camera to focus on object
- Target: Object position
- Distance: 10m from object
- Duration: 800ms ease-out

---

### 6.6 Physics & Movement (Enhanced)

**People Movement Algorithm**:

**1. Steering Behaviors** (recommended implementation):

- Each person has:
  - Position (x, y)
  - Velocity (vx, vy)
  - Desired direction (wander behavior)
  - Speed (m/s, configurable)

**2. Forces Applied** (per frame):

- **Wander force**: Random direction bias (smooth noise)
- **Obstacle avoidance**: Repulsion from nearby walls/shapes
  - Ray-cast ahead (3m), if hit obstacle: steer away
  - Force proportional to proximity
- **Person avoidance**: Repulsion from other people
  - If within 2m: apply repulsion force
  - Magnitude: Inverse square of distance
- **Area boundary constraint**: Hard constraint (highest priority)
  - If within 1m of boundary: strong repulsion force
  - If at boundary: velocity clamped to stay inside

**3. Velocity Integration**:

```javascript
// Pseudo-code
function updatePerson(person, dt) {
  let force = Vector2.zero
  force.add(wanderForce(person))
  force.add(avoidObstacles(person))
  force.add(avoidPeople(person))
  force.add(stayInArea(person))

  person.velocity.add(force.multiply(dt))
  person.velocity.clampMagnitude(person.speed)

  let newPos = person.position.add(person.velocity.multiply(dt))

  // Hard clamp to area boundary
  if (!areaContains(newPos)) {
    newPos = clampToArea(newPos)
    person.velocity.reflect(areaNormal(newPos))
  }

  person.position = newPos
}
```

**4. Collision Detection**:

- Use spatial hash grid (10m × 10m cells)
- Only test nearby objects
- Continuous collision detection: Sweep test for high-speed movement

**Deterministic Simulation** (for recording reproducibility):

- Seed random number generator
- Fixed timestep (16.67ms = 60 FPS)
- Seed stored in scene export: `"simulationSeed": 12345`

**Trail Recording**:

- Each person stores last N positions (N = 20s × 30 FPS = 600 positions)
- Ring buffer for efficiency
- Trail rendered as LineGeometry with varying opacity

---

### 6.7 Camera Vision Requirements (Enhanced)

**Visibility Pipeline**:

**1. Frustum Culling (Broad Phase)**:

- Compute camera frustum from:
  - Position (x, y, height)
  - Direction (pan angle)
  - Elevation (tilt angle)
  - FOV (horizontal)
  - Depth (far plane)
  - Zoom (affects effective FOV)
- Test each person: Is person's position inside frustum?
  - If NO: person not visible, skip
  - If YES: proceed to narrow phase

**2. Occlusion Testing (Narrow Phase)**:

- For each person in frustum:
  - **Ray-cast** from camera position to person position
  - Check intersections with:
    - Walls (segments with thickness)
    - Shapes (polygon/circle obstacles)
    - Area boundaries (if person in different area)
  - For each intersection:
    - **Height check**:
      - Ray height at intersection = `cameraHeight + (personHeight - cameraHeight) * t`
      - Where `t` = intersection distance / total distance
      - If obstacle height >= ray height: **OCCLUDED**
      - Else: Continue ray

- If ray reaches person without full occlusion: **VISIBLE**

**3. Bounding Box Computation** (for POV feeds):

- Create virtual Three.js PerspectiveCamera for each camera entity
- Set camera parameters:
  - Position: camera (x, y, height)
  - Rotation: (tilt, pan, 0)
  - FOV: baseFOV / zoom
  - Aspect: POV feed aspect ratio
  - Near: 0.1m
  - Far: camera depth

- For each visible person:
  - Get person's 3D bounding box (capsule bounds)
  - Project 8 corners of bounding box to camera view
  - Find min/max X, Y in screen space
  - Result: Bounding rectangle (x, y, width, height)

**4. POV Feed Rendering**:

- Each camera renders to RenderTarget (texture)
- Resolution: 720p default (scalable)
- Update rate: 30 FPS (adjustable)
- Post-process: Overlay bounding boxes on canvas/SVG layer

**Collision Surfaces (3D View)**:

- Use Three.js Raycaster
- Cast rays from camera in FOV cone (400-1000 rays)
- For each ray:
  - Find first intersection with obstacles
  - Create quad at intersection point:
    - Position: intersection point
    - Normal: intersection surface normal
    - Size: Adaptive (based on distance and ray density)
    - Material: Camera color, opacity 0.35, emissive

- Merge quads into single geometry per camera (for performance)

---

### 6.8 Recording (Enhanced)

**Start Recording**:

- Click "Start Recording" button
- UI changes:
  - Button: Red background, pulsing animation
  - Label: "Stop Recording"
  - Timer: Appears showing `"REC 00:00"` (MM:SS format)
  - Red dot icon: Pulsing (scale 1.0 ↔ 1.2, 1s cycle)

**Recording Implementation**:

```javascript
// Pseudo-code
const canvas = renderer.domElement
const stream = canvas.captureStream(30) // 30 FPS
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp9',
  videoBitsPerSecond: 8000000, // 8 Mbps
})

mediaRecorder.ondataavailable = (event) => {
  recordedChunks.push(event.data)
}

mediaRecorder.start()
```

**During Recording**:

- Timer updates every second
- Simulation continues normally
- User can:
  - Change camera focus (recorded)
  - Adjust PTZ (recorded)
  - Switch areas (recorded)
  - Toggle map visibility (recorded)
- Performance: Maintain 30 FPS minimum (show warning if drops below)

**Stop Recording**:

- Click "Stop Recording"
- MediaRecorder stops
- Blob created from chunks
- Auto-download:
  - Filename: `simulation_YYYY-MM-DD_HH-MM-SS.webm`
  - User can also choose "Save As"

**Recording Indicator** (always visible during recording):

- Top-right corner: Red dot + "REC" + timer
- Subtle red border around entire viewport (2px, opacity 0.6)

**Optional Features**:

- **Timestamp overlay**: Burned into video (top-left, small font)
- **Camera info overlay**: Shows camera name when PTZ adjusted
- **Quality presets**: 720p/1080p/4K selection before recording

---

### 6.9 Snapshot Export (Enhanced)

**Snapshot Button**:

- Location: Top bar, right section
- Icon: Camera
- Label: "Snapshot"

**Click Behavior**:

- Freezes current frame
- Renders at high resolution:
  - Default: 2× current viewport resolution
  - Optional: User selects (1×, 2×, 4×) in dropdown

**Rendering**:

```javascript
// Pseudo-code
const originalSize = renderer.getSize(new Vector2())
const scale = 2
renderer.setSize(originalSize.x * scale, originalSize.y * scale)
renderer.render(scene, camera)

// Get image data
const dataURL = renderer.domElement.toDataURL('image/png')

// Download
const link = document.createElement('a')
link.download = `snapshot_${timestamp}.png`
link.href = dataURL
link.click()

// Restore original size
renderer.setSize(originalSize.x, originalSize.y)
```

**Post-Snapshot**:

- Brief flash effect (white overlay, 100ms)
- Success toast: `"✓ Snapshot saved"`
- File auto-downloads

**Optional Features**:

- **Include overlays**: Option to include/exclude Radar and PTZ panel in snapshot
- **Annotations**: Quick annotation mode before export (draw arrows, add text)

---

## 7) Enhanced Data Model (With New Fields)

### 7.1 Scene Root (Updated)

```json
{
  "version": "1.1",
  "mode": "map|canvas",
  "mapVisible": true,
  "units": "meters",
  "origin": {
    "lat": 0,
    "lng": 0,
    "description": "Geographic reference point"
  },
  "simulationSeed": 12345,
  "areas": [ ... ],
  "walls": [ ... ],
  "shapes": [ ... ],
  "cameras": [ ... ],
  "people": [ ... ],
  "meta": {
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601",
    "mapStyle": "satellite|street|traffic|osm",
    "radarEnabled": true,
    "collisionVisualizationEnabled": true
  }
}
```

### 7.2 Enhanced Entities

#### Camera (with PTZ and Color)

```json
{
  "id": "camera-1",
  "type": "camera",
  "areaId": "area-1",
  "typePreset": "basic",
  "x": 10,
  "y": 10,
  "height": 2.5,
  "direction": 90,
  "fov": 60,
  "depth": 20,
  "zoom": 1.0,
  "nearClipping": 0.1,
  "resolution": {
    "width": 1280,
    "height": 720
  },
  "color": "#FF6B6B",
  "ptz": {
    "pan": 90,
    "tilt": 0,
    "zoom": 1.0,
    "limits": {
      "panMin": 0,
      "panMax": 360,
      "tiltMin": -45,
      "tiltMax": 90,
      "zoomMin": 1.0,
      "zoomMax": 10.0
    }
  },
  "ptzPresets": [
    {
      "name": "Entrance",
      "pan": 45,
      "tilt": -10,
      "zoom": 1.5
    }
  ],
  "showCollisions": true
}
```

#### Person (with Trail)

```json
{
  "id": "person-1",
  "type": "person",
  "areaId": "area-1",
  "x": 15,
  "y": 15,
  "radius": 0.3,
  "height": 1.7,
  "speed": 1.2,
  "behavior": "roam",
  "trailEnabled": false,
  "trailLength": 20,
  "trailHistory": []
}
```

#### Area (with Color)

```json
{
  "id": "area-1",
  "type": "area",
  "name": "Main Floor",
  "geometry": {
    "type": "polygon",
    "coordinates": [[x1,y1], [x2,y2], ...],
    "bezierControls": []
  },
  "pointCount": 5,
  "color": "#4ECDC4",
  "style": {
    "fillColor": "#rgba",
    "fillOpacity": 0.2,
    "borderColor": "#rgba",
    "borderWidth": 2
  },
  "boundaryMode": "strict"
}
```

---

## 8) Implementation Roadmap

### Phase 1: Core Editor (Weeks 1-3)

- [ ] Map/Canvas mode toggle
- [ ] Area creation with measurement tooltips
- [ ] Wall/shape drawing with enhanced cursors
- [ ] Object placement with validation
- [ ] Properties panels
- [ ] Undo/redo system

### Phase 2: Camera System (Weeks 4-5)

- [ ] Camera color assignment
- [ ] FOV rendering in editor
- [ ] Device picker CMDK
- [ ] Basic PTZ controls in editor
- [ ] Properties panel integration

### Phase 3: 3D Simulation (Weeks 6-8)

- [ ] Three.js scene setup
- [ ] 3D geometry generation
- [ ] Camera frustum visualization
- [ ] **3D FOV collision rendering**
- [ ] Basic people movement
- [ ] Orbit controls

### Phase 4: Advanced Features (Weeks 9-10)

- [ ] **Per-camera PTZ controls in simulation**
- [ ] **Radar feature with ping animations**
- [ ] People collision avoidance
- [ ] Trail visualization
- [ ] Camera POV feeds

### Phase 5: Recording & Polish (Weeks 11-12)

- [ ] Recording functionality
- [ ] Snapshot export
- [ ] Performance optimization
- [ ] UI polish and animations
- [ ] Documentation

---

## 9) QA: Enhanced Acceptance Criteria

### Camera Features

- [ ] Each camera has unique color from palette
- [ ] Camera colors visible in: editor FOV, 3D frustum, POV tile border, radar
- [ ] PTZ controls adjust camera direction/tilt/zoom in real-time
- [ ] PTZ presets save and load correctly
- [ ] 3D FOV collision surfaces render on walls/shapes
- [ ] Collision surfaces update when camera moves or obstacles change
- [ ] Collision visualization toggle works

### Measurement Tooltips

- [ ] Area drawing shows current segment length
- [ ] Wall drawing shows length and angle
- [ ] Shape drawing shows dimensions (W×H, radius, etc.)
- [ ] Tooltips follow cursor or snap to midpoint
- [ ] Tooltips disappear when drawing completes

### Radar

- [ ] Radar shows all people and cameras in 2D
- [ ] Clicking person triggers ping animation (3 expanding circles)
- [ ] Person indicator highlights (yellow, grows, glows)
- [ ] Camera indicators show FOV wedges in radar color
- [ ] Radar stats footer updates in real-time
- [ ] Radar can be dragged and resized

### Cursor States

- [ ] Area drawing cursor: crosshair + 12px blue dot
- [ ] Wall drawing cursor: crosshair + 8px red dot
- [ ] Invalid placement cursor: not-allowed + red tint
- [ ] Camera placement cursor: camera icon + range circle
- [ ] All cursors match specifications

### Drawing Lines

- [ ] Area polygon lines are dashed (8px dash, 4px gap)
- [ ] Wall preview lines are solid with actual thickness
- [ ] Shape previews show dashed borders
- [ ] All dashed lines have smooth animations
