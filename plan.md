# PRD — Computer Vision Simulator Application

## Product Name: Computer Vision Simulator

## Live Preview Title: **Simulation Analysis**

## Platforms: Web (desktop-first)

## View Types: **Canvas** and **Map**

## Primary Outputs: Real-time simulation + camera POV feeds + recording + snapshots + scene export

---

## 0) Executive Summary

We are building an interactive simulation tool that lets users:

1. Design an environment (2D editor) in **Canvas** or **Map**
2. Place **walls, shapes, cameras, people**
3. Run a live simulation with:

- **Real-time agent motion** with collision avoidance
- **Realistic camera visibility** (occlusion, height, FOV, depth, zoom)
- **3D world preview** (default) with optional 2D preview (Canvas required, Map has overlay)
- Multi-camera **CCTV-like POV feeds**

4. Export:

- **Recording** (video capture of 3D view)
- **Snapshot** (screenshot of 3D)
- **Scene Export** (JSON)

This product must feel like a “real” security camera simulation rather than a diagram editor.

---

## 1) Users, Personas, Jobs-to-be-Done

### 1.1 Personas

- **Security Designer**: Plans camera placement for coverage, blind spots, and obstructions.
- **Operations Engineer**: Validates device constraints and coverage in real environments (Map).
- **Analyst / Stakeholder**: Reviews recorded simulation outputs and snapshots.
- **Product/Integrator**: Uses exported scene JSON to integrate simulation results elsewhere.

### 1.2 Primary JTBD

- “When I design an environment, I want to see which people each camera can detect, so I can validate camera placement and configuration before deployment.”

---

## 2) Scope

### 2.1 In Scope (MVP+)

- Canvas editor (grid board) + Map editor (Mapbox) with shared object model
- Drawing tools: walls, shapes, areas (map), device placing, people placing
- Full selection + property editing (instant apply)
- Undo/redo for _all_ edits
- Live preview / simulation:

  - Canvas: 3D (default) + 2D toggle + camera feeds
  - Map: 3D (default) + map visibility toggle + camera feeds + 2D overlay

- Recording + snapshot
- Export JSON

### 2.2 Explicit Non-Goals (for now)

- Multiplayer collaboration
- Photorealistic rendering (we want “realistic enough”, but not cinematic)
- ML inference (no actual CV models—only visibility simulation & bounding boxes)
- Account system / backend (unless required later)

---

## 3) Product Requirements: High-Level

### 3.1 Consistency Rules (Global)

- **Selection mode** governs whether items are selectable.
- Clicking “blank space” closes:

  - Properties panels
  - Popovers
  - CMDK dialogs
  - Area management popovers

- Bottom nav and top nav are **fixed** and always visible.
- Entire app uses **100vh height, 100% width**.

### 3.2 Object Categories

- **Structural**: walls, shapes, areas
- **Actors**: people
- **Devices**: cameras (plus processors as placeholders in Map device picker)

### 3.3 Interaction Categories

- Create: draw/place objects
- Select: pick object
- Modify: drag/resize/rotate and edit properties
- Simulate: run live preview
- Export: record/snapshot/scene export
- History: undo/redo

---

## 4) Information Architecture & Navigation

### 4.1 Top-Level Routes

- `/canvas` (Canvas Editor)
- `/canvas/preview` (Simulation Analysis – Canvas)
- `/map` (Map Editor)
- `/map/preview` (Simulation Analysis – Map)

### 4.2 Mode Switching

- Canvas ↔ Map switch can exist in a main app header, or separate entry points. (Implementation choice; requirements don’t mandate a global switch UI.)

---

## 5) Canvas Editor PRD (Deep)

### 5.1 Canvas Layout (UI Regions)

1. **Top Panel (fixed)**

   - Edit Mode toggle
   - Clear Board
   - Undo
   - Redo
   - Export
   - Live Preview

2. **Main Board**

   - Checkered grid
   - Pan/zoom (editor camera)
   - Optional snap-to-grid (recommended)
   - Optional measurement overlay (recommended)

3. **Bottom Navigation (fixed)**

   1. Selection mode toggle
   2. Draw wall
   3. Draw shapes (popover: rectangle/line/circle/triangle)
   4. Place camera
   5. Place person
   6. Add background image

4. **Right Sidebar: Properties Panel (contextual)**

   - Appears when selecting an object (selection mode on)
   - Applies changes instantly (no save)

---

### 5.2 Coordinate System & Units

- World coordinate system in meters (2D).
- Origin may be at center of grid or top-left. Requirement: consistent and visible.
- Property panel always shows:

  - X and Y in meters
  - Rotation degrees (0–360)

- Rendering scale factor (px per meter) internal; never leaks into UI.

---

### 5.3 Object Creation: Tools

#### 5.3.1 Selection Tool

- Clicking selects topmost object under cursor (z-index rules below).
- Multi-select optional (not required), but recommended for advanced usage.
- Dragging selected objects moves them with collision constraints depending on object type:

  - Structural objects can overlap (allowed) or optionally constrained.
  - People cannot overlap obstacles/people.
  - Cameras cannot be inside walls/shapes (recommended constraint).

#### 5.3.2 Draw Wall Tool

**Workflow**

- Click first point → start wall segment
- Mouse move previews segment
- Click additional points continues wall polyline
- Double-click ends drawing
- Walls are stored as:

  - Either separate segments, or a polyline entity that compiles into segments for physics/occlusion

**Properties**

- Start (x1,y1), End (x2,y2) for segments
- Height (m), Thickness (m)
- Material preset (optional): “drywall”, “concrete” for visual differences
- Color + opacity (2D editor)

**Constraints**

- Walls snap to grid (optional toggle)
- Self-intersection handling:

  - Allowed visually, but physics & occlusion must handle robustly

- Zero-length segments prevented

#### 5.3.3 Draw Shapes Tool

Popover choices: Rectangle, Circle, Triangle, Line

**Shared Editor Behaviors**

- Click-and-drag to size (or click to place default size)
- Handles for resize/rotate
- Sidebar updates live

**Properties**

- Circle: x, y, rotation, width, length, color, opacity, height(m)
- Rectangle: same
- Triangle: same
- Line: x, y, rotation, length, color, opacity, (optional thickness), height(m)

**Collision**

- Rectangle/triangle/circle treated as solid obstacles by default
- Line: configurable whether it blocks movement; MUST block camera view by default (per your “preventing camera to see behind element” statement)

#### 5.3.4 Place Camera Tool

**Workflow**

- Click on board to place camera at cursor
- On placement, camera gets a default config (medium)
- Immediately render:

  - Camera icon
  - Direction indicator
  - Vision cone polygon in 2D (occlusion-aware)

**Properties**

- x, y
- direction (deg)
- FOV (deg)
- depth (m)
- height (m)
- zoom (unitless or optical zoom factor)
- near clipping (optional; default 0.1m)
- camera type preset (optional in Canvas; required in Map)

**Vision rendering**

- Vision polygon is computed as a set of rays clipped by obstacles.
- Must update:

  - On camera property change
  - On obstacle movement/creation/deletion
  - On people movement (preview only impacts detections, not polygon)

#### 5.3.5 Place Person Tool

**Workflow**

- Click to place person at cursor
- Person appears as a circle/marker with collision radius

**Properties**

- x, y
- radius
- speed (m/s)
- movement mode (preview): random roam within boundary constraints

**Constraints**

- Cannot place inside walls/shapes/lines (where line blocks movement)
- Cannot overlap other people at placement time (resolve by nudging or reject)

#### 5.3.6 Background Image Tool

**Workflow**

- Upload image
- Set as canvas background layer aligned to world coordinates
- Controls:

  - opacity
  - scale (m per px calibration)
  - rotation
  - position (x,y anchor)
  - lock/unlock to prevent accidental moves

---

### 5.4 Object Selection & Z-Ordering

When clicking:

1. People (top priority)
2. Cameras
3. Walls (segments)
4. Shapes
5. Background

Also provide a “selection cycle” shortcut (optional) to iterate stacked objects.

---

### 5.5 Properties Panel (Canvas)

**General**

- Title: object type + ID (e.g., “Camera • cam-3”)
- Live-updating values; change triggers immediate render & history command
- Close on outside click, nav click, or ESC

**Field requirements**

- Numeric fields: step increments, min/max
- Angle: either slider + number input
- Color: picker + opacity slider
- Validate and clamp values

**Examples**

- Camera: direction 0–360, FOV 1–180, depth >=0, height >=0
- Person speed: >=0
- Shape width/length: >0

---

### 5.6 History System (Undo/Redo)

**Scope: everything**

- Creation, deletion
- Movement and transform changes
- Property edits (including every keystroke?)

  - Must use debounced commits (e.g., commit after 300ms idle) to avoid history spam

- Background changes

**Implementation requirement**

- Command-based operations:

  - `do()` and `undo()`
  - Serializable diffs recommended

- History stack size default: 200 operations (configurable)

---

### 5.7 Clear Board

- Prompts confirm (recommended)
- Clears:

  - all objects
  - history resets

- Background removed

---

### 5.8 Export (Canvas Editor)

Export options:

- **Scene JSON**
- **Scene image** (top-down raster)
- (Optional) bundle export with assets (background image)

---

## 6) Simulation Analysis — Canvas Live Preview (Deep)

### 6.1 Page Header Requirements

- Title: **Simulation Analysis**
- Description text (under title): `• Click a person to select and show trail`

### 6.2 Layout Regions

1. **Top bar (fixed)**

   - Start Recording (toggle)
   - Export Snapshot

2. **Under Top bar (top-left)**

   - Toggle: **3D / 2D** (default 3D)

3. **Main viewport**

   - 3D world (default) OR 2D top-down

4. **Right Sidebar (collapsible)**

   - Top: 2D mini view of camera layouts + people (always shown in canvas preview)
   - Bottom: camera-count list of camera POV tiles (CCTV feeds)

5. **Bottom camera strip (optional if right panel already contains feeds)**
   Requirement says: “on the bottom of this main preview in the sidebar, cameras-count-number of divs.”
   Interpret as: camera feed grid inside the right sidebar lower area (collapsible). (We can also mirror to bottom if needed.)

---

### 6.3 3D Simulation Engine Requirements

**Engine**: Three.js
**World generation**

- Extrude 2D walls/shapes into 3D geometry using each object’s height.
- Floor plane: grid textured
- Lighting: directional + ambient (enough for depth cues)

**Controls**

- Orbit controls:

  - rotate around focus point
  - pan
  - zoom in/out

- Focus selection:

  - selecting a person can center camera on them (recommended toggle)

---

### 6.4 Physics & Movement Requirements

**People movement**

- People move continuously and avoid:

  - walls
  - shapes
  - other people

**Collision model**

- People: circles (2D) with radius
- Walls: segments with thickness → treat as capsules/rects
- Shapes: polygon obstacles / circle obstacles

**Motion planning**

- Must avoid getting stuck in corners (use steering behaviors)
- Recommended approach:

  - Navigation mesh (advanced) OR
  - Velocity obstacles / RVO-lite (practical) OR
  - Grid-based A\* with smoothing (works if grid resolution ok)

**Constraints**

- People cannot “tunnel” through walls at high speed:

  - Use continuous collision detection or small fixed timestep

- Deterministic simulation option (seeded random) for reproducible recordings

**Trail requirement**

- When person clicked:

  - highlight selected
  - show trail (path history for last N seconds, e.g., 20s)

- Trail must reflect actual movement path

---

### 6.5 Camera Vision Requirements (Core)

We simulate:

- Camera frustum defined by:

  - position (x,y,height)
  - direction (yaw)
  - FOV (horizontal)
  - depth (max distance)
  - zoom (affects effective FOV and projection)

- Occlusion by obstacles
- Person visibility: whether person’s body intersects visible region

#### 6.5.1 2D Occlusion (Top-down)

Compute visible polygon for each camera:

- Cast `N` rays (e.g., 200–2000 depending on performance)
- Ray angles span `direction ± FOV/2`
- For each ray:

  - find closest intersection with obstacles (walls/shapes/lines)
  - clamp to depth if no intersection

- Result is a polygon fan
- Use polygon union or mesh fan for rendering

**Accuracy**

- More rays → smoother edges
- Use adaptive sampling:

  - extra rays near intersection discontinuities (advanced)

#### 6.5.2 Height-aware Occlusion (3D)

An obstacle blocks vision only if:

- Obstacle height >= ray height at intersection OR
- Person height is behind obstacle’s top relative to camera

A practical approach:

- For each person candidate in 2D visible polygon:

  - test line-of-sight with segment intersections
  - if intersection exists:

    - compare obstacle height to “line from camera to target point on person” height

- Person height defaults: 1.7m (configurable)

#### 6.5.3 Person Detection & Bounding Boxes

Requirement: “if any person clicked, rectangle/square on each camera’s POV if visible.”

We must produce for each camera:

- Per person: `isVisible` boolean
- If visible: bounding box in camera image coordinates

**Projection**

- Represent camera POV as a render target (texture) or simulated 2D projection.
- Bounding boxes:

  - Compute person 3D bounds (capsule)
  - Project bounds corners into camera view space
  - Convert to 2D pixel coords

- If you don’t want full 3D render targets initially:

  - Approximate bounding box based on angle/distance
  - But requirement says “exact same simulation like CCTV” → recommend real camera render targets.

**POV feed**

- Each camera produces a live “CCTV” view:

  - Use per-camera Three.js camera rendering to texture
  - Display textures in UI tiles

---

### 6.6 2D Mode (Canvas Preview)

When toggled to 2D:

- Replace main view with top-down 2D simulation
- Keep:

  - people movement
  - camera cones
  - detection overlays

- The right sidebar still shows camera POV feeds

---

### 6.7 Recording

**Start Recording toggle**

- Records the **main 3D viewport** exactly as seen (not the camera POV tiles).
- Implementation:

  - `canvas.captureStream()` from WebGL canvas
  - MediaRecorder API

- File format:

  - webm by default

- Requirements:

  - Recording continues until stop
  - UI indicates “Recording…” state
  - On stop: user downloads/saves output (or stored locally)

Edge cases:

- If user switches to 2D while recording, decide:

  - Option A: keep recording current main viewport (changes included)
  - Option B: lock recording mode to the starting view
  - Recommend A (simple, intuitive)

---

### 6.8 Snapshot Export

- Captures current frame from main viewport at high resolution
- Option:

  - 1x or 2x scale

- Output: png

---

## 7) Map Editor PRD (Deep)

### 7.1 Layout Regions

- Main map (Mapbox)
- Bottom navigation (fixed)
- Right-side vertical grid buttons (fixed)
- Properties panel (right slide-over)
- CMDK dialogs & popovers

---

### 7.2 Bottom Navigation (Map)

1. Mode popover: Hand mode / Selector mode

   - Hand mode: map drag/pan enabled, object selection disabled
   - Selector mode: selection enabled, map drag limited unless clicking empty space

2. Create Area tool

   - Two types:

     - Point-to-point polygon
     - Pen mode (Bezier curves / curved segments)

3. Shapes tool (same as Canvas)

4. Device placement (CMDK dialog; search devices)

People placement exists as part of shared toolset (you stated it explicitly in map requirements). If not in bottom nav, it must exist in device/panel or add a 5th tool. Because your spec includes people on map and strong constraints, we must provide a place tool. Recommended:

- Add **Place Person** button in bottom nav for Map too (even if you didn’t list it in that section). If you strictly want only four items, then include “people” inside the CMDK as a category. But your spec says device picker is for devices, so best is to add a dedicated people tool.

(If you want it strictly as-written, we can keep people placement accessible from properties panel or hotkey, but that’s risky UX.)

---

### 7.3 Areas (Map) — Creation and Management

#### 7.3.1 Area Entity

- Each area has:

  - id, name (auto area-1…)
  - geometry: polygon (with optional curves -> store as control points + baked polygon)
  - point count
  - style: fill color/opacity, border color/width

#### 7.3.2 Drawing Modes

1. **Click-to-point polygon**

   - Click adds vertex
   - Ghost line previews closure
   - Double-click closes polygon

2. **Pen tool (Photoshop-like)**

   - Click to add anchor
   - Drag to create Bezier handles
   - Curves are sampled into polyline for rendering & physics
   - Double-click closes polygon

#### 7.3.3 Area Constraints

- Areas must be closed
- Minimum vertices: 3
- No placement outside areas:

  - cursor becomes `not-allowed`
  - click produces “invalid placement” feedback

- If multiple areas overlap:

  - placement uses the topmost/nearest area (rule must be defined)
  - recommended: user must pick active area or use nearest centroid

---

### 7.4 Shapes & Walls on Map

Same as Canvas but constrained:

- Must be created fully inside an area
- If user draws such that part would go outside:

  - Either clip to area boundary (advanced)
  - Or block and show warning (simpler, recommended MVP)

---

### 7.5 Device Picker (CMDK)

Triggered from bottom nav “device tool”.

**CMDK Contents**

- Search input
- Sections:

  - Cameras
  - Processors
  - Recent

**Camera types**

- Basic security
- Wide angle
- Telephoto
- Panoramic
- Indoor
- Outdoor

Each type has:

- default FOV, depth, height, zoom
- constraints:

  - panoramic: FOV up to 180
  - telephoto: FOV limited narrow
  - basic: medium values

When user selects a camera type:

- CMDK closes
- Cursor changes to placement mode
- Click in area places camera
- Cannot place outside area

---

### 7.6 Right-side Vertical Grid Buttons (Map)

1. **Search location**

   - CMDK prompt: type city/country
   - Uses Mapbox geocoding
   - On selection: flyTo location

2. **Area management**

   - List:

     - area name
     - point count

   - Clicking area:

     - map flies to fit bounds of area

3. **Map view mode popover**

   - Satellite
   - Street
   - Traffic
   - OSM Mapnik

4. **Devices in use**

   - Group by area (collapsible sections)
   - Each device item:

     - icon
     - name/type
     - click selects it on map & opens properties

   - Shows count badges per area

---

## 8) Simulation Analysis — Map Live Preview (Deep)

### 8.1 Differences vs Canvas Preview

- Default: **3D only** main view
- Has **area dropdown** (top-left) + fly animation
- Has **map visibility toggle** (default ON; label “Map view”)
- Must have:

  - Right sidebar: camera list + POV feeds (real-time)
  - Top overlay: 2D top-down camera cones + people moving (you asked for it)
  - Bottom: per-camera POV previews (CCTV)

So Map preview actually contains:

- Main 3D view
- A 2D overlay mini-map/overlay (not a full 2D mode switch)

### 8.2 Area dropdown behavior

- Default value:

  - “nearest area to the view when I clicked on live preview”

- Changing selection:

  - flyTo area bounds
  - updates active simulation boundary for people if required

### 8.3 Map toggle

- Switch: ON/OFF
- When OFF:

  - map texture disappears (ground becomes neutral plane)
  - objects remain

---

## 9) Shared Rules & Interaction Contracts

### 9.1 Selection Mode Contract

- If selection mode OFF:

  - clicking objects does not open properties
  - creation tools still work

- If selection mode ON:

  - clicking object selects and opens panel

### 9.2 Closing UI Overlays

Any of these should close when clicking on:

- empty canvas/map
- bottom nav
- top nav
- switching tools

Overlays:

- properties panel
- popovers
- cmdk dialogs
- area management popovers
- map view picker popover

### 9.3 Invalid Actions Feedback

Must be explicit and immediate:

- Cursor `not-allowed`
- Toast/snackbar or small inline hint near cursor
- Soft error sound optional

Examples:

- placing camera outside area
- placing person on wall/shape/line
- drawing shape outside area on map
- trying to preview with zero cameras (still allowed, but warn)

---

## 10) Data Model (Canonical Scene Schema)

### 10.1 Scene Root

```json
{
  "version": "1.0",
  "mode": "canvas|map",
  "units": "meters",
  "background": { ... },
  "areas": [ ... ],
  "walls": [ ... ],
  "shapes": [ ... ],
  "cameras": [ ... ],
  "people": [ ... ],
  "meta": { "createdAt": "...", "updatedAt": "..." }
}
```

### 10.2 Entities

#### WallSegment

- id
- type: "wall"
- x1,y1,x2,y2
- height
- thickness
- color, opacity

#### Shape

- id
- type: "rectangle|circle|triangle|line"
- x,y
- rotation
- width,length (or radius representation internally)
- height
- color, opacity
- lineThickness (for line)

#### Camera

- id
- typePreset: "basic|wide|telephoto|panoramic|indoor|outdoor|custom"
- x,y,height
- direction
- fov
- depth
- zoom
- resolution (e.g., 1280x720 for POV)
- nearPlane

#### Person

- id
- x,y
- radius
- height
- speed
- behavior: "roam|path|script"
- trailEnabled

#### Area (Map only)

- id, name
- geometry:

  - anchors + bezier handles OR baked polygon points

- pointCount

### 10.3 Derived Runtime Structures (Not in export)

- Spatial index (R-tree / grid buckets)
- Compiled obstacle polygons
- Nav / avoidance mesh
- Per-camera render targets & projection data

---

## 11) Vision & Occlusion: Detailed Algorithm Requirements

### 11.1 Real-time Constraints

We may have:

- 10–50 cameras
- 10–100 people
- Obstacles up to hundreds of segments

We must avoid O(Cameras _ Rays _ Obstacles) naive in worst case.

### 11.2 Recommended Strategy

**Two-phase pipeline**

1. **Broad phase (fast)**

- Use spatial index to query nearby obstacles within camera depth range.
- Use spatial index to query candidate people within camera depth and FOV wedge.

2. **Narrow phase (accurate)**

- For candidates:

  - line-of-sight segment intersection tests
  - height checks
  - bounding box projection

### 11.3 Camera Visible Polygon

Compute for visualization overlay:

- Use ray casting with adaptive sampling
- Cache results and recompute only when:

  - camera transforms change
  - obstacle geometry changes

### 11.4 Person Visibility Determination

A person is “visible” if:

- Within depth
- Within FOV angle
- Not occluded by obstacles considering height
- Optional: partial visibility allowed (if only part visible, still visible)

### 11.5 Bounding Box Rendering (CCTV feeds)

- Each camera has a Three.js camera
- People are rendered in that camera’s view
- Bounding boxes computed by projection
- The camera tile overlays bounding boxes

This achieves the “exact same CCTV simulation” feeling you want.

---

## 12) 3D Fidelity Requirements

### 12.1 Geometry

- Walls: extruded planes with thickness
- Shapes: extruded meshes
- People: capsule mesh or cylinder + sphere head
- Cameras: simple model (cone + box)

### 12.2 Materials

- Not photorealistic but physically consistent:

  - soft shadows optional
  - neutral colors
  - opacity respected for shapes if you want “glass-like” blockers (but note: if a shape is semi-transparent visually, it still blocks vision unless explicitly configured—define rule)

**Rule recommendation**

- Opacity affects visuals only; occlusion is binary unless we add “see-through” material types.

---

## 13) Simulation Boundaries & Constraints

### 13.1 Canvas Boundary

- Either infinite or a defined board extent.
- People should roam within the “walkable region”:

  - if no boundary defined: choose a bounding box around placed objects + margin

### 13.2 Map Boundary

- People must remain inside selected area polygon
- If multiple areas:

  - People belong to a specific area
  - They cannot roam across areas unless user enables “multi-area roam” (future)

---

## 14) UI/UX Details That Must Exist

### 14.1 Tool State Indicators

- Active tool highlighted in bottom nav
- Cursor changes:

  - crosshair for draw
  - camera icon for camera placement
  - person icon for person placement
  - not-allowed outside area

### 14.2 Inline Measurements

- While drawing walls:

  - show length in meters near cursor
  - show angle

### 14.3 Preview of camera cone in editor

- Always visible when camera exists
- Occlusion-aware wedge

### 14.4 Properties Panel Behavior

- For numeric fields:

  - dragging on label to adjust (nice pro UX)
  - immediate update

- ESC closes panel

---

## 15) Export Requirements (Advanced)

### 15.1 Scene Export (JSON)

- Must include:

  - all entities
  - units
  - version

- Must NOT include:

  - runtime caches

### 15.2 Snapshot Export

- PNG
- Contains:

  - what user sees in main 3D viewport

### 15.3 Recording Export

- WebM (default)
- Records main viewport
- Optionally include timestamp overlay (future)

---

## 16) Non-Functional Requirements

### 16.1 Performance

- Editor: smooth pan/zoom at 60 FPS with 500 objects
- Preview: target 60 FPS with:

  - 20 cameras @ 720p render targets
  - 30 people
  - 200 obstacle segments

- Degrade gracefully:

  - lower camera POV resolution dynamically
  - lower ray count for visible polygon
  - reduce shadow quality

### 16.2 Reliability

- No crashes if geometry is messy:

  - overlapping walls
  - self-intersecting polygons

- Autosave recommended (localStorage) to prevent loss

### 16.3 Compatibility

- Chrome/Edge latest, Safari if possible (recording may vary)
- WebGL2 required (fallback message if unsupported)

---

## 17) Analytics & Debugging (Strongly Recommended)

Provide developer overlays (toggle):

- Show collision shapes
- Show nav/avoidance vectors
- Show camera rays
- Show detection counts per camera
- FPS meter

Event telemetry (if productized):

- tool usage frequency
- time in preview mode
- number of exports/recordings

---

## 18) QA: Acceptance Criteria (Detailed)

### 18.1 Editor Core

- Walls show x/y and length in meters in sidebar
- Shapes have correct properties and update live
- Cameras show occlusion-aware FOV wedge
- People placement prevented on obstacles and overlaps
- Upload background applies to entire canvas

### 18.2 Map Rules

- Nothing placeable outside areas
- Cursor shows not-allowed outside areas
- Area creation supports point mode + pen mode
- Double click closes polygon/pen
- Area management fly-to works
- Location search fly-to works
- Map style switch works

### 18.3 Simulation Analysis — Canvas

- Default 3D view
- 2D toggle works
- People move and never pass through walls/shapes/people
- Camera POV feeds update in real time
- Clicking a person:

  - shows trail
  - shows bounding boxes on each camera feed where visible

- Recording toggles start/stop and produces playable file
- Snapshot exports correct image

### 18.4 Simulation Analysis — Map

- Default 3D view
- Area dropdown selects and flies to area
- Map visibility toggle works
- Camera feeds update in real time
- 2D overlay shows FOV cones + people moving

### 18.5 Undo/Redo

- Undo/Redo works for:

  - add/delete objects
  - move/resize/rotate
  - property edits (debounced)
  - background changes
  - area creation/editing

---

## 19) Implementation Notes (Your Suggested Stack, Formalized)

### 19.1 Proposed Stack

- **React** UI
- **React Flow** for Canvas editor graph/objects (or Konva/Fabric if better for drawing; but you asked React Flow)
- **Three.js** for 3D simulation + camera POV render targets
- **Mapbox GL JS** for Map editor + flyTo + styles
- State: **Zustand** (recommended for performance) or Redux Toolkit
- CMDK: cmdk library

### 19.2 Key Engineering Risks & Mitigations

1. **Multi-camera POV rendering cost**

   - Mitigate with:

     - per-camera resolution scaling
     - render only visible tiles or rotate update frequency per camera

2. **Occlusion correctness**

   - Use robust geometry ops, spatial indexing

3. **Pathfinding complexity**

   - Start with steering + obstacle avoidance; upgrade to navmesh if needed

---

## 20) Open Decisions (Handled with Best Defaults)

These are choices you didn’t specify; the PRD resolves them with defaults:

- Person default height: **1.7m**
- Wall default height: **3m**
- Shape default height: **1m** (configurable)
- Camera default height: **2.5m**
- Default camera POV resolution: **1280×720** (reduce as needed)
- Default ray count per camera for visible polygon: **400** (adaptive recommended)

---

## 21) Deliverables Checklist

- [ ] Canvas Editor
- [ ] Map Editor
- [ ] Shared object schema + export
- [ ] Properties panels (instant apply)
- [ ] Full undo/redo
- [ ] Canvas Simulation Analysis (3D + 2D toggle)
- [ ] Map Simulation Analysis (3D + overlays)
- [ ] Multi-camera CCTV feeds + bounding boxes
- [ ] Recording (viewport)
- [ ] Snapshot export
- [ ] Polished UI closing rules & cursor rules
