# 06 — Camera Vision System & CCTV Feeds

## Goal
Implement realistic camera visibility with occlusion, height awareness, and multi-camera CCTV-like POV feeds.

---

## Deliverables

### 6.1 Camera Vision Model
Each camera simulates:
- **Frustum**: position (x, y, height), direction (yaw), FOV (horizontal), depth (max distance), zoom
- **Occlusion** by obstacles
- **Person visibility**: whether person's body intersects visible region

### 6.2 2D Occlusion (Top-down Visible Polygon)
Compute visible polygon for each camera:
- Cast N rays (default: 400, adaptive recommended up to 2000)
- Ray angles span `direction ± FOV/2`
- For each ray: find closest intersection with obstacles, clamp to depth if no intersection
- Result is a polygon fan

**Accuracy:**
- More rays → smoother edges
- Adaptive sampling: extra rays near intersection discontinuities (advanced)

**Caching:**
- Cache results and recompute only when camera transforms or obstacle geometry changes

### 6.3 Height-aware Occlusion (3D)
An obstacle blocks vision only if:
- Obstacle height ≥ ray height at intersection, OR
- Person height is behind obstacle's top relative to camera

**Algorithm:**
- For each person candidate in 2D visible polygon:
  - Test line-of-sight with segment intersections
  - If intersection exists: compare obstacle height to "line from camera to target" height
- Person height default: 1.7m (configurable)

### 6.4 Person Visibility Determination
A person is "visible" if:
- Within depth
- Within FOV angle
- Not occluded by obstacles (considering height)
- Partial visibility allowed (if part visible, still counts as visible)

### 6.5 Camera POV Feeds (CCTV)
**Per-camera Three.js Camera:**
- Each camera produces a live "CCTV" view
- Use per-camera Three.js camera rendering to texture
- Display textures in UI tiles in right sidebar

**Resolution:**
- Default: 1280×720 per camera
- Scale down dynamically for performance

### 6.6 Bounding Box Rendering
For each camera POV showing a visible person:
- Compute person 3D bounds (capsule)
- Project bounds corners into camera view space
- Convert to 2D pixel coords
- Overlay bounding box on the CCTV tile

**Requirement:**
- If any person is clicked/selected, show rectangle on each camera's POV where that person is visible

### 6.7 Performance Optimization
**Two-phase pipeline:**
1. **Broad phase (fast):** Use spatial index to query nearby obstacles and candidate people within camera depth and FOV wedge
2. **Narrow phase (accurate):** Line-of-sight tests, height checks, bounding box projection

**Scaling:**
- Support 10–50 cameras, 10–100 people, hundreds of obstacle segments
- Avoid O(Cameras × Rays × Obstacles) naive approach

---

## Suggested Tools
- **Three.js** render targets for camera POV textures
- **rbush** or **flatbush** for spatial indexing (R-tree)
- Custom ray casting implementation or three-mesh-bvh

---

## Acceptance Criteria
- [ ] Camera vision polygon renders correctly with occlusion
- [ ] Vision updates when camera properties or obstacles change
- [ ] Height-aware occlusion works (short obstacles don't block tall targets)
- [ ] Each camera has a live POV feed in the sidebar
- [ ] Bounding boxes overlay on camera feeds for visible people
- [ ] Clicking a person shows bounding boxes on all camera feeds where visible
- [ ] Performance remains smooth with 20 cameras and 30 people


