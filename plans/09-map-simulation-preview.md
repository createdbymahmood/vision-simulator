# 09 — Map Simulation Preview

## Goal

Build the Map simulation preview with 3D view, 2D overlay, area selection, and camera feeds.

---

## Deliverables

### 9.1 Map Preview Layout

**Differences from Canvas Preview:**

- Default: **3D only** main view (no 2D mode toggle like Canvas)
- Has **area dropdown** (top-left) + fly animation
- Has **map visibility toggle** (default ON; label "Map view")

**Regions:**

1. **Top bar:** Start Recording, Export Snapshot
2. **Top-left controls:** Area dropdown, Map visibility toggle
3. **Main viewport:** 3D simulation view
4. **Top overlay:** 2D top-down camera cones + people moving (overlay on 3D)
5. **Right sidebar:** Camera list + POV feeds (CCTV)

### 9.2 Area Dropdown Behavior

**Default value:**

- "Nearest area to the view when user clicked Live Preview"

**Changing selection:**

- flyTo area bounds (animation)
- Updates active simulation boundary for people

### 9.3 Map Visibility Toggle

Switch ON/OFF:

- When OFF: map texture disappears (ground becomes neutral plane)
- Objects remain visible

### 9.4 3D World Generation (Map)

Same as Canvas 3D but:

- Ground can show map texture (from Mapbox) or neutral plane
- Geo-coordinates converted to local meters for rendering
- Area boundaries define the simulation region

### 9.5 Simulation Boundaries (Map)

- People must remain inside selected area polygon
- People belong to a specific area
- Cannot roam across areas (single-area simulation per selection)

### 9.6 2D Overlay

Top overlay on the main viewport shows:

- Camera FOV cones (top-down)
- People positions moving
- This is a transparent overlay, not a mode switch

### 9.7 Camera Feeds (Right Sidebar)

Same as Canvas:

- Real-time CCTV POV feeds for each camera
- Bounding boxes on visible people
- Click camera in list to highlight

### 9.8 Recording & Snapshot

Same implementation as Canvas:

- Recording captures main 3D viewport (WebM)
- Snapshot exports PNG
- Continues recording if settings change (map toggle, area switch)

---

## Suggested Tools

- **Three.js** / **@react-three/fiber** for 3D rendering
- **Mapbox GL JS** for map tiles integration (or capture as texture)
- **react-map-gl** for React integration
- Same recording/snapshot implementation as Canvas

---

## Acceptance Criteria

- [ ] Map preview opens with 3D view by default
- [ ] Area dropdown shows all areas and flies to selected area
- [ ] Default area is nearest to current view
- [ ] Map visibility toggle works (map texture on/off)
- [ ] 3D world generates from map scene data
- [ ] People move within selected area boundaries only
- [ ] 2D overlay shows camera cones and people positions
- [ ] Camera POV feeds render in real-time
- [ ] Bounding boxes appear on camera feeds for visible people
- [ ] Recording and snapshot export work correctly

