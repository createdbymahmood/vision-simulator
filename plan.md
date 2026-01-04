# Updated PRD — Computer Vision Simulator Application

## Product Name: Computer Vision Simulator

## Live Preview Title: **Simulation Analysis**

## Platforms: Web (desktop-first)

## View Modes: **Map Mode** (primary editor) with **Canvas Mode Toggle** (removes map styling)

## Primary Outputs: Real-time simulation + camera POV feeds + recording + snapshots + scene export

---

## 0) Executive Summary

We are building an interactive simulation tool that lets users:

1. Design an environment in **Map Mode** (Mapbox-based) with **Canvas Mode** as a simplified view (same editor, map styles removed)
2. Place **areas, walls, shapes, cameras, people**
3. Run a live simulation with:
   - **Real-time agent motion** with collision avoidance
   - **Realistic camera visibility** (occlusion, height, FOV, depth, zoom)
   - **3D world preview** (default) with optional 2D preview overlays
   - Multi-camera **CCTV-like POV feeds**

4. Export:
   - **Recording** (video capture of 3D view)
   - **Snapshot** (screenshot of 3D)
   - **Scene Export** (JSON)

**Key Architecture Decision**: Everything is built in Map Mode. Canvas Mode is simply Map Mode with map tiles/styling disabled, showing a neutral grid background instead. This unified approach means:

- Single codebase for all editing features
- Area constraints apply universally (areas become mandatory boundaries)
- Switching between modes only toggles map visibility, not functionality

---

## 1) Users, Personas, Jobs-to-be-Done

### 1.1 Personas

- **Security Designer**: Plans camera placement for coverage, blind spots, and obstructions.
- **Operations Engineer**: Validates device constraints and coverage in real environments (Map Mode).
- **Analyst / Stakeholder**: Reviews recorded simulation outputs and snapshots.
- **Product/Integrator**: Uses exported scene JSON to integrate simulation results elsewhere.

### 1.2 Primary JTBD

- "When I design an environment, I want to see which people each camera can detect, so I can validate camera placement and configuration before deployment."

---

## 2) Scope

### 2.1 In Scope (MVP+)

- **Unified Map-based editor** with Canvas Mode toggle (removes map styling)
- **Areas** as mandatory spatial boundaries (all objects must be inside areas)
- Drawing tools: walls, shapes, device placing, people placing
- Full selection + property editing (instant apply)
- Undo/redo for _all_ edits
- Live preview / simulation:
  - **3D view** (default) with camera feeds
  - **Map visibility toggle** (shows/hides map tiles)
  - **2D overlay** showing camera cones + people movement
  - Multi-camera POV feeds (CCTV tiles)

- Recording + snapshot
- Export JSON

### 2.2 Explicit Non-Goals (for now)

- Multiplayer collaboration
- Photorealistic rendering (we want "realistic enough", but not cinematic)
- ML inference (no actual CV models—only visibility simulation & bounding boxes)
- Account system / backend (unless required later)
- True "canvas-only" mode with infinite boundaries (areas are always required)

---

## 3) Product Requirements: High-Level

### 3.1 Consistency Rules (Global)

- **Selection mode** governs whether items are selectable
- **Areas are mandatory**: All objects (walls, shapes, cameras, people) must be placed inside defined areas
- Clicking "blank space" closes:
  - Properties panels
  - Popovers
  - CMDK dialogs
  - Area management popovers

- Bottom nav and top nav are **fixed** and always visible
- Entire app uses **100vh height, 100% width**

### 3.2 Object Categories

- **Spatial Boundaries**: areas (mandatory first step)
- **Structural**: walls, shapes
- **Actors**: people
- **Devices**: cameras (plus processors as placeholders in device picker)

### 3.3 Interaction Categories

- Define areas (required first)
- Create: draw/place objects (within areas)
- Select: pick object
- Modify: drag/resize/rotate and edit properties
- Simulate: run live preview
- Export: record/snapshot/scene export
- History: undo/redo

---

## 4) Information Architecture & Navigation

### 4.1 Top-Level Routes

- `/editor` (Unified Map Editor)
- `/editor/preview` (Simulation Analysis)

### 4.2 Mode Switching

- **Map/Canvas Toggle** in top panel:
  - **Map Mode** (default): Shows Mapbox tiles with all editing features
  - **Canvas Mode**: Same editor with map tiles hidden, neutral grid background shown
  - Toggle is purely visual—all functionality remains identical
  - Areas remain visible and enforced in both modes

---

## 5) Unified Editor PRD (Map-Based with Canvas Mode)

### 5.1 Editor Layout (UI Regions)

1. **Top Panel (fixed)**
   - **Map/Canvas Mode Toggle** (new)
   - Edit Mode toggle
   - Clear Board
   - Undo
   - Redo
   - Export
   - Live Preview

2. **Main Viewport**
   - Mapbox map (Map Mode) OR neutral grid (Canvas Mode)
   - Pan/zoom controls
   - Optional snap-to-grid (recommended)
   - Optional measurement overlay (recommended)

3. **Bottom Navigation (fixed)**
   1. Mode popover: Hand mode / Selector mode
   2. **Create Area** tool (required first step)
   3. Draw wall
   4. Draw shapes (popover: rectangle/line/circle/triangle)
   5. Place device (CMDK dialog)
   6. Place person

4. **Right Sidebar Vertical Buttons (fixed)**
   1. Search location
   2. Area management
   3. Map view mode popover (Map Mode only)
   4. Devices in use

5. **Properties Panel (contextual, right slide-over)**
   - Appears when selecting an object (selection mode on)
   - Applies changes instantly (no save)

---

### 5.2 Map/Canvas Mode Toggle Behavior

**Map Mode (Default)**

- Shows Mapbox tiles with selected style (satellite/street/traffic/OSM)
- Areas drawn on real-world geography
- Location search and geocoding active
- Map style picker visible

**Canvas Mode**

- Map tiles hidden
- Neutral grid background displayed (checkered or subtle grid)
- Areas remain visible as boundary polygons
- All editing tools function identically
- Map style picker hidden (but setting preserved)
- Location search hidden
- Coordinates still geo-referenced but appear as abstract grid

**Switching Behavior**

- Toggle preserves all objects and their positions
- No data transformation needed
- Smooth visual transition
- Mode preference saved in scene export

---

### 5.3 Coordinate System & Units

- World coordinate system in **meters** (2D)
- Geo-referenced coordinates (lat/lng) stored internally but presented as meters in UI
- Origin anchored to first area created or scene center
- Property panel always shows:
  - X and Y in meters (relative to scene origin)
  - Rotation degrees (0–360)

- Rendering scale factor (px per meter) internal; never leaks into UI

---

### 5.4 Areas — Mandatory Foundation (Unified)

#### 5.4.1 Area Entity

**Critical Rule**: At least one area must exist before any other objects can be placed.

Each area has:

- id, name (auto area-1, area-2...)
- geometry: polygon (with optional curves → store as control points + baked polygon)
- point count
- style: fill color/opacity, border color/width
- boundaryMode: "strict" (default - nothing can be placed outside)

#### 5.4.2 Drawing Modes

1. **Click-to-point polygon**
   - Click adds vertex
   - Ghost line previews closure
   - Double-click closes polygon
   - Minimum 3 vertices required

2. **Pen tool (Photoshop-like)**
   - Click to add anchor
   - Drag to create Bezier handles
   - Curves are sampled into polyline for rendering & physics
   - Double-click closes polygon

#### 5.4.3 Area Constraints

- Areas must be closed polygons
- Minimum vertices: 3
- **Universal placement rule**: ALL objects (walls, shapes, cameras, people) must be fully inside an area
- Cursor becomes `not-allowed` outside areas
- Click outside areas produces "Invalid placement - create an area first" feedback
- If multiple overlapping areas:
  - Placement uses the topmost/active area
  - Or user must explicitly select target area

#### 5.4.4 First-Time User Experience

- On empty scene: prominent prompt "Create an area to begin"
- Create Area tool auto-activates or highlights
- After first area created: other tools become enabled
- Tutorial tooltip (dismissible): "Areas define where you can place objects"

---

### 5.5 Object Creation: Tools

#### 5.5.1 Selection Tool

**Workflow**

- Clicking selects topmost object under cursor (z-index rules below)
- Multi-select optional (Shift+click recommended)
- Dragging selected objects moves them with constraints:
  - Must remain fully inside area boundaries
  - People cannot overlap obstacles/people
  - Cameras cannot be inside walls/shapes

**Constraint Enforcement**

- If drag would move object outside area: snap to area boundary or reject move
- Visual feedback: object becomes red/highlighted when invalid position attempted

#### 5.5.2 Draw Wall Tool

**Workflow**

- Click first point → start wall segment (must be inside area)
- Mouse move previews segment
- Click additional points continues wall polyline
- Double-click ends drawing
- Walls stored as segments or polyline entity

**Properties**

- Start (x1,y1), End (x2,y2) for segments
- Height (m), Thickness (m)
- Material preset (optional): "drywall", "concrete"
- Color + opacity

**Constraints**

- Entire wall path must be inside an area
- If wall would exit area: show warning and trim at boundary OR reject segment
- Walls snap to grid (optional toggle)
- Zero-length segments prevented

#### 5.5.3 Draw Shapes Tool

Popover choices: Rectangle, Circle, Triangle, Line

**Shared Editor Behaviors**

- Must be placed entirely inside an area
- Click-and-drag to size (or click to place default size)
- Handles for resize/rotate
- Sidebar updates live

**Properties**

- Circle: x, y, rotation, width, length, color, opacity, height(m)
- Rectangle: same
- Triangle: same
- Line: x, y, rotation, length, color, opacity, thickness, height(m)

**Constraints**

- Shape must fit fully within area boundary
- If resize/rotate would exit area: clamp to boundary or reject
- Shapes block camera vision by default

#### 5.5.4 Place Camera Tool

**Workflow**

- Open device picker CMDK
- Select camera type (basic/wide/telephoto/panoramic/indoor/outdoor)
- Cursor changes to placement mode
- Click inside area to place camera
- Cannot place outside area
- On placement: camera gets default config based on type
- Immediately render:
  - Camera icon
  - Direction indicator
  - Vision cone polygon (occlusion-aware)

**Properties**

- x, y (in meters relative to origin)
- direction (deg)
- FOV (deg) - constrained by camera type
- depth (m)
- height (m)
- zoom (unitless or optical zoom factor)
- near clipping (default 0.1m)
- camera type preset

**Camera Type Presets**

- Basic: FOV 60°, depth 20m, height 2.5m
- Wide Angle: FOV 120°, depth 15m, height 2.5m
- Telephoto: FOV 30°, depth 50m, height 3m
- Panoramic: FOV 180°, depth 25m, height 3m
- Indoor: FOV 90°, depth 15m, height 2.5m
- Outdoor: FOV 75°, depth 40m, height 4m

**Vision Rendering**

- Vision polygon computed as set of rays clipped by obstacles
- Must update on:
  - Camera property change
  - Obstacle movement/creation/deletion
  - (In preview only: people movement impacts detections, not polygon)

#### 5.5.5 Place Person Tool

**Workflow**

- Click inside area to place person
- Person appears as circle/marker with collision radius
- Cannot place outside areas
- Cannot place on walls/shapes/lines or overlapping other people

**Properties**

- x, y (in meters)
- radius (default 0.3m)
- height (default 1.7m)
- speed (m/s, default 1.2)
- movement mode (preview): random roam within area constraints

**Constraints**

- Must be placed inside an area
- Cannot place inside walls/shapes/solid lines
- Cannot overlap other people at placement time
- Resolve conflicts by nudging or rejecting placement

---

### 5.6 Object Selection & Z-Ordering

When clicking (Selector mode active):

1. People (top priority)
2. Cameras
3. Walls (segments)
4. Shapes
5. Areas
6. Background/map (no selection)

Provide "selection cycle" shortcut (Tab) to iterate through stacked objects.

---

### 5.7 Properties Panel (Unified)

**General**

- Title: object type + ID (e.g., "Camera • cam-3")
- Live-updating values; change triggers immediate render & history command
- Close on outside click, nav click, or ESC

**Field Requirements**

- Numeric fields: step increments, min/max
- Angle: slider + number input
- Color: picker + opacity slider
- Validate and clamp values

**Examples**

- Camera: direction 0–360, FOV 1–180 (constrained by type), depth >=0, height >=0
- Person: speed >=0, radius >0, height >0
- Shape: width/length >0, height >=0
- Area: name (text), point count (read-only), style controls

**Area Properties**

- Name (editable)
- Point count (display)
- Fill color + opacity
- Border color + width
- "Edit Geometry" button (re-enters area drawing mode for that area)
- Delete button (with confirmation if contains objects)

---

### 5.8 History System (Undo/Redo)

**Scope: Everything**

- Area creation, deletion, editing
- Object creation, deletion
- Movement and transform changes
- Property edits (debounced commits after 300ms idle)

**Implementation Requirement**

- Command-based operations: `do()` and `undo()`
- Serializable diffs recommended
- History stack size: 200 operations (configurable)
- History persists across Map/Canvas mode switches

---

### 5.9 Right Sidebar Vertical Buttons

#### 1. Search Location (Map Mode only)

- CMDK prompt: type city/country
- Uses Mapbox geocoding
- On selection: flyTo location
- Hidden in Canvas Mode

#### 2. Area Management (Always visible)

- List view:
  - Area name
  - Point count
  - Object count inside area
- Click area:
  - Map/view flies to fit bounds of area
  - Selects area for editing
- "Add Area" quick button
- Collapsible sections

#### 3. Map View Mode Popover (Map Mode only)

- Satellite
- Street
- Traffic
- OSM Mapnik
- Hidden in Canvas Mode

#### 4. Devices in Use (Always visible)

- Group by area (collapsible sections)
- Each device item:
  - Icon
  - Name/type
  - Click selects on map/canvas & opens properties
- Shows count badges per area
- Filter: cameras only / all devices

---

### 5.10 Device Picker (CMDK)

Triggered from bottom nav "Place Device" tool.

**CMDK Contents**

- Search input
- Sections:
  - Cameras (6 types)
  - Processors (placeholder for future)
  - Recent

**Camera Types** (as specified in 5.5.4)

**Processor Types** (Future)

- Edge processor
- Central processor
- (These don't place anything yet, just appear in picker)

When user selects camera type:

- CMDK closes
- Cursor changes to placement mode with camera icon
- Click inside area places camera with type defaults
- Click outside area shows "Invalid placement" feedback

---

### 5.11 Clear Board

- Prompts confirmation
- Clears:
  - All areas (and consequently all objects inside)
  - History resets
- Returns to "Create an area to begin" state

---

### 5.12 Export (Editor)

Export options:

1. **Scene JSON**
   - Includes mode preference (map/canvas)
   - All entities with geo-referenced coordinates
   - Area definitions
   - Version metadata

2. **Scene Image** (top-down raster)
   - Current view (map tiles or grid depending on mode)
   - All objects rendered
   - High resolution option (2x)

3. **Bundle Export** (future)
   - JSON + any reference assets

---

## 6) Simulation Analysis — Live Preview (Unified)

### 6.1 Page Header Requirements

- Title: **Simulation Analysis**
- Description: `• Click a person to select and show trail`
- **Mode badge**: Shows current mode (Map/Canvas)

### 6.2 Layout Regions

1. **Top bar (fixed)**
   - **Map/Canvas Mode Toggle** (same as editor)
   - **Map Visibility Toggle** (default ON)
     - Label: "Map View"
     - When OFF: map tiles hidden, neutral grid shown
     - Independent of Map/Canvas mode setting
   - **Area Dropdown** (when multiple areas exist)
   - Start Recording (toggle)
   - Export Snapshot

2. **Main Viewport**
   - **3D world view** (default, always primary)
   - Orbit controls (rotate, pan, zoom)
   - Person selection with trail highlighting

3. **Top-Left Overlay (always visible)**
   - **2D Mini-Map**: Shows camera layouts + FOV cones + people positions in real-time
   - Synchronized with 3D view
   - Click to focus camera on area

4. **Right Sidebar (collapsible)**
   - **Upper Section**: Camera list
     - Grouped by area
     - Shows visibility status
     - Click to focus 3D view on camera
   - **Lower Section**: Camera POV tiles grid
     - Live CCTV feeds (N cameras = N tiles)
     - Bounding boxes overlaid when person visible
     - Tile shows camera name + detection count

---

### 6.3 Map/Canvas Mode in Preview

**Map Mode**

- 3D world rendered with map texture on ground plane
- Area boundaries visible on ground
- Map visibility toggle controls map texture

**Canvas Mode**

- 3D world rendered with neutral grid on ground plane
- Area boundaries visible as subtle edge lines
- Map visibility toggle has no effect (already neutral)

**Unified Behavior**

- All simulation logic identical
- Camera feeds identical
- 2D overlay mini-map works in both modes
- Mode can be switched mid-simulation without disruption

---

### 6.4 Area Dropdown Behavior

**When Multiple Areas Exist**

- Dropdown appears in top bar
- Lists all areas with object counts
- Default: "All Areas" OR nearest area to view when preview opened
- Changing selection:
  - Smooth flyTo animation to area bounds
  - Focuses 3D view on selected area
  - Filters camera feeds to cameras in that area (optional)
  - People movement respects area boundaries

**Single Area Scene**

- Dropdown hidden
- No selection needed

---

### 6.5 3D Simulation Engine Requirements

**Engine**: Three.js

**World Generation**

- Extrude 2D walls/shapes into 3D geometry using each object's height
- Floor plane:
  - Map Mode: textured with Mapbox tiles OR neutral when map visibility off
  - Canvas Mode: neutral grid texture
- Area boundaries rendered as:
  - Subtle vertical planes (semi-transparent walls at area edges)
  - OR ground-level outline highlighting
- Lighting: directional + ambient for depth cues

**Controls**

- Orbit controls:
  - Rotate around focus point
  - Pan
  - Zoom in/out
  - Min/max zoom limits
- Focus selection:
  - Selecting person centers camera on them
  - Double-click to refocus

---

### 6.6 Physics & Movement Requirements

**People Movement**

- People move continuously within their area boundaries
- Avoid:
  - Area edges (cannot cross)
  - Walls
  - Shapes
  - Other people

**Collision Model**

- People: circles (2D) with radius, capsule in 3D
- Walls: segments with thickness → capsule/rect collision
- Shapes: polygon obstacles / circle obstacles
- Area boundaries: polygon edges (hard constraint)

**Motion Planning**

- Steering behaviors + velocity obstacle avoidance (recommended)
- OR navigation mesh (advanced)
- Must avoid getting stuck in corners
- Smooth path following
- Speed limits: configurable per person, default 1.2 m/s

**Constraints**

- People cannot tunnel through walls at high speed
  - Use continuous collision detection or small timestep (0.016s)
- Deterministic simulation (seeded random) for reproducible recordings
- Area boundary is absolute constraint (highest priority)

**Trail Requirement**

- When person clicked:
  - Highlight selected (distinct color/glow)
  - Show trail (path history for last 20 seconds)
  - Trail rendered as line strip on ground plane
  - Trail color matches person highlight

---

### 6.7 Camera Vision Requirements (Core)

**Vision Frustum**

- Position (x, y, height)
- Direction (yaw)
- FOV (horizontal, in degrees)
- Depth (max distance in meters)
- Zoom (affects effective FOV and projection)
- Near clipping (default 0.1m)

**Occlusion System**

#### 2D Occlusion (Top-Down)

Compute visible polygon for each camera:

- Cast N rays (400–2000 rays depending on performance)
- Ray angles span `direction ± FOV/2`
- For each ray:
  - Find closest intersection with obstacles (walls/shapes/lines)
  - Clamp to depth if no intersection
  - Respect area boundaries (rays stop at area edges)
- Result: polygon fan for visualization

**Adaptive Ray Sampling**

- More rays near intersection discontinuities
- Fewer rays in open spaces

#### Height-Aware Occlusion (3D)

An obstacle blocks vision only if:

- Obstacle height >= ray height at intersection point
- OR person height is occluded by obstacle's top relative to camera elevation

**Practical Implementation**

- For each person candidate in 2D visible polygon:
  - Test line-of-sight with segment intersections
  - If intersection exists:
    - Compare obstacle height to "line from camera to target point" height
    - Person height default: 1.7m (configurable)
    - If obstacle top > ray height at intersection: occluded

#### Person Detection & Bounding Boxes

**Requirements**

- Each camera determines: `isVisible` boolean per person
- If visible: compute bounding box in camera image coordinates

**Projection Method**

- Each camera has dedicated Three.js perspective camera
- Render people to camera's view (render target texture)
- Compute person 3D bounds (capsule: cylinder + sphere cap)
- Project bounds corners into camera view space
- Convert to 2D pixel coordinates for bounding box overlay

**POV Feed**

- Each camera produces live "CCTV" view:
  - Three.js camera renders to texture (RenderTarget)
  - Texture displayed in UI tile
  - Bounding boxes overlaid in canvas/SVG layer
  - Detection count badge on tile

**Performance Optimization**

- Render cameras at reduced resolution (720p default, down to 480p if needed)
- Update frequency: 30 FPS per camera (reduce if >10 cameras)
- Only render visible tiles (viewport culling)

---

### 6.8 2D Overlay Mini-Map

**Always Visible** (top-left of main viewport)

**Contents**

- Top-down view of current area (or all areas if "All Areas" selected)
- Camera positions with FOV cones
- People positions (dots with color coding)
- Real-time movement synchronized with 3D view

**Interactions**

- Click camera: focuses 3D view on that camera
- Click person: selects and shows trail
- Pan/zoom mini-map independent of 3D view
- Resize/collapse controls

**Styling**

- Semi-transparent background
- High contrast icons
- Camera cones use same occlusion-aware polygons as editor

---

### 6.9 Recording

**Start Recording Toggle**

- Records **main 3D viewport only** (not camera POV tiles, not mini-map)
- Exactly as seen by user

**Implementation**

- `canvas.captureStream()` from WebGL canvas
- MediaRecorder API
- Format: WebM (default), fallback MP4 if supported

**Requirements**

- Recording continues until stop
- UI indicator: red dot + "Recording..." text + timer
- On stop: automatic download OR save to local storage
- Optionally include timestamp overlay (future)

**Edge Cases**

- Switching Map/Canvas mode while recording: continues recording new view
- Switching area: continues recording new area
- Map visibility toggle: records current state (with or without map)

---

### 6.10 Snapshot Export

- Captures current frame from main 3D viewport
- High resolution: 2x or 4x supersampling
- Output: PNG
- Includes current mode, map visibility state, selected area

---

## 7) Data Model (Canonical Scene Schema)

### 7.1 Scene Root

```json
{
  "version": "1.0",
  "mode": "map|canvas",
  "mapVisible": true,
  "units": "meters",
  "origin": {
    "lat": 0,
    "lng": 0,
    "description": "Geographic reference point"
  },
  "areas": [ ... ],
  "walls": [ ... ],
  "shapes": [ ... ],
  "cameras": [ ... ],
  "people": [ ... ],
  "meta": {
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601",
    "mapStyle": "satellite|street|traffic|osm"
  }
}
```

### 7.2 Entities

#### Area (Mandatory)

```json
{
  "id": "area-1",
  "type": "area",
  "name": "Area 1",
  "geometry": {
    "type": "polygon",
    "coordinates": [[x1,y1], [x2,y2], ...],
    "bezierControls": [ ... ] // optional for curved areas
  },
  "pointCount": 4,
  "style": {
    "fillColor": "#rgba",
    "fillOpacity": 0.2,
    "borderColor": "#rgba",
    "borderWidth": 2
  },
  "boundaryMode": "strict"
}
```

#### WallSegment

```json
{
  "id": "wall-1",
  "type": "wall",
  "areaId": "area-1",
  "x1": 0,
  "y1": 0,
  "x2": 10,
  "y2": 0,
  "height": 3,
  "thickness": 0.2,
  "color": "#rgba",
  "opacity": 1,
  "material": "drywall"
}
```

#### Shape

```json
{
  "id": "shape-1",
  "type": "rectangle|circle|triangle|line",
  "areaId": "area-1",
  "x": 5,
  "y": 5,
  "rotation": 0,
  "width": 2,
  "length": 3,
  "height": 1,
  "color": "#rgba",
  "opacity": 1,
  "lineThickness": 0.1 // for line type
}
```

#### Camera

```json
{
  "id": "camera-1",
  "type": "camera",
  "areaId": "area-1",
  "typePreset": "basic|wide|telephoto|panoramic|indoor|outdoor",
  "x": 10,
  "y": 10,
  "height": 2.5,
  "direction": 90,
  "fov": 60,
  "depth": 20,
  "zoom": 1,
  "nearClipping": 0.1,
  "resolution": {
    "width": 1280,
    "height": 720
  }
}
```

#### Person

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
  "trailEnabled": false
}
```

---

## 8) Vision & Occlusion: Detailed Algorithm Requirements

### 8.1 Real-time Constraints

Expected load:

- 10–50 cameras
- 10–100 people
- 100–500 obstacle segments
- 3–10 areas

Must avoid O(Cameras × Rays × Obstacles) naive worst case.

### 8.2 Recommended Strategy

**Two-Phase Pipeline**

1. **Broad Phase (Fast)**
   - Use spatial index (R-tree or grid) to query:
     - Nearby obstacles within camera depth range
     - Candidate people within camera depth and FOV wedge
   - Area boundary check first (cheapest filter)

2. **Narrow Phase (Accurate)**
   - For candidates:
     - Line-of-sight segment intersection tests
     - Height checks (3D occlusion)
     - Bounding box projection

### 8.3 Camera Visible Polygon

**Computation**

- Ray casting with adaptive sampling
- Cache results, recompute only when:
  - Camera transforms change
  - Obstacle geometry changes
  - Area boundaries change

**Optimization**

- Pre-compute static obstacle segments per area
- Incremental updates for dynamic changes

### 8.4 Person Visibility Determination

A person is **visible** if:

- Inside camera's area OR in adjacent visible area (if multi-area support)
- Within depth range
- Within FOV angle
- Not fully occluded by obstacles (considering height)
- Partial visibility counts as visible

### 8.5 Bounding Box Rendering (CCTV Feeds)

**Per-Camera Rendering**

- Each camera has Three.js PerspectiveCamera
- Render to RenderTarget texture
- People rendered as 3D meshes (capsules)
- Post-process to detect visible people and compute bounding boxes

**Bounding Box Computation**

- Project person's 3D bounding capsule corners to 2D
- Find min/max x,y in camera view → rectangle
- Overlay on camera tile with person ID

---

## 9) UI/UX Details That Must Exist

### 9.1 Tool State Indicators

- Active tool highlighted in bottom nav
- Cursor changes:
  - Crosshair for area/wall draw
  - Camera icon for camera placement
  - Person icon for person placement
  - Not-allowed outside areas (red circle-slash)
- Mode badges visible in top panel

### 9.2 Inline Measurements

**While Drawing Walls**

- Show length in meters near cursor
- Show angle from previous segment
- Snap indicators (if snap-to-grid enabled)

**While Drawing Areas**

- Show total perimeter
- Show area square meters (live calculation)
- Ghost polygon preview before closure

### 9.3 Preview of Camera Cone in Editor

- Always visible when camera exists
- Occlusion-aware wedge (computed polygon)
- Updates in real-time as camera or obstacles change
- Color-coded: green (good coverage), yellow (limited), red (blocked)

### 9.4 Properties Panel Behavior

**Numeric Fields**

- Drag-on-label to adjust (pro UX)
- Mouse wheel to increment/decrement
- Immediate update (debounced for history)
- ESC closes panel
- Enter commits and closes

**Area-Specific Controls**

- "Edit Geometry" button → re-enters area edit mode
- "Duplicate Area" button
- Delete with confirmation if contains objects

---

## 10) Non-Functional Requirements

### 10.1 Performance

**Editor**

- Smooth pan/zoom at 60 FPS with 500 objects
- Area editing with 1000+ vertices smooth
- Property updates: < 16ms latency

**Preview**

- Target 60 FPS with:
  - 20 cameras @ 720p render targets
  - 30 people
  - 200 obstacle segments
  - 5 areas

**Graceful Degradation**

- Lower camera POV resolution (720p → 480p → 360p)
- Reduce ray count for visibility polygons (2000 → 400 → 100)
- Lowershadow quality

- Reduce people movement update frequency

### 10.2 Reliability

**Geometry Robustness**

- Handle overlapping walls gracefully
- Self-intersecting area polygons: show warning, allow but mark invalid
- Degenerate shapes (zero-area): prevent or auto-fix

**Autosave**

- localStorage backup every 30 seconds
- Restore on page reload after crash
- "Unsaved changes" warning on close

### 10.3 Compatibility

- Chrome/Edge latest (primary)
- Firefox (secondary)
- Safari (best effort, recording may vary)
- WebGL 2 required
  - Show friendly error message if unsupported
  - Fallback: suggest supported browser

---

## 11) QA: Acceptance Criteria (Detailed)

### 11.1 Editor Core

**Area Management**

- [ ] Cannot place any object before creating area
- [ ] Area creation (point mode) works with double-click close
- [ ] Area creation (pen mode) works with Bezier curves
- [ ] Area list shows all areas with counts
- [ ] Clicking area in list flies to area bounds
- [ ] Area properties panel shows name, style controls, point count

**Object Placement**

- [ ] Walls show x/y, length in meters in sidebar
- [ ] Walls must be fully inside area or show error
- [ ] Shapes have correct properties and update live
- [ ] Shapes cannot be placed/resized outside area
- [ ] Cameras show occlusion-aware FOV wedge
- [ ] Cameras cannot be placed outside area
- [ ] People placement prevented on obstacles, overlaps, and outside areas

**Mode Switching**

- [ ] Map/Canvas toggle works in editor
- [ ] Canvas mode shows neutral grid, hides map tiles
- [ ] Map mode shows selected map style
- [ ] All objects preserved when switching modes
- [ ] Area boundaries visible in both modes

### 11.2 Map Features

- [ ] Location search geocodes and flies to location
- [ ] Map style picker changes tiles (satellite/street/traffic/OSM)
- [ ] Device picker CMDK shows camera types
- [ ] Selecting camera type enables placement mode
- [ ] Devices-in-use panel groups by area with counts

### 11.3 Simulation Analysis

**3D View**

- [ ] Default 3D view loads
- [ ] Map visibility toggle works
- [ ] Area dropdown selects and flies to area (when multiple areas)
- [ ] People move and never pass through walls/shapes/area boundaries
- [ ] Camera POV feeds update in real-time (30 FPS)

**Person Interaction**

- [ ] Clicking person selects and shows trail (20s history)
- [ ] Trail renders on ground plane in 3D
- [ ] Bounding boxes appear on camera feeds when person visible

**2D Overlay Mini-Map**

- [ ] Shows camera FOV cones
- [ ] Shows people moving in real-time
- [ ] Clicking camera focuses 3D view
- [ ] Synchronized with 3D view

**Recording & Export**

- [ ] Recording toggles start/stop
- [ ] Recording produces playable WebM file
- [ ] Recording captures main 3D viewport only
- [ ] Snapshot exports high-res PNG
- [ ] Scene JSON export includes all entities, areas, mode

### 11.4 Undo/Redo

- [ ] Undo/Redo works for area creation/deletion/editing
- [ ] Undo/Redo works for add/delete objects
- [ ] Undo/Redo works for move/resize/rotate
- [ ] Undo/Redo works for property edits (debounced)
- [ ] History persists across mode switches

---

## 12) Implementation Notes

### 12.1 Proposed Stack

- **React** 18+ UI
- **Mapbox GL JS** for map rendering
- **Three.js** r150+ for 3D simulation + camera POV render targets
- State: **Zustand** (recommended) or Redux Toolkit
- **CMDK** library for command palette
- **Turf.js** for geospatial calculations (point-in-polygon, intersections)
- Optional: **React Flow** for visual debugging (not primary UI)

### 12.2 Key Engineering Risks & Mitigations

1. **Multi-camera POV rendering cost**
   - Mitigation: dynamic resolution scaling, render only visible tiles, 30 FPS limit per camera

2. **Area boundary enforcement complexity**
   - Mitigation: use Turf.js booleanPointInPolygon, cache area boundaries as collision geometry

3. **Occlusion correctness with areas**
   - Mitigation: treat area edges as obstacles for ray casting, robust spatial indexing

4. **Pathfinding with area constraints**
   - Mitigation: navigation mesh clipped to area boundaries, or steering with area edge repulsion

---

## 13) Open Decisions (Handled with Best Defaults)

These choices weren't specified; PRD resolves with defaults:

- **Person default height**: 1.7m
- **Wall default height**: 3m
- **Shape default height**: 1m (configurable)
- **Camera default height**: 2.5m
- **Default camera POV resolution**: 1280×720 (scalable)
- **Default ray count per camera visibility**: 400 rays (adaptive)
- **Area default fill opacity**: 0.2
- **Area default border width**: 2px
- **Default movement speed**: 1.2 m/s

---

## 14) Deliverables Checklist

- [ ] Unified Map-based Editor with Canvas mode toggle
- [ ] Area creation & management (mandatory foundation)
- [ ] Walls, shapes, cameras, people placement (all area-constrained)
- [ ] Device picker CMDK with camera types
- [ ] Shared object schema + JSON export
- [ ] Properties panels (instant apply, area-aware)
- [ ] Full undo/redo (including area operations)
- [ ] Simulation Analysis: 3D view + 2D overlay mini-map
- [ ] Multi-camera CCTV feeds + bounding boxes
- [ ] Person selection + trail visualization
- [ ] Map visibility toggle
- [ ] Area dropdown with flyTo
- [ ] Recording (main viewport)
- [ ] Snapshot export (high-res PNG)
- [ ] Polished UI: closing rules, cursor feedback, mode indicators
