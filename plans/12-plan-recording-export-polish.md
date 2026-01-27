# Phase 12: Recording, Export & Polish

**Timeline Reference**: Phase 5 from Section 8 (Weeks 11-12)

---

## Phase Goal

Implement recording functionality (video capture of 3D view), snapshot export, JSON scene export, performance optimization, UI polish, animations, and final documentation. This phase completes the application with all export capabilities and production-ready quality.

---

## How Codex Should Use This Phase

- Treat this as the hardening phase: no new features beyond PRD, just exports/recording, performance, micro-interactions, and docs.
- Implement recording/snapshot/export exactly with filenames, overlays, timers, and flash/pulse effects; they are part of acceptance.
- Optimize where specified (instancing, LOD, capped feeds) but avoid altering behavior; performance targets are 30 FPS with 10+ cameras and 20+ people.
- Ensure every cursor, tooltip, and animation from prior phases is present; this phase is the final QA sweep.
- Deliver documentation (user guide, shortcuts, schema) so future work does not require rereading PRD.
- Keep optional items labeled as optional; do not silently drop them.

---

## Scope & Responsibilities

### Included

- Video recording of 3D simulation
- Snapshot export at high resolution
- Scene JSON export
- Performance optimization
- UI polish and animations (all specified micro-interactions)
- Final documentation

### Explicitly Excluded

- New features beyond PRD scope
- Backend/account system (explicit non-goal)

---

## Deliverables

### Recording (Section 6.8)

#### Start Recording

- [ ] Click "Start Recording" button in top bar
- [ ] **UI changes**:
  - Button: Red background, pulsing animation
  - Label: "Stop Recording"
  - Timer appears: `"REC 00:00"` (MM:SS format)
  - Red dot icon: Pulsing (scale 1.0 ↔ 1.2, 1s cycle)

#### Recording Implementation

- [ ] Use canvas `captureStream(30)` for 30 FPS
- [ ] MediaRecorder with `video/webm;codecs=vp9`
- [ ] Video bitrate: 8 Mbps (8000000)
- [ ] Collect data chunks on `ondataavailable`

#### During Recording

- [ ] Timer updates every second
- [ ] Simulation continues normally
- [ ] User can:
  - Change camera focus (recorded)
  - Adjust PTZ (recorded)
  - Switch areas (recorded)
  - Toggle map visibility (recorded)
- [ ] Performance: Maintain 30 FPS minimum
- [ ] Show warning if FPS drops below threshold

#### Stop Recording

- [ ] Click "Stop Recording"
- [ ] MediaRecorder stops
- [ ] Blob created from chunks
- [ ] **Auto-download**:
  - Filename: `simulation_YYYY-MM-DD_HH-MM-SS.webm`
  - Option for "Save As"

#### Recording Indicator (Section 6.8)

- [ ] Always visible during recording (top-right corner)
- [ ] Red dot + "REC" + timer
- [ ] Subtle red border around viewport (2px, opacity 0.6)

#### Optional Recording Features

- [ ] Timestamp overlay: Burned into video (top-left, small font)
- [ ] Camera info overlay: Shows camera name on PTZ adjust
- [ ] Quality presets: 720p/1080p/4K selection before recording

### Snapshot Export (Section 6.9)

#### Snapshot Button

- [ ] Location: Top bar, right section
- [ ] Icon: Camera
- [ ] Label: "Snapshot"

#### Click Behavior

- [ ] Freezes current frame
- [ ] Renders at high resolution:
  - Default: 2× current viewport resolution
  - Optional: User selects (1×, 2×, 4×) in dropdown

#### Rendering

- [ ] Scale renderer to target resolution
- [ ] Render single frame
- [ ] Get image data as PNG (`toDataURL('image/png')`)
- [ ] Restore original size

#### Download

- [ ] Auto-download: `snapshot_YYYY-MM-DD_HH-MM-SS.png`

#### Post-Snapshot

- [ ] Brief flash effect (white overlay, 100ms)
- [ ] Success toast: `"✓ Snapshot saved"`

#### Optional Snapshot Features

- [ ] Include overlays: Option to include/exclude Radar and PTZ panel
- [ ] Annotations: Quick annotation mode (draw arrows, add text)

### Scene JSON Export (Section 5.1.1 Right Section)

- [ ] Export dropdown includes "Scene JSON"
- [ ] Click exports complete scene as JSON file
- [ ] Filename: `scene_YYYY-MM-DD_HH-MM-SS.json`
- [ ] Schema matches Section 7.1 Scene Root

### Scene Image Export (Section 5.1.1 Right Section)

- [ ] Export dropdown includes "Scene Image"
- [ ] Captures 2D editor view as PNG
- [ ] Similar process to 3D snapshot

### Performance Optimization (Section 6.5, 5.4.3)

- [ ] **3D Rendering**:
  - Use instanced rendering for similar objects
  - LOD (Level of Detail) for distant objects
  - Frustum culling
  - Occlusion culling where beneficial

- [ ] **FOV Collision** (Section 5.4.3):
  - Selected camera: compute every frame
  - Non-selected in viewport (< 10): compute per frame
  - Many cameras: 10 FPS update rate
  - Cache static obstacle geometry
  - Recompute only on change

- [ ] **POV Feeds**:
  - Limit to 4-6 active feeds
  - Reduce resolution if needed
  - Skip rendering for off-screen feeds

- [ ] **General**:
  - Debounce state updates (300ms for properties)
  - Virtualize long lists (camera list, area list)
  - Lazy load 3D simulation module

### UI Polish & Animations

#### All Micro-interactions from PRD

- [ ] **Map/Canvas Toggle**: 200ms ease transition
- [ ] **Properties Panel Slide-in**: 300ms ease-out
- [ ] **Camera placement drop-in**: scale 0.8→1.2→1.0, 300ms bounce
- [ ] **Person placement**: fade-in 200ms, pulse 1.0→1.15→1.0
- [ ] **Area creation confetti**: 3 particles, quick
- [ ] **First area tools glow**: brief highlight when enabled
- [ ] **Cursor dot pulse**: scale 1.0→1.1, 1s cycle (area drawing)
- [ ] **Dashed line flow**: toward cursor, 2s loop
- [ ] **Vertex hover expand**: 8px→10px scale
- [ ] **Close indication pulse**: first vertex faster pulse
- [ ] **Measurement tooltip fade**: in 100ms, out 200ms
- [ ] **PTZ Reset animation**: 500ms ease-out smooth transition
- [ ] **FlyTo animation**: 1000ms ease-in-out, smooth arc
- [ ] **Mode switch fade**: 400ms texture transition
- [ ] **Focus selection**: 800ms ease-out camera move
- [ ] **Radar ping circles**: 1200ms ease-out, staggered at 0/200/400ms
- [ ] **Person highlight bounce**: 10px→14px, 300ms bounce easing
- [ ] **Connection line dash travel**: 200ms loop
- [ ] **Collision surface pulse**: 0.3→0.4 opacity, 2s cycle
- [ ] **Recording dot pulse**: scale 1.0↔1.2, 1s cycle
- [ ] **Snapshot flash**: white overlay, 100ms

#### Cursor States Verification

- [ ] All cursors match Section 5.8 specifications
- [ ] Area: crosshair + 12px blue dot
- [ ] Wall: crosshair + 8px red dot
- [ ] Camera: 24px icon + range circle
- [ ] Person: 20px icon + collision radius
- [ ] Invalid: not-allowed + red tint
- [ ] Selection hover: pointer
- [ ] Dragging: move
- [ ] Resize handles: correct resize cursors
- [ ] Rotate handle: custom rotate cursor

### Documentation

- [ ] User guide with screenshots
- [ ] Keyboard shortcuts reference
- [ ] Known limitations
- [ ] API documentation for scene JSON format
- [ ] Developer setup guide (if open source)

### Final QA Checklist (Section 9)

#### Camera Features

- [ ] Each camera has unique color from palette
- [ ] Camera colors visible in: editor FOV, 3D frustum, POV tile border, radar
- [ ] PTZ controls adjust camera direction/tilt/zoom in real-time
- [ ] PTZ presets save and load correctly
- [ ] 3D FOV collision surfaces render on walls/shapes
- [ ] Collision surfaces update when camera moves or obstacles change
- [ ] Collision visualization toggle works

#### Measurement Tooltips

- [ ] Area drawing shows current segment length
- [ ] Wall drawing shows length and angle
- [ ] Shape drawing shows dimensions (W×H, radius, etc.)
- [ ] Tooltips follow cursor or snap to midpoint
- [ ] Tooltips disappear when drawing completes

#### Radar

- [ ] Radar shows all people and cameras in 2D
- [ ] Clicking person triggers ping animation (3 expanding circles)
- [ ] Person indicator highlights (yellow, grows, glows)
- [ ] Camera indicators show FOV wedges in radar color
- [ ] Radar stats footer updates in real-time
- [ ] Radar can be dragged and resized

#### Cursor States

- [ ] Area drawing cursor: crosshair + 12px blue dot
- [ ] Wall drawing cursor: crosshair + 8px red dot
- [ ] Invalid placement cursor: not-allowed + red tint
- [ ] Camera placement cursor: camera icon + range circle
- [ ] All cursors match specifications

#### Drawing Lines

- [ ] Area polygon lines are dashed (8px dash, 4px gap)
- [ ] Wall preview lines are solid with actual thickness
- [ ] Shape previews show dashed borders
- [ ] All dashed lines have smooth animations

---

## Dependencies

- All previous phases (1-11) must be complete

---

## Acceptance Criteria

- [ ] Recording captures 3D view at 30 FPS as WebM
- [ ] Recording shows timer and red indicator
- [ ] Recording auto-downloads on stop
- [ ] Snapshot captures at 2× resolution
- [ ] Snapshot shows flash and success toast
- [ ] Scene JSON export produces valid, importable file
- [ ] All micro-interactions match PRD specifications
- [ ] Performance maintains 30 FPS with 10+ cameras and 20+ people
- [ ] All QA checklist items from Section 9 pass
- [ ] Documentation is complete and accurate

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Recording performance impact | Reduce quality if FPS drops; show warning |
| Large scene exports | Compress JSON; warn user of file size |
| Animation jank | Use CSS transforms; avoid layout thrashing |
| Browser compatibility | Test on Chrome, Firefox, Safari; document requirements |

---

## Mapping to PRD Sections

- Section 5.1.1: Export dropdown (Scene JSON, Scene Image)
- Section 6.8: Recording (entire section)
- Section 6.9: Snapshot Export (entire section)
- Section 8: Implementation Roadmap (Phase 5)
- Section 9: QA Enhanced Acceptance Criteria (entire section)

---

## Open Questions / Assumptions

### From Ambiguities in plan.md

1. **Bundle Export**: Listed as "future" in Export dropdown - not implemented in MVP
2. **Processors**: Listed in device picker as "placeholders" - implementation deferred
3. **Physical PTZ motor simulation**: Explicitly excluded (Section 2.2)
4. **Annotations on snapshot**: Listed as "optional" - may be deferred
5. **Quality presets for recording**: Listed as "optional" - may be deferred
6. **Sound for ping**: Listed as "optional" - may be deferred
7. **Timestamp overlay in recording**: Listed as "optional" - may be deferred
8. **Bezier curve sampling rate**: 1000 points per curve specified - verify if sufficient
9. **Spatial hash grid cell size**: 10m × 10m specified - verify performance
10. **Trail history buffer size**: 600 positions (20s × 30FPS) - verify memory usage




