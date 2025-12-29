# 05 — Canvas 3D Simulation Preview

## Goal
Build the 3D simulation view with Three.js, including world generation, physics, and people movement.

---

## Deliverables

### 5.1 Preview Page Layout
**Page Header:**
- Title: **Simulation Analysis**
- Description text: "• Click a person to select and show trail"

**Layout Regions:**
1. **Top bar (fixed):** Start Recording toggle, Export Snapshot
2. **Under top bar (top-left):** Toggle 3D/2D (default 3D)
3. **Main viewport:** 3D world view
4. **Right sidebar (collapsible):**
   - Top: 2D mini view of camera layouts + people
   - Bottom: Camera POV tiles (CCTV feeds) — camera-count number of tiles

### 5.2 3D World Generation (Three.js)
- Extrude 2D walls/shapes into 3D geometry using each object's height
- Floor plane: grid textured
- Lighting: directional + ambient (enough for depth cues)

**Geometry:**
- Walls: extruded planes with thickness
- Shapes: extruded meshes
- People: capsule mesh or cylinder + sphere head
- Cameras: simple model (cone + box)

**Materials:**
- Not photorealistic but physically consistent
- Neutral colors
- Opacity affects visuals only; occlusion is binary

**Default Heights:**
- Person: 1.7m
- Wall: 3m
- Shape: 1m (configurable)
- Camera: 2.5m

### 5.3 3D Camera Controls
- Orbit controls: rotate around focus point, pan, zoom in/out
- Focus selection: selecting a person can center camera on them (recommended toggle)

### 5.4 Physics & People Movement
**People Movement:**
- People move continuously avoiding: walls, shapes, other people

**Collision Model:**
- People: circles (2D) with radius
- Walls: segments with thickness → capsules/rects
- Shapes: polygon obstacles / circle obstacles

**Motion Planning (choose one):**
- Navigation mesh (advanced) OR
- Velocity obstacles / RVO-lite (practical, recommended) OR
- Grid-based A* with smoothing

**Constraints:**
- No "tunneling" through walls at high speed (use continuous collision detection or small fixed timestep)
- Deterministic simulation option (seeded random) for reproducible recordings

### 5.5 Simulation Boundaries (Canvas)
- People roam within the "walkable region"
- If no boundary defined: use bounding box around placed objects + margin

### 5.6 Trail Feature
When person clicked:
- Highlight selected person
- Show trail (path history for last 20 seconds)
- Trail reflects actual movement path

---

## Suggested Tools
- **Three.js** for 3D rendering
- **@react-three/fiber** for React integration with Three.js
- **@react-three/drei** for orbit controls and helpers
- **cannon-es** or built-in collision detection for physics

---

## Performance Targets
- 60 FPS with: 20 cameras @ 720p, 30 people, 200 obstacle segments
- Degrade gracefully if needed (lower shadow quality, reduce ray count)

---

## Acceptance Criteria
- [ ] 3D world generates from 2D scene data correctly
- [ ] Walls, shapes, people, cameras render as 3D meshes
- [ ] Orbit controls work (rotate, pan, zoom)
- [ ] People move and avoid walls/shapes/other people
- [ ] People never pass through obstacles ("tunneling" prevented)
- [ ] Clicking a person highlights them and shows trail
- [ ] 2D mini view in sidebar shows camera layouts + people


