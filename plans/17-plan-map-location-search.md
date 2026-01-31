# Phase 17: Map Location Search Dialog (Mapbox-First)

**Timeline Reference**: Post-Phase 16 follow-up

---

## Phase Goal

Enable location search using the existing search dialog. The user can type a query, which is debounced, and all matching locations are listed in that dialog. The right-rail entry for this feature must only be available in **Map Mode**. Prefer **Mapbox Geocoding** as the search provider.

---

## How Codex Should Use This Phase

- Reuse the existing search-location dialog (do not create a new dialog).
- The right-rail item for **Search Location** is visible only when `sceneMode === 'map'`.
- Remove/disable the "Adjust map style" shortcut from this right-rail section; the search action is the only map-mode entry there.
- Input is debounced; results are fetched after the debounce interval and listed immediately in the dialog.
- Use Mapbox Geocoding API as the primary provider for search.

---

## Scope & Responsibilities

### Included

- Map-mode-only right-rail entry for Search Location.
- Debounced query input in the existing dialog.
- Query results list rendered in the dialog.
- Selecting a result pans/zooms the map to the location.
- Mapbox Geocoding integration (forward geocoding for user queries).

### Explicitly Excluded

- New dialog or new sidebars.
- Search controls visible in Canvas Mode.
- Non-map UI shortcuts beyond Search Location in the right rail.
- Pagination or infinite scroll for results.

---

## Deliverables

### Right Rail (Map Mode Only)

- [ ] Show the Search Location shortcut only when `sceneMode === 'map'`.
- [ ] Hide/remove the "Adjust map style" shortcut from this right-rail section.
- [ ] Clicking Search Location opens the existing dialog.

### Dialog: Search Input + Results

- [ ] Query input uses a debounced value (e.g., 250–400ms) before firing a search.
- [ ] Debounced query is trimmed and ignored when empty.
- [ ] All matching locations are listed in the dialog (no pagination required).
- [ ] Results show a readable name and context (city/region/country when available).
- [ ] Empty state shown when no results are returned.
- [ ] Loading state shown while fetching.

### Mapbox Geocoding (Preferred Provider)

- [ ] Use Mapbox forward geocoding for query search.
- [ ] Use the existing Mapbox access token configuration.
- [ ] Keep requests lightweight (limit result count to a reasonable number, e.g., 5–10).
- [ ] Handle rate limits and errors with a user-friendly message.
- [ ] Optional: cache last N queries in memory to avoid repeat calls.

### Map Interaction

- [ ] Selecting a result pans/zooms the map to the chosen location.
- [ ] Preserve current map state when closing the dialog.
- [ ] If map instance is not ready, selection is safely ignored or queued.

---

## Acceptance Checklist

- [ ] Search Location shortcut appears only in Map Mode.
- [ ] "Adjust map style" shortcut is not shown in the same right-rail location.
- [ ] Query input is debounced and triggers Mapbox location lookup.
- [ ] All matching locations render in the dialog list.
- [ ] Selecting a result moves the map to that location.
