# 07 — Canvas 2D Preview & Recording

## Goal
Add 2D top-down preview mode toggle and implement recording/snapshot exports for the simulation.

---

## Deliverables

### 7.1 2D Mode Toggle (Canvas Preview)
When toggled from 3D to 2D:
- Replace main view with top-down 2D simulation

**Keep active in 2D mode:**
- People movement animation
- Camera cones (vision polygons)
- Detection overlays

**Sidebar stays:**
- Right sidebar still shows camera POV feeds (3D rendered)

### 7.2 2D Simulation Rendering
Render the 2D view showing:
- Grid background
- All walls, shapes (top-down)
- Camera icons with occlusion-aware FOV wedges
- People as circles moving in real-time
- Selected person trail (if clicked)

### 7.3 Recording Feature
**Start Recording toggle in top bar:**
- Records the **main 3D viewport** exactly as seen (not the camera POV tiles)
- UI indicates "Recording…" state while active
- Toggle again to stop

**Implementation:**
- Use `canvas.captureStream()` from WebGL canvas
- Use MediaRecorder API
- File format: WebM (default)

**Edge case:**
- If user switches to 2D while recording: continue recording the current main viewport (changes included)

**On stop:**
- User downloads/saves output automatically

### 7.4 Snapshot Export
**Export Snapshot button in top bar:**
- Captures current frame from main viewport at high resolution
- Options: 1x or 2x scale
- Output format: PNG
- Auto-downloads the file

---

## Suggested Tools
- **React Konva** or **@react-three/fiber** canvas for capturing
- Native **MediaRecorder API** for video recording
- **canvas.captureStream()** for stream capture
- **file-saver** for download handling

---

## Acceptance Criteria
- [ ] 3D/2D toggle switches the main viewport correctly
- [ ] 2D mode shows top-down view with people moving
- [ ] Camera vision cones display in 2D mode
- [ ] Detection overlays work in 2D mode
- [ ] Camera POV feeds continue rendering in 2D mode
- [ ] Recording starts and shows "Recording…" indicator
- [ ] Recording captures the main viewport (not camera tiles)
- [ ] Stopping recording produces downloadable WebM file
- [ ] Switching 3D/2D during recording continues recording
- [ ] Snapshot exports high-resolution PNG of current viewport


