# Phase 13: Canvas Editor (Mapless)

**Timeline Reference**: Post-Phase 12 follow-up

---

## Phase Goal

Implement the Canvas Editor as the exact same editor as Map Mode, but with the map tiles removed. The implementation must only differ by omitting the `mapStyle` prop (or setting it to an empty value) so the editor renders without a styled map background.

---

## How Codex Should Use This Phase

- Treat Canvas Editor as a **visual-only** mode with full feature parity to Map Mode.
- Do **not** add new tools, data models, or interactions; only adjust map styling.
- The only required difference is the map styling input: **no `mapStyle` prop** or an **empty `mapStyle` value**.
- Keep all editing tools, selections, drawing behaviors, measurements, and constraints identical.
- Any Map-specific UI that is already gated in prior phases must remain gated (no new gating in this phase).

---

## Scope & Responsibilities

### Included

- Canvas Mode rendering using the same editor surface as Map Mode
- Removal of map tiles/styling by omitting `mapStyle` or passing an empty value
- Neutral grid background (if already supported) remains visible as the only background
- Mode toggle switches Map ↔ Canvas without any data changes

### Explicitly Excluded

- New UI components, tools, or shortcuts
- Changes to map controls, camera behaviors, or interaction logic
- New editor layout changes
- Any map style selection UI changes

---

## Deliverables

### Canvas Mode Implementation

- [ ] Canvas Mode uses the same editor component as Map Mode
- [ ] Map tiles are removed by **not providing `mapStyle`** or by passing **`""`**
- [ ] No additional style overrides are required beyond the empty/absent map style
- [ ] Mapbox/map surface still accepts the same event handlers and interaction logic

### Visual Parity

- [ ] All drawing tools behave identically between Map and Canvas modes
- [ ] Areas, walls, shapes, cameras, people, and overlays render the same
- [ ] Measurement tooltips and cursor states remain unchanged
- [ ] Selection and transform behaviors are identical

### Mode Toggle Behavior

- [ ] Map → Canvas toggle only affects map styling
- [ ] Canvas → Map restores the normal map style
- [ ] No state reset or object loss when toggling

---

## Acceptance Checklist

- [ ] Switching to Canvas Mode removes map tiles entirely
- [ ] Editor remains fully interactive with no feature loss
- [ ] Switching back to Map Mode restores map tiles and behaves normally
- [ ] No console errors related to map styling

