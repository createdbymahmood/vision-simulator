# Phase 10: 3D Advanced Features (Collision, Physics, PTZ)

**Timeline Reference**: Phase 3-4 from Section 8 (Weeks 7-9)

---

## Phase Goal

Implement advanced 3D simulation features including FOV collision visualization, people movement with physics/steering behaviors, collision avoidance, and PTZ controls in simulation. This phase brings the simulation to life with realistic agent motion and camera visibility feedback.

---

## How Codex Should Use This Phase

- Build on the Phase 9 scene: add physics/steering, collision visualization, and PTZ-in-3D without altering core schemas.
- Collision surfaces must follow the rendering rules (opacity, pulsing) and respond to camera/obstacle changes; compute selectively for performance.
- People movement must be deterministic (seeded RNG + fixed timestep) and respect all area/obstacle/person constraints.
- PTZ floating panel must mirror editor controls and be draggable/minimizable.
- Use toggles (global and per-camera) for collision visualization; do not remove frustum wireframes when disabled.

---

## Scope & Responsibilities

### Included

- 3D FOV collision visualization on obstacles
- People movement algorithm (steering behaviors)
- Collision avoidance (obstacles, people, area boundaries)
- PTZ controls in 3D simulation (floating panel)
- Trail visualization for selected person
- Deterministic simulation (seeded RNG)

### Explicitly Excluded

- Radar feature (Phase 11)
- Camera POV feeds (Phase 11)
- Recording/snapshot (Phase 12)

---

## Deliverables

### 3D FOV Collision Visualization (Section 5.4)

#### Collision Detection (Section 5.4.1)

- [ ] **Purpose**: Show where camera's 3D frustum intersects obstacles

#### Collision Surfaces Rendered

1. [ ] **Wall Intersections**:
   - Compute intersection polygon on wall surface
   - Render as quad mesh with camera's color
   - Opacity: 0.35
   - Effect: pulsing glow (0.3–0.4 opacity, 2s cycle)

2. [ ] **Shape Intersections**:
   - Compute intersection volume
   - Render intersection surface on shape
   - Opacity: 0.4
   - Optional: slight emission for highlight

3. [ ] **Floor Intersections** (FOV footprint):
   - Where FOV cone hits ground plane
   - Rendered as flat polygon
   - Camera color, opacity 0.15
   - Dashed outline (camera color, 2px)

4. [ ] **Area Boundary Intersections**:
   - Where FOV hits area edges
   - Rendered same as wall intersections

#### Collision Conditions (Section 5.4.2)

- [ ] **Wall Collision Rendering**:
  - Wall height >= ray height: Full occlusion (bright)
  - Wall height < camera height but > floor: Partial occlusion (opacity 0.2)
  - Consider wall thickness (front and back face)

- [ ] **Shape Collision Rendering**:
  - Solid shapes: Full occlusion
  - Height < camera height: only bottom part shown
  - Height >= camera height: full intersection surface
  - Line shapes: thin plane intersection

- [ ] **Multiple Obstacle Intersections**:
  - Render all collision surfaces
  - Additive blending for overlapping colors
  - Z-fighting prevention: depth offset per surface

#### Performance Optimization (Section 5.4.3)

- [ ] Compute collision geometry per frame only for:
  - Selected camera (always)
  - Cameras in viewport (if < 10 cameras)
  - Or: all cameras at 10 FPS update rate
- [ ] Use Three.js Raycaster with triangle intersection
- [ ] Cache static obstacle geometry
- [ ] Recompute only when:
  - Camera moves/rotates/zooms
  - Obstacles move/change
  - Area boundaries change

#### UI Controls (Section 5.4.4)

- [ ] **Collision Visualization Toggle** (3D view, top-right):
  - Icon: eye-slash
  - Label: "Show FOV Collisions"
  - Default: ON
  - When OFF: only FOV frustum wireframe

- [ ] **Per-Camera Toggle** (Properties panel):
  - "Show Collisions" checkbox
  - Per-camera visibility control

### Physics & Movement (Section 6.6)

#### People Movement Algorithm

1. [ ] **Steering Behaviors**:
   - Each person has:
     - Position (x, y)
     - Velocity (vx, vy)
     - Desired direction (wander behavior)
     - Speed (m/s, configurable)

2. [ ] **Forces Applied** (per frame):
   - **Wander force**: Random direction bias (smooth noise)
   - **Obstacle avoidance**: Repulsion from walls/shapes
     - Ray-cast ahead (3m), steer away if hit
     - Force proportional to proximity
   - **Person avoidance**: Repulsion from other people
     - If within 2m: apply repulsion force
     - Magnitude: Inverse square of distance
   - **Area boundary constraint**: Hard constraint (highest priority)
     - If within 1m of boundary: strong repulsion
     - If at boundary: velocity clamped

3. [ ] **Velocity Integration**:
   - Sum all forces
   - Apply to velocity with dt
   - Clamp velocity to person's speed
   - Update position
   - Hard clamp to area boundary
   - Reflect velocity if boundary hit

4. [ ] **Collision Detection**:
   - Spatial hash grid (10m × 10m cells)
   - Only test nearby objects
   - Continuous collision detection for high-speed

#### Deterministic Simulation (Section 6.6)

- [ ] Seed random number generator
- [ ] Fixed timestep (16.67ms = 60 FPS)
- [ ] Seed stored in scene export: `"simulationSeed": 12345`

#### Trail Recording (Section 6.6)

- [ ] Each person stores last N positions (N = 20s × 30 FPS = 600)
- [ ] Ring buffer for efficiency
- [ ] Trail rendered as LineGeometry with varying opacity

### Trail Visualization (Section 6.2.2)

- [ ] When person selected:
  - Trail: Line strip on ground plane
  - Color: Yellow (matching selected person)
  - Width: 2px
  - Length: Last 20 seconds of movement
  - Fades at older end (opacity 1.0 → 0.2)

### PTZ Controls in 3D Simulation (Section 5.5.4)

#### PTZ Panel in Simulation (Section 5.5.4)

- [ ] **Floating, draggable panel**
- [ ] Position: bottom-right by default (16px margins)
- [ ] Width: 280px, Height: 320px
- [ ] Backdrop blur, semi-transparent
- [ ] Minimize button (collapses to 48px × 48px floating icon)
- [ ] Drag handle at top
- [ ] **Content**: Same PTZ controls as editor (D-pad, sliders, presets)

#### Live Operation (Section 5.5.4)

- [ ] Adjusting PTZ updates:
  - 3D FOV frustum
  - Collision surfaces
  - Radar indicator (Phase 11)
  - Detection results (people visibility recalculated)

### Right Sidebar - Camera List (Section 6.2.5)

- [ ] **Collapsible, width: 360px**
- [ ] **Header**: "Cameras (4)" + collapse toggle
- [ ] **Each camera item** (64px height):
  ```
  ┌────────────────────────────────┐
  │ 🎥 cam-1      [PTZ] [Focus]    │
  │ FOV: 60° • Depth: 20m          │
  │ Detections: 2 🟢               │
  └────────────────────────────────┘
  ```
  - Color dot next to name
  - Click name: Opens properties
  - Click [PTZ]: Opens PTZ controls for that camera
  - Click [Focus]: Centers 3D view on camera
  - Grouped by area (if multi-area)

### People Rendering Updates

- [ ] Real-time movement (30 FPS)
- [ ] Position interpolation for smooth motion
- [ ] Selected person: Yellow `#F7DC6F`, with glow effect

---

## Dependencies

- Phase 9: 3D Simulation Core (Scene setup, world generation)
- Phase 6: Camera System (Camera entities with colors)
- Phase 7: People Placement (People entities)
- Phase 8: PTZ Controls (Editor PTZ implementation to reuse)

---

## Acceptance Criteria

### From Section 9 (QA)

- [ ] 3D FOV collision surfaces render on walls/shapes
- [ ] Collision surfaces update when camera moves or obstacles change
- [ ] Collision visualization toggle works
- [ ] PTZ controls adjust camera direction/tilt/zoom in real-time
- [ ] Person indicator highlights (yellow, grows, glows)

### Additional Criteria

- [ ] Camera FOV shows collision quads on wall intersections
- [ ] Collision surfaces pulse with glow effect
- [ ] Floor footprint renders as dashed polygon
- [ ] Collision toggle hides/shows surfaces globally
- [ ] Per-camera collision toggle works
- [ ] People wander around within area boundaries
- [ ] People avoid walls and shapes
- [ ] People avoid each other (2m separation)
- [ ] People bounce off area boundaries
- [ ] Simulation is deterministic (same seed = same motion)
- [ ] Selected person shows yellow trail on ground
- [ ] Trail fades at older end
- [ ] PTZ panel is floating and draggable
- [ ] PTZ panel minimizes to icon
- [ ] Camera list shows detection count
- [ ] Focus button centers view on camera

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Collision raycasting too slow | Limit rays (400-1000); update at 10 FPS for non-selected |
| Physics integration instability | Use fixed timestep; clamp velocities |
| Determinism broken by floating-point | Use consistent math library; test reproducibility |

---

## Mapping to PRD Sections

- Section 5.4: 3D FOV Collision Visualization (entire section)
- Section 5.5.4: PTZ Behavior in 3D Simulation
- Section 6.2.2: Main Viewport (Trail visualization)
- Section 6.2.5: Right Sidebar (Camera List)
- Section 6.6: Physics & Movement (entire section)




