# Phase 11: Radar & Camera POV Feeds

**Timeline Reference**: Phase 4 from Section 8 (Weeks 9-10)

---

## Phase Goal

Implement the Radar feature for tactical 2D overview with ping animations, and the Camera POV feeds with bounding box rendering for detected people. This phase provides situational awareness tools and per-camera perspective views.

---

## How Codex Should Use This Phase

- Treat radar and POV feeds as overlays on the existing simulation; no new routing or scene duplication.
- Implement radar visuals/interactions exactly (draggable, resizable, ping animation, context menu, stats footer); it must be always visible in simulation.
- Use the camera vision pipeline (frustum culling + occlusion) to drive both radar connection lines and POV bounding boxes—do not fake detections.
- Bounding boxes in feeds must match camera colors/layout and update in real time; clicking a feed switches the active camera.
- Keep performance guardrails: limit active feeds (4–6) and support resolution adjustments.
- All toggles (grid, trails, wedges, lock position) should persist during a session to avoid user confusion.

---

## Scope & Responsibilities

### Included

- Radar 2D tactical view component
- Radar visualization (cameras, people, areas, FOV wedges)
- Ping animation on person selection
- Radar interactions (click, drag, zoom, context menu)
- Camera POV feeds rendering
- Bounding box computation for detected people
- Camera vision pipeline implementation

### Explicitly Excluded

- Recording/snapshot (Phase 12)
- Performance optimization (Phase 12)

---

## Deliverables

### Radar Feature (Section 5.6)

#### Radar Purpose (Section 5.6.1)

- [ ] Real-time 2D Tactical View
- [ ] Shows all people and cameras in simplified top-down
- [ ] Person selection triggers "ping" animation
- [ ] Situational awareness during simulation
- [ ] Track movement patterns

#### Radar UI Component (Section 5.6.2)

- [ ] **Location**:
  - Editor: Optional toggle (bottom-right floating button)
  - 3D Simulation: Always visible (top-left overlay, 16px from corner)

- [ ] **Layout**:

  ```
  ┌──────────────────────────┐
  │  RADAR          [−] [×]  │ ← Header with minimize/close
  ├──────────────────────────┤
  │                          │
  │    📷  👤   📷            │
  │         👤               │ ← Tactical view
  │  👤        📷👤           │
  │       📷                 │
  │                          │
  ├──────────────────────────┤
  │  People: 5  Cameras: 4   │ ← Stats footer
  └──────────────────────────┘
  ```

- [ ] **Dimensions**:
  - Width: 300px
  - Height: 300px (square)
  - Resizable: drag corners (min 200px, max 500px)
  - Semi-transparent background with backdrop blur
  - Border: 2px solid rgba(255, 255, 255, 0.3)

- [ ] **Draggable**: User can reposition
- [ ] **Minimizable**: Cannot be closed in simulation, can be minimized

#### Radar Visualization (Section 5.6.3)

- [ ] **Camera Indicators**:
  - Icon: Small camera symbol (16px) or solid circle with dot
  - Color: Camera's assigned color
  - FOV Wedge:
    - Simplified cone (not occlusion-aware)
    - Fill: camera color, opacity 0.1
    - Border: camera color, 1px, opacity 0.4
  - Rotation indicator: small arrow from camera
  - Hover: highlights camera, shows name tooltip

- [ ] **Person Indicators**:
  - Icon: Solid circle (10px diameter)
  - Color: Default blue `#4ECDC4`
  - Changes to yellow `#F7DC6F` when selected
  - Movement: position updates every frame (smooth interpolation)
  - Trail (optional toggle): faint line showing last 5s

- [ ] **Area Boundaries**:
  - Rendered as subtle polygon outlines
  - Color: white, opacity 0.2

- [ ] **Grid** (optional toggle):
  - Faint grid lines matching editor (every 5m)
  - Color: rgba(255, 255, 255, 0.1)

#### Ping Animation (Section 5.6.4)

- [ ] **Trigger**: Click person in 3D view, or click person in radar

- [ ] **Animation Sequence**:
  1. **Concentric Circles** (radar "ping"):
     - Origin: person's position
     - 3 circles expand outward
     - Stroke: yellow `#F7DC6F`, width 2px
     - Opacity: starts 1.0, fades to 0
     - Start radius: 0, End radius: 50px (scaled)
     - Duration: 1200ms ease-out
     - Circles released at 0ms, 200ms, 400ms (staggered)

  2. **Person Highlight**:
     - Indicator grows (10px → 14px over 300ms, bounce easing)
     - Color shifts to bright yellow
     - Glow effect (box-shadow: 0 0 20px rgba(247, 220, 111, 0.8))
     - Persists while person selected

  3. **Connection Line** (optional):
     - If person visible by a camera:
       - Draw dashed line from person to camera(s)
       - Color: camera color
       - Animation: dashes "travel" along line (200ms loop)

- [ ] **Sound** (optional):
  - Subtle "ping" sound effect (sonar-like)
  - Volume: 30% of system
  - Can be disabled in settings

#### Radar Interactions (Section 5.6.5)

- [ ] **Click Person Indicator**:
  - Selects person
  - Triggers ping animation
  - Shows person trail in 3D view
  - Updates person properties panel

- [ ] **Click Camera Indicator**:
  - Sets as active camera for PTZ control
  - Highlights camera in 3D view
  - Opens camera properties panel

- [ ] **Drag Radar**:
  - Reposition if not locked
  - Snap to corners: top-left, top-right, bottom-left, bottom-right

- [ ] **Zoom Radar**:
  - Mouse wheel: zoom in/out
  - Range: 0.5x to 3x
  - Pan: click and drag background

- [ ] **Context Menu** (right-click radar):
  - Toggle camera FOV wedges
  - Toggle person trails
  - Toggle grid
  - Lock position
  - Reset zoom

#### Radar Footer Stats (Section 5.6.6)

- [ ] Always visible at bottom of radar
- [ ] People count: "People: 5"
- [ ] Camera count: "Cameras: 4"
- [ ] Detections: "Detections: 12" (total person-camera pairs)
- [ ] Update rate: Real-time (30 FPS)

### Camera Vision Requirements (Section 6.7)

#### Visibility Pipeline

1. [ ] **Frustum Culling (Broad Phase)**:
   - Compute camera frustum from position, direction, elevation, FOV, depth, zoom
   - Test each person: Is position inside frustum?
   - If NO: skip, If YES: proceed to narrow phase

2. [ ] **Occlusion Testing (Narrow Phase)**:
   - For each person in frustum:
     - Ray-cast from camera to person
     - Check intersections with walls, shapes, area boundaries
     - Height check at each intersection:
       - Ray height = cameraHeight + (personHeight - cameraHeight) × t
       - If obstacle height >= ray height: OCCLUDED
   - If ray reaches person without full occlusion: VISIBLE

3. [ ] **Bounding Box Computation** (for POV feeds):
   - Create virtual PerspectiveCamera per camera entity
   - Set: position, rotation (tilt, pan), FOV/zoom, aspect, near, far
   - For each visible person:
     - Get person's 3D bounding box (capsule bounds)
     - Project 8 corners to camera view
     - Find min/max X, Y in screen space
     - Result: Bounding rectangle (x, y, width, height)

4. [ ] **POV Feed Rendering**:
   - Each camera renders to RenderTarget (texture)
   - Resolution: 720p default (scalable)
   - Update rate: 30 FPS (adjustable)
   - Post-process: Overlay bounding boxes

### Camera POV Feeds (Section 6.2.5)

- [ ] **Location**: Right Sidebar, Lower Section (below camera list)
- [ ] **Header**: "Camera Feeds" + grid size toggle (2×2, 3×3, 4×4)
- [ ] **Each feed tile**:

  ```
  ┌─────────────────────────┐
  │ ▒▒▒ Live Feed ▒▒▒       │
  │ ▒▒  📦  ▒▒              │ ← Bounding box on person
  │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒          │
  ├─────────────────────────┤
  │ cam-1 | 2 detections 🔴 │ ← Footer with badge
  └─────────────────────────┘
  ```

- [ ] **Tile styling**:
  - Border: 3px solid, camera's color
  - Active tile (selected camera): 4px border, glow effect
  - Real-time updates: 30 FPS

- [ ] **Bounding boxes**:
  - Rectangle overlays on detected people
  - Color: Yellow (for visibility)
  - Label: Person ID (e.g., "P1")
  - Thickness: 2px

- [ ] **Click tile**: Sets camera as active

---

## Dependencies

- Phase 9: 3D Simulation Core (Scene, people, cameras)
- Phase 10: 3D Advanced Features (PTZ, physics, active camera concept)

---

## Acceptance Criteria

### From Section 9 (QA)

- [ ] Radar shows all people and cameras in 2D
- [ ] Clicking person triggers ping animation (3 expanding circles)
- [ ] Person indicator highlights (yellow, grows, glows)
- [ ] Camera indicators show FOV wedges in radar color
- [ ] Radar stats footer updates in real-time
- [ ] Radar can be dragged and resized

### Additional Criteria

- [ ] Radar renders at 300px × 300px default
- [ ] Radar can be resized (200px to 500px)
- [ ] Radar can be dragged and repositioned
- [ ] Context menu shows toggle options
- [ ] Ping animation has 3 staggered concentric circles
- [ ] Connection lines show camera-person detection
- [ ] Camera POV feeds render at 30 FPS
- [ ] Bounding boxes appear on detected people in feeds
- [ ] Feed tiles have colored borders matching camera
- [ ] Grid size toggle changes feed layout (2×2, 3×3, 4×4)
- [ ] Detection count badge updates in real-time
- [ ] Clicking feed tile switches active camera

---

## Risks & Mitigations

| Risk                              | Mitigation                                    |
| --------------------------------- | --------------------------------------------- |
| Multiple RenderTarget performance | Limit to 4-6 active feeds; reduce resolution  |
| Bounding box flickering           | Use consistent projection; smooth transitions |
| Radar animation performance       | Use CSS animations; limit concurrent pings    |

---

## Mapping to PRD Sections

- Section 5.6: Radar Feature (entire section)
- Section 6.2.3: Top-Left Overlay (Radar position)
- Section 6.2.5: Right Sidebar (Camera POV Feeds)
- Section 6.7: Camera Vision Requirements (entire section)
