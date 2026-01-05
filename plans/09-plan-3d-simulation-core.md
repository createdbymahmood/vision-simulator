# Phase 9: 3D Simulation Engine Core

**Timeline Reference**: Phase 3 from Section 8 (Weeks 6-7)

---

## Phase Goal

Implement the core 3D simulation engine using Three.js, including scene setup, world generation from 2D editor entities, basic rendering of all object types, orbit controls, and the Simulation Analysis view layout. This establishes the foundation for the live preview experience. Note: No routing - this is a view mode within the single-page application.

---

## How Codex Should Use This Phase

- Keep the no-routing rule: the Simulation Analysis view is a mode toggle from the editor, not a new page.
- Focus on faithful world generation from existing 2D entities (areas, walls, shapes, cameras, people) into 3D meshes; do not invent new fields.
- Deliver the view shell (header/top bar/area dropdown) and Three.js scene together; Live Preview must switch instantly.
- Implement Map vs Canvas textures as purely visual, with the specified fade transition.
- Orbit controls and focus selection must feel smooth (damping, easing); acceptance criteria expect these interactions.
- Render camera frustums and basic lighting/shadows now so later collision/physics layers can reuse them.

---

## Scope & Responsibilities

### Included

- Three.js scene setup and configuration
- Simulation Analysis view layout (no routing, view mode switch)
- World generation from 2D entities
- 3D rendering of: ground plane, area boundaries, walls, shapes, cameras, people
- Camera FOV frustum wireframe rendering
- Orbit controls
- Map/Canvas mode support in 3D
- Lighting setup
- Basic 3D view overlays

### Explicitly Excluded

- FOV collision visualization (Phase 10)
- People movement/physics (Phase 10)
- Radar feature (Phase 11)
- PTZ controls in simulation (Phase 10)
- Camera POV feeds (Phase 11)
- Recording/snapshot (Phase 12)

---

## Deliverables

### Three.js Scene Setup (Section 6.5)

- [ ] **Engine**: Three.js r150+
- [ ] **Renderer**: WebGLRenderer with antialias
- [ ] **Color space**: sRGB
- [ ] **Shadows**: Enabled (soft shadows, VSM preferred)
- [ ] **Post-processing** (optional):
  - Bloom effect for glows
  - SSAO for depth (subtle)

### Simulation Analysis View Layout (Section 6.1, 6.2)

**Note**: This is a view mode, not a separate route/page. Switching between Editor and Preview views is handled by state.

#### View Header (Section 6.1)

- [ ] Title: **"Simulation Analysis"** (24px, bold)
- [ ] Description: `• Click a person to select and show trail` (14px, muted)
- [ ] **Mode badge**: Pill showing current mode
  - Map Mode: `"🗺️ Map Mode"`
  - Canvas Mode: `"📐 Canvas Mode"`
  - Background: mode-specific color (teal/gray)

#### Top Bar (Section 6.2.1)

- [ ] **Fixed, height: 64px**
- [ ] **Back to Editor button**:
  - Icon: arrow-left or X
  - Label: "Back to Editor" or "Close Preview"
  - Switches back to Editor View (no routing)
- [ ] **Left Section**:
  - Map/Canvas Mode Toggle (segmented control)
  - Map Visibility Toggle (Map Mode only)
    - Switch component
    - Label: "Map View"
    - Default: ON
- [ ] **Center Section**:
  - Area Dropdown (when multiple areas)
    - Width: 200px
    - Format: `"Area 1 (12 objects)"`
    - Click triggers FlyTo animation
- [ ] **Right Section**:
  - Start Recording button (placeholder)
  - Export Snapshot button (placeholder)

#### Main Viewport - 3D View (Section 6.2.2)

- [ ] Full screen minus top bar (64px) and overlays
- [ ] **3D Scene**:
  - Clear sky gradient background (light blue → white)
  - OR: Current map texture as ground
  - Orbit controls: Rotate (drag), Pan (right-click), Zoom (scroll)

### World Generation (Section 6.5)

#### Ground Plane

- [ ] Geometry: PlaneGeometry (1000m × 1000m)
- [ ] Material:
  - Map Mode (visible): TextureLoader with Mapbox static tile
  - Map Mode (hidden): Grid texture (1m squares)
  - Canvas Mode: Grid texture
- [ ] Receives shadows

#### Area Boundaries

- [ ] Vertical semi-transparent walls at area edges
- [ ] Geometry: ExtrudeGeometry from area polygon (0.5m height)
- [ ] Material: MeshStandardMaterial
  - Color: Area color
  - Opacity: 0.25
  - Transparent: true
  - Side: DoubleSide

#### Walls

- [ ] Geometry: BoxGeometry (length × thickness × height)
- [ ] Material: MeshStandardMaterial
  - Color: Wall color (default gray)
  - Roughness: 0.8
  - Metalness: 0.1
- [ ] Casts and receives shadows

#### Shapes

- [ ] **Rectangle**: BoxGeometry
- [ ] **Circle**: CylinderGeometry
- [ ] **Triangle**: ExtrudeGeometry from triangle path
- [ ] **Line**: BoxGeometry (length × thickness × height)
- [ ] Materials: Similar to walls, with user-defined colors

#### Cameras

- [ ] Model: Simple mesh (box body + cone lens)
- [ ] Material: MeshStandardMaterial with camera color
- [ ] Emissive: Camera color (subtle glow)
- [ ] Height: Elevated on cylinder stand
- [ ] Direction indicator: Arrow mesh extending forward

#### People

- [ ] Geometry: CapsuleGeometry (radius × height) OR Cylinder + Sphere
- [ ] Material: MeshStandardMaterial
  - Default color: blue `#4ECDC4`
  - Selected: yellow `#F7DC6F` with emissive glow
- [ ] Height: 1.7m (configurable)

### Camera FOV Frustums (Section 6.2.2)

- [ ] Each camera renders:
  - **Frustum wireframe**:
    - Edges: Camera's color, 2px width
    - Near plane, far plane, connecting edges
  - **FOV volume**:
    - Semi-transparent planes: Camera color, opacity 0.12
    - Blending mode: additive

### Lighting (Section 6.2.2)

- [ ] **Directional light** (sun): From top-front, casts soft shadows
- [ ] **Ambient light**: Subtle, ensures no fully dark areas
- [ ] **Hemisphere light**: Sky color influences overall tone

### Orbit Controls (Section 6.5)

- [ ] OrbitControls from Three.js
- [ ] Target: Scene center OR selected object
- [ ] Min distance: 5m
- [ ] Max distance: 500m
- [ ] Damping: Enabled (feels smooth)
- [ ] Auto-rotate: Optional (disabled by default)

### Focus Selection (Section 6.5)

- [ ] Double-click person or camera:
  - Animates camera to focus on object
  - Target: Object position
  - Distance: 10m from object
  - Duration: 800ms ease-out

### Map/Canvas Mode in Preview (Section 6.3)

#### Map Mode

- [ ] 3D ground plane textured with Mapbox tiles
- [ ] Area boundaries: Subtle vertical semi-transparent planes (0.5m height)
- [ ] Map visibility toggle controls texture:
  - ON: Shows live map tiles
  - OFF: Replaces with neutral grid texture

#### Canvas Mode

- [ ] 3D ground plane: Neutral grid texture (1m squares)
- [ ] Area boundaries: Colored polygon outlines on ground + subtle vertical lines
- [ ] Map visibility toggle: Hidden

#### Unified Behavior

- [ ] All simulation identical in both modes
- [ ] Mode switch: Smooth transition (fade texture over 400ms)
- [ ] No simulation pause required

### Area Dropdown Behavior (Section 6.4)

- [ ] **Trigger button**: Current area name + icon
- [ ] **Width**: 200px
- [ ] **Max height**: 400px (scrollable)
- [ ] **Menu Options**:
  - "All Areas" (default)
  - Divider
  - List of areas with:
    - Area name
    - Object count
    - Color indicator dot

- [ ] **Selection Behavior**:
  1. Dropdown closes
  2. **FlyTo animation**:
     - Duration: 1000ms
     - Easing: ease-in-out
     - Camera fits area bounds + 20% padding
     - Smooth arc trajectory
  3. 3D view focuses on selected area
  4. Optional: Dim objects outside (opacity 0.3)

- [ ] **Single Area Scene**: Dropdown hidden

---

## Dependencies

- Phase 1: Foundation & Data Models (All entity schemas)
- Phases 3-7: All 2D editor functionality complete (entities exist to render)

---

## Acceptance Criteria

- [ ] Clicking Live Preview button switches to Simulation Analysis view
- [ ] View switch happens instantly without page reload/routing
- [ ] Top bar shows mode toggle, area dropdown, action buttons
- [ ] 3D scene renders with correct sky/grid background
- [ ] All walls render as 3D boxes with correct dimensions
- [ ] All shapes render with correct geometry types
- [ ] Cameras render with body mesh and color accent
- [ ] People render as capsules with correct height
- [ ] Camera FOV frustums show wireframe in camera color
- [ ] Orbit controls work: rotate, pan, zoom
- [ ] Double-click focuses on object with animation
- [ ] Map/Canvas mode switch transitions smoothly
- [ ] Map visibility toggle shows/hides map texture
- [ ] Area dropdown triggers FlyTo animation
- [ ] Lighting casts soft shadows

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Three.js bundle size impact | Use tree-shaking; lazy load simulation module |
| Performance with many objects | Use instanced rendering; LOD for distant objects |
| Mapbox texture loading complexity | Pre-fetch static tiles; provide fallback grid |

---

## Mapping to PRD Sections

- Section 4.1: View Modes (No Routing) - Preview view mode
- Section 6.1: View Header Requirements
- Section 6.2: Layout Regions (Top Bar, Main Viewport)
- Section 6.3: Map/Canvas Mode in Preview
- Section 6.4: Area Dropdown Behavior
- Section 6.5: 3D Simulation Engine (Engine, Scene Setup, World Generation, Controls)
