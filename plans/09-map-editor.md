# 08 — Map Editor

## Goal
Build the Map Editor with Mapbox integration, area creation, and device/object placement constrained to areas.

---

## Deliverables

### 8.1 Map Editor Layout
**Regions:**
- Main map (Mapbox)
- Bottom navigation (fixed)
- Right-side vertical grid buttons (fixed)
- Properties panel (right slide-over)
- CMDK dialogs & popovers

### 8.2 Bottom Navigation (Map)
1. **Mode popover:** Hand mode / Selector mode
   - Hand mode: map drag/pan enabled, object selection disabled
   - Selector mode: selection enabled, map drag limited unless clicking empty space
2. **Create Area tool** (two types):
   - Point-to-point polygon
   - Pen mode (Bezier curves / curved segments)
3. **Shapes tool** (same as Canvas)
4. **Device placement** (CMDK dialog with search)
5. **Place Person** (dedicated tool for placing people)

### 8.3 Area Creation & Management
**Area Entity:**
- id, name (auto: area-1, area-2...)
- geometry: polygon with optional curves (control points + baked polygon)
- point count
- style: fill color/opacity, border color/width

**Click-to-point Polygon Mode:**
- Click adds vertex
- Ghost line previews closure
- Double-click closes polygon

**Pen Tool (Photoshop-like):**
- Click to add anchor
- Drag to create Bezier handles
- Curves sampled into polyline for rendering & physics
- Double-click closes polygon

**Area Constraints:**
- Areas must be closed
- Minimum vertices: 3

### 8.4 Placement Constraints (Critical)
**Nothing placeable outside areas:**
- Cursor becomes `not-allowed` outside areas
- Click produces "invalid placement" feedback (toast/snackbar or inline hint)

**Shapes & walls on map:**
- Must be created fully inside an area
- If drawing would go outside: block and show warning

**If multiple areas overlap:**
- Placement uses the topmost/nearest area (user picks active area or nearest centroid)

### 8.5 Device Picker (CMDK Dialog)
Triggered from bottom nav "device tool":

**CMDK Contents:**
- Search input
- Sections: Cameras, Processors, Recent

**Camera Types (with defaults):**
- Basic security (medium FOV, medium depth)
- Wide angle (wide FOV)
- Telephoto (narrow FOV, long depth)
- Panoramic (up to 180° FOV)
- Indoor
- Outdoor

Each type has default: FOV, depth, height, zoom

**Workflow:**
- User selects a camera type → CMDK closes
- Cursor changes to placement mode
- Click in area places camera
- Cannot place outside area

### 8.6 Right-side Vertical Grid Buttons
1. **Search location**
   - CMDK prompt: type city/country
   - Uses Mapbox geocoding
   - On selection: flyTo location

2. **Area management**
   - List: area name, point count
   - Clicking area: map flies to fit bounds of area

3. **Map view mode popover**
   - Satellite
   - Street
   - Traffic
   - OSM Mapnik

4. **Devices in use**
   - Group by area (collapsible sections)
   - Each device item: icon, name/type
   - Click selects it on map & opens properties
   - Shows count badges per area

---

## Suggested Tools
- **Mapbox GL JS** (react-map-gl for React wrapper)
- **@mapbox/mapbox-gl-geocoder** for location search
- **cmdk** for command palette
- **turf.js** for geospatial calculations (point-in-polygon, etc.)

---

## Acceptance Criteria
- [ ] Mapbox map renders with pan/zoom
- [ ] Hand mode vs Selector mode toggle works
- [ ] Area creation works (point-to-point and pen modes)
- [ ] Double-click closes area polygons
- [ ] Cursor shows `not-allowed` outside areas
- [ ] Objects cannot be placed outside areas
- [ ] Device picker CMDK shows camera types with search
- [ ] Selecting camera type enables placement mode
- [ ] Location search works with flyTo animation
- [ ] Area management list with flyTo on click
- [ ] Map style switcher works (satellite, street, traffic, OSM)
- [ ] Devices in use panel shows grouped by area


