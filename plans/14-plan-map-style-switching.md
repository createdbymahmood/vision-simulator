# Phase 14: Map Style Switching

**Timeline Reference**: Post-Phase 13 follow-up

---

## Phase Goal

Enable map style switching from the existing right-rail Map Style button and its dialog (the one currently showing "Coming soon"). The selected style must update `mapStyle` and apply immediately in Map Mode.

`"mapStyle": "satellite|street|traffic|osm"`

---

## How Codex Should Use This Phase

- Use the existing right-rail Map Style button and `MapStyleDialog`; do **not** add a new sidebar or menu.
- Replace the "Coming soon" rows in the dialog with selectable controls for each style.
- Styles must use the exact `SceneMapStyle` values: `satellite`, `street`, `traffic`, `osm`.
- Apply changes immediately on selection (no extra confirmation step).
- Keep behavior and layout consistent with the current editor UI patterns.

---

## Scope & Responsibilities

### Included

- Map style selection UI inside the existing Map Style dialog
- Wiring the selection to scene meta `mapStyle`
- Map view reads `mapStyle` and updates the rendered tiles
- Default selection reflects the active style

### Explicitly Excluded

- New map providers or new style types beyond the four listed
- Any new right-rail buttons or navigation changes
- Any changes to Canvas Mode behavior beyond ignoring map styles

---

## Deliverables

### Map Style Dialog (Right Rail)

- [ ] Map Style button opens the existing dialog
- [ ] Dialog lists `street`, `satellite`, `traffic`, `osm` as selectable options
- [ ] "Coming soon" labels are removed
- [ ] Active style is clearly indicated (radio/check/selected state)
- [ ] Selecting a style updates `scene.meta.mapStyle`

### Map Rendering

- [ ] Map view uses `scene.meta.mapStyle` to choose tile style
- [ ] A single mapping table handles all four styles
- [ ] Switching styles updates the map without breaking interactions
- [ ] Overlays, tools, and selections remain unchanged

### Persistence & Defaults

- [ ] New scenes default to `street` unless overridden
- [ ] Scene JSON serialization includes `mapStyle`
- [ ] Loading a scene restores the saved map style

---

## Acceptance Checklist

- [ ] Clicking the right-rail Map Style button opens the dialog with selectable styles
- [ ] Selecting `satellite|street|traffic|osm` updates the map immediately
- [ ] The dialog clearly shows the current active style
- [ ] Map tools and overlays remain unchanged after switching styles
- [ ] Map style persists across reloads and scene serialization
