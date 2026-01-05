- Angle/grid snapping: no 45° snapping or grid snapping implemented yet.
- Triangle drag mode: only 3-click triangles exist; drag-to-equilateral mode is absent.
- Enhanced cursors: wall/shape tools use the map crosshair cursor but don’t show the required crosshair + 8px red
  dot/ghost previews.
- Invalid placement visuals: we only show a not-allowed cursor/tooltip; no red-tinted previews/clip behavior at
  boundaries.
- Wall self-intersection warnings: no icons/tooltips for self-intersections.
- Boundary exit/overlap feedback: no red preview/error when walls/shapes (or areas) would exit or overlap; areas
  can still overlap because overlap blocking was removed.
