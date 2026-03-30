# Map Style and Search

Map styles apply only in Map Mode. Supported styles are street, satellite, traffic, and osm. To change styles, click Map Style in the right sidebar, select a style in the dialog, and the map updates immediately. The selected style is stored in the scene and restored on reload.

Canvas Mode uses a grid background. Plans describe two behaviors: a visual-only grid when map tiles are hidden and a Mapbox grid style that thins out as you zoom out. If your build uses the grid style variant, you will see fewer grid lines at lower zoom levels.

Location Search is Map Mode only. Click Search Location in the right sidebar or press Cmd+K, type a location name, and wait for results after a short debounce. Select a result to fly the map to that location. The dialog shows loading and empty states, results include name and context, and results are typically limited to a small set for speed.
