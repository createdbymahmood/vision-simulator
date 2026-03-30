# 3D View and Collision

The 3D view renders a simulation world based on your editor scene. Walls, shapes, cameras, and people are shown as 3D meshes with lighting and shadows. The ground plane is textured with Mapbox tiles in Map Mode and a neutral grid in Canvas Mode, and the Map View toggle swaps tiles for a grid. Switching Map and Canvas uses a smooth texture fade.

Areas render as semi-transparent vertical boundaries about 0.5m tall to indicate perimeter. Walls render as boxes with thickness and height, and shapes render as the appropriate 3D meshes. Cameras appear as small meshes with color accents and direction indicators. People appear as capsule-style meshes, with selected people highlighted in yellow. Lighting is provided by directional, ambient, and hemisphere lights to avoid overly dark areas.

Each camera renders a frustum wireframe in its color and semi-transparent frustum planes. Collision overlays show where a camera frustum intersects walls, shapes, the floor footprint, and area boundaries. Overlays are always visible in 3D preview, are height-aware for partial occlusion, and do not alter base obstacle colors. A subtle pulse can animate overlay opacity.

PTZ controls in simulation appear in a floating panel that mirrors the editor controls. Open the panel by clicking the PTZ button in the camera list on the right sidebar or from a camera-focused action. The panel is draggable and minimizable, and adjustments update frustums and collision overlays in real time. The camera list in the right sidebar shows each camera's name and color dot, a FOV and depth summary, the current detection count, and buttons for PTZ and Focus.

Orbit the view by dragging in empty space, pan with right mouse drag or trackpad, and zoom with the scroll wheel. Double-clicking a camera or person focuses the orbit target, and a smooth animation centers and zooms to the object.
