# Phase 16: Canvas Mode Mapbox Grid Styles

**Timeline Reference**: Post-Phase 14 follow-up

---

## Phase Goal

Keep Map/Canvas mode switching as-is, but when in Canvas Mode the background must render a Mapbox-driven grid via `mapStyle`. The grid must thin out as users zoom out to avoid excessive line density. This must be achieved **only** through Mapbox style configuration (sources/layers/zoom-dependent styling) and **not** by drawing grids in the canvas or any other custom rendering path.

---

## How Codex Should Use This Phase

- Reuse the existing mode toggle (Map/Canvas) and `mapStyle` plumbing.
- In Canvas Mode, the background uses a Mapbox style that renders grid lines.
- Grid density must be controlled **inside the Mapbox style** using zoom-based rules (e.g., layer `minzoom`/`maxzoom`, zoom stops, or multiple grid layers for different scales).
- No custom canvas/grid rendering is allowed.

---

## Scope & Responsibilities

### Included

- Define or reference Mapbox styles that render grids (one or more styles).
- Canvas Mode background uses the grid Mapbox style(s).
- Zoomed-out views reduce visible grid density via Mapbox style rules.
- Map Mode behavior remains unchanged.

### Explicitly Excluded

- Any custom grid drawing in canvas or WebGL overlays.
- Adding new rendering engines or non-Mapbox grid systems.
- Changing the existing Map/Canvas mode UI or switching flow.

---

## Deliverables

### Mapbox Grid Styles

- [ ] Create or reference Mapbox style URL(s) that render grid lines.
- [ ] Grid line density changes with zoom using Mapbox style rules.
- [ ] Grid styles are versioned or documented to ensure stable usage.

### Canvas Mode Integration

- [ ] Canvas Mode uses a Mapbox style (grid style) as its background.
- [ ] Switching to Canvas Mode swaps to the grid `mapStyle` automatically.
- [ ] Switching back to Map Mode restores the user-selected map style.

### Zoom-Dependent Density

- [ ] Fine grid lines appear only at higher zoom levels.
- [ ] Coarser grid lines remain at lower zoom levels.
- [ ] At extreme zoom-out levels, the grid does not overwhelm the view.

### Persistence & Defaults

- [ ] Scene/meta state tracks the active `mapStyle` for Map Mode.
- [ ] Canvas Mode uses a dedicated grid style (or a derived style variant).
- [ ] Switching modes does not overwrite the saved Map Mode style.

---

## Acceptance Checklist

- [ ] Canvas Mode displays a Mapbox-rendered grid background.
- [ ] Grid density decreases as the user zooms out.
- [ ] No custom grid drawing is used anywhere in Canvas Mode.
- [ ] Map Mode continues to use the previously selected map style.
- [ ] Switching modes does not lose the user's Map Mode style selection.
