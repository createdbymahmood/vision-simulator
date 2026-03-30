# Product and Core Concepts

The Vision Simulator is a web-based environment editor and simulation tool. You design a space, place cameras and people, then run a live simulation to validate camera coverage, occlusion, and movement. It is desktop-first and runs entirely in the browser.

When you open the app you land in the Editor View. The top bar, bottom tool strip, and right sidebar are always visible, and you build your scene in the main viewport. The Live Preview button in the top bar switches you to the Simulation Analysis view without changing the URL.

The product lets you draw areas that define valid placement boundaries, add walls and shapes as obstacles, place cameras with unique colors and adjustable FOV, and place people with collision-aware validation. When you switch to Preview, the simulator renders a live 3D view with radar and camera POV feeds, provides PTZ control in real time, and supports recording, snapshots, and scene JSON export.

Areas are mandatory. Every object must be placed inside an area, and the active area determines where new objects are created. Overlapping areas are allowed and are displayed with a crosshatch overlay so you can see shared regions. The system is built on a single page with state-driven view switching, so moving between Editor and Preview is instantaneous and does not change the URL.

Map Mode and Canvas Mode are visual modes only. Map Mode shows Mapbox tiles and supports style switching, while Canvas Mode hides tiles and shows a neutral grid. The feature set is identical in both modes, which means all tools, constraints, and behaviors remain the same regardless of the background.

Each camera is auto-assigned a unique color from a fixed 20-color palette. That color is used across the editor FOV wedge, the 3D frustum, the radar indicators, and the camera feed UI so the camera can be tracked consistently.

PTZ controls are available in both editor and preview, and adjustments update the FOV and visibility in real time. The simulator outputs a live 3D view, radar, camera feeds with detections, WebM recordings, PNG snapshots, and a scene JSON export.

The product explicitly does not include multiplayer collaboration, photorealistic rendering, real computer-vision inference, account systems, infinite boundary canvases without areas, or physical PTZ motor simulation.
