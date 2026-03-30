# Vision Simulator Documentation, All-in-One

This single file contains the full product documentation in a recommended reading order. It starts with the overview and core concepts, then walks through the main editor features, the simulation experience, the end-to-end workflow, and export behaviors.

## Overview

### Product and Core Concepts

The Vision Simulator is a browser-based environment editor and simulation tool. You design a space, place cameras and people, and then run a live simulation to validate coverage, occlusion, and movement. It is desktop-first and runs entirely in the browser without installing software.

When you open the app you land in the Editor View. The top bar, bottom tool strip, and right sidebar are always visible, and you build your scene in the main viewport. The Live Preview button in the top bar on the right switches you to the Simulation Analysis view without changing the URL, so you can move between editing and simulation quickly.

The core workflow starts with an area. Areas define valid placement boundaries, so you must create at least one area before you can place anything else. The Create Area tool is the second icon from the left in the bottom tool strip. After the area exists, the walls, shapes, device, and people tools become active, and the active area is highlighted with a thicker border.

Walls and shapes are obstacles used for visibility and collision. Draw Wall and Draw Shapes are the third and fourth icons in the bottom tool strip. Walls form polylines with real-world thickness, and shapes include rectangles, circles, triangles, and lines. Measurement tooltips show lengths and dimensions during drawing, and snapping can align points to 45 degree angles and to the 0.5 meter grid.

Cameras and people are placed inside areas. Place Device and Place Person are the fifth and sixth icons in the bottom tool strip. Cameras are auto-assigned a unique color from a fixed 20-color palette, and that color is reused for the editor FOV wedge, 3D frustum, radar indicators, and camera feeds. People are collision-aware and cannot overlap walls, shapes, or other people, so the cursor will show an error state if you try to place them in an invalid location.

Simulation Analysis is a live 3D view of the scene. The Preview top bar includes Start Recording and Snapshot on the right, and the right sidebar contains the camera list and camera feeds. A radar overlay appears in the upper-left of the viewport, and a floating PTZ panel appears when you open PTZ controls for a camera. Double-clicking a camera or person focuses the view on that object.

Map Mode and Canvas Mode are visual modes only and do not change any data. The Map and Canvas toggle is in the top-left of the editor top bar and the simulation top bar. Map Mode shows Mapbox tiles and supports map style switching and location search from the right sidebar. Canvas Mode hides tiles and shows a neutral grid with meter markings. If map tiles are not available in your deployment, Map Mode may show a blank background while Canvas Mode remains fully functional.

Export is available in both views. In Preview, Start Recording and Snapshot are in the top bar on the right. In the editor, the Export dropdown in the top bar on the right provides Scene JSON and Scene Image exports.

The simulator can run as a standalone web app or be embedded inside another platform. In embedded preview-only mode, editor chrome and top bars may be hidden and the view may open directly into simulation with no Back to Editor control. When the top bar is hidden, any planned 3D or 2D view toggles move into the viewport so you can still switch projection modes. Host platforms may also provide save controls and unsaved-changes prompts, which appear when you attempt to leave with edits that have not been saved.

Releases are versioned and may be labeled by tag in the host platform. If your environment shows a version string, it represents the current release and helps support teams align behavior with documentation.

The product explicitly does not include multiplayer collaboration, real computer-vision inference, or photorealistic rendering. It focuses on fast spatial iteration, predictable simulation behavior, and a consistent UI for camera planning.

## Editor

### Editor Layout and Modes

When the app loads you are in the Editor View. The editor is a single-page workspace with a fixed top bar, a fixed bottom tool strip, and a central viewport. The top bar is 56px tall and is divided into three zones. On the left you will find the Map and Canvas segmented toggle that switches the background between Map Mode and Canvas Mode. When Map Mode is active, a Map View toggle appears next to it to show or hide tiles. In the middle you will find the Edit Mode toggle along with Clear Board, Undo, and Redo. On the right you will find the Export dropdown and the Live Preview button that switches to Simulation Analysis. Some deployments also show a Save action in the top bar near Export; if you do not see it, saving is handled by the host platform instead.

The bottom navigation is 64px tall and contains the creation tools in a fixed order from left to right. The first slot is the Mode popover for Hand and Selector modes. The second slot is Create Area. The third slot is Draw Wall. The fourth slot is Draw Shapes. The fifth slot is Place Device. The sixth slot is Place Person. If a tool is disabled, it is because required prerequisites are missing, most commonly that no area exists yet.

The right sidebar is 48px wide and contains secondary tools stacked from top to bottom. The top button is Search Location in Map Mode only. The second button is Area Management. The third button is Map Style in Map Mode only. The fourth button is Devices in Use. Use these buttons to manage areas, switch map styles, or open the camera list. Search Location opens a dialog for geocoding results, and Map Style opens a style picker that updates the map immediately.

The main viewport shows your scene. In Map Mode the Mapbox tiles are visible. In Canvas Mode the tiles are hidden and a neutral grid is shown. A coordinate readout appears in the bottom-left corner of the viewport and updates as you move the cursor. Snap-to-Grid and Measurement Overlay toggles appear in the bottom-right corner, with Snap-to-Grid above and Measurement Overlay below. Snap-to-Grid aligns points to a 0.5m grid. The measurement overlay shows distance guides while you draw or move objects.

Map Mode and Canvas Mode are visual-only and do not change any data. The transition between modes uses a short 200ms animation. Edit Mode controls whether creation and editing tools are active. When Edit Mode is off, you can still select objects but cannot create or modify them, so the bottom tool strip remains visible but is effectively locked.

Global interaction rules apply everywhere. Areas are mandatory before placing walls, shapes, cameras, or people. Clicking on blank space closes open panels, popovers, and dialogs. The app always uses full viewport height and width. Coordinates are in meters and rotation is in degrees. The coordinate display format is X: 12.5 m | Y: -3.2 m.

A planned Design Mode top bar redesign defines a left section with a back button, project name, and more options button, and a right section with edit mode toggle, clear board, undo, redo, export, and a Live preview button labeled Live preview.

Unsaved changes are protected. If you attempt to close the tab, navigate away, or use a back button while edits are unsaved, you will see a dialog that offers Save and leave, Discard changes, or Stay. If you are using the simulator inside a host application, the host may provide its own leave dialog, but the same three choices are available.

Cursor states are explicit and consistent. Area drawing uses a crosshair with a 12px blue dot, wall drawing uses a crosshair with an 8px red dot, shape drawing shows a crosshair with a ghost preview, camera placement uses a camera icon with a range circle, and person placement uses a person icon with a collision radius. Invalid placement uses a not-allowed cursor with red tint, selection hover uses a pointer, dragging uses a move cursor, resize handles use directional resize cursors, and rotation uses a dedicated rotate cursor.

### Areas

Areas are mandatory spatial boundaries. You must create at least one area before placing walls, shapes, cameras, or people. When multiple areas exist, the most recently created or selected area becomes the active area for new placement.

To create an area in Point Mode, go to the bottom navigation and click Create Area, which is the second icon from the left, or press A. Click to add vertices around your boundary. A dashed preview line extends from the last vertex to your cursor, and you close the polygon by double-clicking, pressing Enter, or clicking the first vertex. Press ESC to cancel or Backspace to remove the last vertex. The cursor appears as a crosshair with a 12px blue dot, the first click shows a pulsing 10px dot, and vertices render as 8px circles. The preview line uses an 8px dash and 4px gap and animates toward the cursor. When you are close to the first vertex, a tooltip indicates that you can close and shows the total perimeter.

To create an area in Pen Mode, open the Create Area popover from the same bottom navigation tool, select Pen Mode, then click to place anchor points and drag from anchors to create Bezier control handles. Hold Shift to constrain handle angles in 45 degree steps and hold Alt for a sharp corner. The curve is sampled into a polyline for use throughout the app.

Area constraints are strict. A valid area must have at least three vertices and be a closed polygon, and all object placement is clipped to the active area. If you try to draw or place outside the area, the preview turns red and the cursor becomes not-allowed.

The first-time experience includes a centered prompt that says Create an Area to Begin, a guided tutorial for vertex placement and closing, and a confetti burst with a success toast when the first area is created. Tool buttons for walls, shapes, cameras, and people become enabled after the first area exists.

Area Management is available in the right sidebar. Click the Area Management button, which is the second button from the top, or use Cmd+Shift+A to open the slide-over panel. The panel lists areas with names, point counts, and color indicators. Click a row to make that area active and focus the viewport on it. Use the name field in the row to rename the area, and use the delete action in the row to remove it. If you delete the active area, the app selects the most recently created remaining area.

Overlapping areas show a faint crosshatch pattern. The active area is highlighted with a thicker border, and new objects are created inside it. Area names are formatted sequentially, such as Area 1, Area 2, and so on, and those names appear in the area list and in selection tooltips.

During drawing, measurement tooltips show the current segment length, and the final perimeter is shown when you close the polygon. In Canvas Mode, the grid provides scale reference with 1m by 1m minor squares, major grid lines every 10m, and coordinate labels at major grid lines.

### Walls and Shapes

Walls and shapes are structural obstacles for visibility, collisions, and movement, and they must be fully inside an area. The wall tool creates polyline walls with multiple segments, while the shape tool creates rectangles, circles, triangles, and lines.

To draw a wall, go to the bottom navigation and click Draw Wall, which is the third icon from the left, or press W. Click to place the first point, move your cursor to preview the segment, click to add more segments, and double-click to finish. The preview is a solid red line that matches the actual thickness, which defaults to 0.2m. Vertices appear at joints, and the tooltip shows length and angle, for example 12.8 m at 45 degrees. Angle snapping uses 45 degree steps when enabled, and grid snapping uses 0.5m increments when enabled. The snap toggles are in the bottom-right corner of the viewport, with Snap-to-Grid above Measurement Overlay. Walls must stay inside the active area. If you extend outside, the preview turns red, the cursor becomes not-allowed, and placement is blocked with a warning tooltip. Self-intersections are allowed but flagged with a warning icon and tooltip.

To draw shapes, click Draw Shapes in the bottom navigation and choose a shape in the popover, or use shortcuts R for rectangle, C for circle, T for triangle, and L for line. Rectangles are drawn by click-drag, with Shift to constrain to a square and Alt to expand from center. Circles are drawn by clicking a center and dragging a radius. Triangles can be created by three clicks for a freeform triangle or by drag for an equilateral triangle. Lines are drawn by click-drag with a dashed preview line and have a configurable thickness that defaults to 0.1m.

All shapes must remain inside the active area. Invalid placement turns previews red and uses a not-allowed cursor, and resizing or dragging clamps to the area boundary. Measurement tooltips display real-time dimensions while drawing, such as width and height for rectangles and radius for circles. Optional distance markers appear on long segments, and object-to-object distance guides appear while dragging near another object.

To edit a wall or shape, switch to Selector Mode from the Mode popover on the far left of the bottom navigation, then click the object in the viewport. A bounding box and handles appear, and you can drag, resize, or rotate within the active area. The properties panel slides in from the right and lets you set height, thickness, and color for walls and shapes, along with shape-specific dimensions such as width, height, or radius.

### Selection and Transform

Selection and transform tools let you move, resize, and rotate objects inside areas. Hand Mode enables map drag and disables selection, while Selector Mode enables selection and disables map drag. To change modes, open the Mode popover at the far left of the bottom navigation and choose Hand or Selector, or press H and V.

To select an object, switch to Selector Mode and click the object in the viewport. Shift-click to multi-select and click blank space to deselect. Selection priority is People, then Cameras, then Walls, then Shapes, then Areas, so the topmost item is always chosen first. On hover, the cursor changes to a pointer, the object outline glows, and a tooltip shows the object type and ID after a short delay of about 500ms.

Multi-select shows a selection count badge near the top-left of the viewport and enables bulk actions such as delete and duplicate. If your build includes a context menu, right-clicking a selection opens those actions. Delete can also be triggered with the Delete or Backspace key when the viewport has focus.

When an object is selected, a bounding box and transform handles appear around it. Corner handles resize diagonally, edge handles resize horizontally or vertically, and holding Shift keeps proportions. The rotation handle allows free rotation and snaps to 15 degree increments by default, with a tooltip showing the current angle. Hold Shift while rotating to disable snapping in builds that support free rotation.

When you drag a selected object, it must remain inside the active area. As you approach the boundary, previews turn red and the cursor becomes not-allowed. People cannot overlap walls, shapes, or other people at any time, and invalid drag positions snap back to the last valid position on release. Cursor feedback is consistent: hover uses a pointer, dragging uses a move cursor, resize uses directional resize cursors, rotation uses a rotate cursor, and invalid states use not-allowed with a red preview.

### Cameras and FOV

Cameras are placed inside areas and rendered with a unique color and a visible FOV wedge. They can be adjusted with drag handles and PTZ controls, and their color is reused across the editor, simulation, radar, and feeds so you can track a camera at a glance.

To place a camera, go to the bottom navigation and click Place Device, which is the fifth icon from the left, or press D to open the Device Picker. The picker appears centered on the screen with a search input at the top and a list of camera types showing HFOV, VFOV, and depth. Select a camera type, then move the cursor into an area. The cursor shows a camera icon and a dashed range circle using a 12px dash and 6px gap with a subtle rotation. The next available camera color is previewed on the cursor. Click to place the camera; a drop-in animation plays and the camera properties panel opens automatically. If you click outside the area, the cursor becomes not-allowed and placement is blocked with an error toast.

Each camera is auto-assigned a unique color from a 20-color palette, and colors repeat only after all 20 are used, with a hue shift. The palette is #FF6B6B, #4ECDC4, #45B7D1, #FFA07A, #98D8C8, #F7DC6F, #BB8FCE, #85C1E2, #F8B739, #52B788, #E63946, #A8DADC, #F77F00, #06FFA5, #9D4EDD, #FF006E, #8338EC, #00B4D8, #90E0EF, #FFB703. You can override a camera color in the properties panel on the right, and the change updates all views immediately.

In the editor, the camera icon is filled with the camera color, a direction arrow shows facing direction, and the FOV wedge uses low opacity with a colored border. Hover increases FOV opacity for clarity. You can drag the FOV wedge edge in the viewport to adjust direction and depth, and PTZ controls in the properties panel provide precise pan, tilt, and zoom adjustments. Measurement tooltips show camera range during placement and HFOV, VFOV, and depth while adjusting FOV.

The Devices in Use panel is opened from the right sidebar. Click the Devices in Use button, which is the fourth button from the top, or use Cmd+Shift+D to view the list of cameras with color dots and specs. Clicking a camera in the list selects it and focuses it in the viewport. This same list is mirrored in the Preview right sidebar so you can open PTZ controls and focus cameras during simulation.

Planned 2D FOV occlusion in Map Mode clips the FOV wedge against walls and shapes that are taller than the camera height, ignores shorter obstacles, and clamps the wedge to the active area. Placement can be blocked if the wedge cannot project inside the area.

### People

People are actors in the simulation. They are placed inside areas and cannot overlap obstacles or other people, so they always respect the space you design.

To place a person, go to the bottom navigation and click Place Person, which is the sixth icon from the left, or press P, move the cursor inside an area, and click a valid position. The cursor shows a person icon with a collision radius preview. The default radius is 0.3m, which is a 0.6m diameter. A blue preview indicates valid placement, while a red preview and not-allowed cursor indicate invalid placement.

Placement validation checks that the position is inside the active area, does not overlap walls or shapes, and does not overlap other people. If invalid, a tooltip explains the reason and clicking can trigger a short shake animation and an error toast.

On placement, a fade-in and pulse animation plays, the properties panel opens automatically on the right, and you can immediately drag to adjust position. Collision rules remain active during dragging, so people cannot be dragged through obstacles.

Person properties include name, height, speed, and behavior and trail settings used by the simulation. These fields are in the properties panel on the right when a person is selected. In Preview, clicking a person in the 3D view or in radar highlights the person and shows a trailing path, so you can verify movement patterns.

### Properties Panels

To open a properties panel, switch to Selector Mode and click any object in the viewport. The panel slides in from the right, applies changes immediately, and closes on ESC, outside click, or tool switch. Changes are committed with debouncing to avoid noisy undo stacks, so rapid slider updates produce a single history entry.

Area properties include name, point count, perimeter, area in square meters, fill color and opacity, border color and width, and boundary mode. Wall properties include segment count, total length, thickness, height, and color. Shape properties include height and color, plus shape-specific fields such as rectangle width and height, circle radius, triangle base and height, and line length, angle, and thickness.

Camera properties are grouped into General, Position, Optics, and PTZ. General includes name, type preset, and color. Position includes height and direction, while X and Y are adjusted on the map. Optics includes FOV, depth, near clipping, and resolution. PTZ includes pan, tilt, and zoom. Color changes update the camera icon and FOV immediately.

Person properties include name, height, speed, and behavior and trail settings that affect simulation. Changing these values updates the Preview view the next time you enter Simulation Analysis, and some builds update live if Preview is already open.

PTZ controls provide a D-pad for pan and tilt, a pan slider from 0 to 360 degrees, a tilt slider from -45 to 90 degrees, and a zoom slider from 1x to 10x or device limits. When a camera is selected, arrow keys adjust pan and tilt and plus or minus adjust zoom. PTZ changes update the FOV wedge and camera orientation in real time.

### Undo and Redo

Undo and redo record all meaningful scene edits and let you step backward or forward safely. Create, update, and delete operations are recorded for areas, walls, shapes, cameras, and people, along with scene-affecting style changes such as map style. Selection-only changes, view mode switches, and popover open states are not recorded.

Use the Undo and Redo buttons in the top bar center, or press Cmd+Z or Ctrl+Z to undo and Cmd+Shift+Z or Ctrl+Shift+Z to redo. Continuous gestures create a single history entry on gesture end, so dragging or resizing does not flood the stack. Undo and redo are disabled in Preview mode and when Edit Mode is off. If an object no longer exists after undo or redo, the selection is cleared.

Clear Board sits next to Undo and Redo in the top bar center in builds that include it. Clearing the board removes all objects in the current scene and resets the undo stack after confirmation, so use Undo before clearing if you want to preserve history.

### Map Style and Search

Map styles apply only in Map Mode. To switch to Map Mode, use the Map and Canvas toggle in the top-left of the editor top bar. Once Map Mode is active, click Map Style in the right sidebar, which is the third button from the top, to open the style dialog. The dialog appears near the center of the screen and lists street, satellite, traffic, and osm. Select a style and the map updates immediately. The selected style is stored in the scene and restored on reload.

Map visibility is controlled by the Map View toggle next to the Map and Canvas switch. Turning Map View off hides tiles and shows a neutral grid. Canvas Mode uses a grid background as its default. Plans describe two grid behaviors: a visual-only grid when map tiles are hidden and a Mapbox grid style that thins out as you zoom out. If your build uses the grid style variant, you will see fewer grid lines at lower zoom levels.

Location Search is Map Mode only. Click Search Location in the right sidebar, which is the top button, or press Cmd+K or Ctrl+K. Type a location name, wait for results after a short debounce, and select a result to fly the map to that location. The dialog shows loading and empty states, results include name and context, and results are typically limited to a small set for speed. Press ESC to close the dialog.

Map tiles require a valid Mapbox token provided by your deployment. If Map Mode shows a blank background, switch to Canvas Mode to continue working and ask your administrator to confirm map tile access for your environment.

### Keyboard Shortcuts

Shortcuts are available when the viewport is focused and the Editor is active. You can always access the same tools from the bottom navigation and right sidebar if you prefer clicking.

Use V for Selector mode and H for Hand mode. Create Area is A, Draw Wall is W, Rectangle is R, Circle is C, Triangle is T, Line is L, Place Device is D, and Place Person is P. Search Location is Cmd+K or Ctrl+K and can also be opened from the top button in the right sidebar when Map Mode is active. Area Management is Cmd+Shift+A or Ctrl+Shift+A and opens the second button in the right sidebar. Devices in Use is Cmd+Shift+D or Ctrl+Shift+D and opens the fourth button in the right sidebar. Use ESC to cancel the current action or close a panel.

Undo is Cmd+Z or Ctrl+Z and Redo is Cmd+Shift+Z or Ctrl+Shift+Z, and both are also available in the top bar center. When a camera is selected, arrow keys adjust pan and tilt, and plus or minus adjusts zoom. These PTZ controls are mirrored in the camera properties panel on the right.

## Simulation

### Simulation Analysis View

Simulation Analysis is the live preview mode. It renders the scene in 3D and provides radar, camera feeds, PTZ control, and export actions. You enter Preview by clicking Live Preview in the editor top bar on the right. You return to the editor using Back to Editor in the simulation top bar on the left. The switch is instant and does not change the URL.

The simulation top bar is 64px tall. On the left it provides Map and Canvas mode along with a Map View toggle when Map Mode is active. The center shows an area dropdown when multiple areas exist, formatted like Area 1 (12 objects). The right side provides Start Recording and Snapshot. If your deployment runs in a preview-only package mode, this top bar may be hidden and the view will open directly into the simulation without a Back to Editor control.

The view header shows the title Simulation Analysis, a mode badge for Map or Canvas Mode, and a hint line that suggests clicking a person to show a trail. The main viewport fills the screen under the top bar. Orbit controls allow rotate, pan, and zoom, and double-clicking a person or camera focuses the view on that object.

The right sidebar contains the camera list at the top and the camera feeds grid below it. Each camera row includes its color dot, name, and action buttons such as PTZ and Focus. The radar panel is always visible in simulation and appears as a floating overlay in the upper-left corner of the viewport. A floating PTZ panel appears when active and mirrors the PTZ controls from the editor properties panel.

When multiple areas exist, the area dropdown selects the view scope. Selecting an area triggers a smooth fly-to animation that frames the area, while selecting All Areas keeps the full scene in view.

### 3D View and Collision

The 3D view renders a simulation world based on your editor scene. Walls, shapes, cameras, and people are shown as 3D meshes with lighting and shadows. The ground plane is textured with Mapbox tiles in Map Mode and a neutral grid in Canvas Mode, and the Map View toggle swaps tiles for a grid. Switching Map and Canvas uses a smooth texture fade.

Areas render as semi-transparent vertical boundaries about 0.5m tall to indicate perimeter. Walls render as boxes with thickness and height, and shapes render as the appropriate 3D meshes. Cameras appear as small meshes with color accents and direction indicators. People appear as capsule-style meshes, with selected people highlighted in yellow. Lighting is provided by directional, ambient, and hemisphere lights to avoid overly dark areas.

Each camera renders a frustum wireframe in its color and semi-transparent frustum planes. Collision overlays show where a camera frustum intersects walls, shapes, the floor footprint, and area boundaries. Overlays are always visible in 3D preview, are height-aware for partial occlusion, and do not alter base obstacle colors. A subtle pulse can animate overlay opacity.

PTZ controls in simulation appear in a floating panel that mirrors the editor controls. Open the panel by clicking the PTZ button in the camera list on the right sidebar or from a camera-focused action. The panel is draggable and minimizable, and adjustments update frustums and collision overlays in real time. The camera list in the right sidebar shows each camera's name and color dot, a FOV and depth summary, the current detection count, and buttons for PTZ and Focus.

Orbit the view by dragging in empty space, pan with right mouse drag or trackpad, and zoom with the scroll wheel. Double-clicking a camera or person focuses the orbit target, and a smooth animation centers and zooms to the object.

### People Movement and Trails

The simulation animates people using deterministic steering behaviors. Movement is reproducible when the same seed is used.

Each person has position, velocity, a desired wander direction, and a speed in meters per second. Forces applied each frame include wander, obstacle avoidance from walls and shapes, person avoidance to keep about a 2m separation, and strong boundary repulsion with clamping at the area edges. Collision detection uses a spatial hash grid to keep performance stable as the scene grows.

Determinism is achieved using a seeded random generator and a fixed 60 FPS timestep. The seed is stored in scene.simulationSeed and is exported with the scene.

Each person stores a ring buffer of recent positions. A trail renders for the selected person and shows the last 20 seconds with fading opacity. To view a trail, enter Simulation Analysis, then click a person in the 3D viewport or click the person icon in the radar panel. The view header hints that clicking a person shows a trail, and the trail follows the person until you select another target or clear the selection.

### Radar

Radar provides a 2D tactical overview during simulation. It is always visible in Simulation Analysis and appears as an overlay in the upper-left area of the viewport.

The radar panel is a semi-transparent card with a default size of 300px by 300px. Drag the header to move it, and drag the resize handle to resize it between 200px and 500px. The header contains the title and minimize control, and the footer shows people, cameras, and detection counts with a real-time update target around 30 FPS.

Radar visualization renders camera indicators in their assigned colors with simplified FOV wedges, people indicators in blue that turn yellow when selected, and subtle area outlines. An optional grid overlay can be enabled for scale reference.

Selecting a person triggers a ping animation with three expanding circles, a highlighted person marker, and an optional dashed connection line to cameras that can see the person. Interactions include clicking to select people and cameras, mouse-wheel zoom, background drag for panning, and a context menu for toggles like grid, trails, and FOV wedges. The radar can also be locked to prevent dragging, which is useful when you want a stable overlay while inspecting the 3D view.

Real Radar Mode is planned. It adds a simulated and real mode toggle in the radar header. Simulated mode is the default, and real mode filters the radar to real-device cameras in the active area. A radar activities feed exists in code but is hidden from the UI in current plans.

### Camera Feeds

Camera feeds render per-camera POV tiles with detection overlays. They appear in the simulation right sidebar under the camera list. Open the sidebar by switching to Preview, then look beneath the camera list for the Camera Feeds section.

Detections are computed in two stages: frustum culling to find people inside the camera frustum, and occlusion testing using ray-casts against walls, shapes, and area boundaries. Height-aware rules determine whether obstacles block visibility.

For each visible person, the person's bounds are projected into the camera view to form a 2D bounding box. Each box is labeled with the person ID and rendered in a bright highlight color for visibility. The tile footer shows the camera name and the detection count.

Feed tiles are displayed in a grid that you select from the feed header. The header sits above the tiles and includes grid size buttons for 2x2, 3x3, and 4x4. The tile border uses a neutral UI style. Default feed resolution is 720p with adjustable scaling. Feeds target 30 FPS; if many feeds are active, resolution or update rate may be reduced, and off-screen feeds can be skipped.

Realistic camera feeds are planned. The plan renders the actual 3D scene from the camera viewpoint with matching lighting and occlusion, and optionally applies subtle optics effects such as vignette or light noise.

Real device streaming is planned. When a camera is marked as real, the tile renders a MediaMTX player instead of a simulated feed, uses a stream URL derived from mediaMtxUrl and sourceDeviceId, and exposes play, stop, and fullscreen controls. If stream configuration is missing, the tile shows a non-blocking error state.

### Preview 2D Top-Down Mode (Planned)

Preview includes a planned 3D and 2D switch that changes only the camera projection. The 2D mode is a top-down view that keeps the same simulation data, UI panels, radar, feeds, selection, recording, and snapshots. Rotation is disabled in 2D, while pan and zoom remain available.

The switch appears in the Preview top bar near the right side, close to Start Recording and Snapshot. If the top bar is hidden by a preview-only package mode, the switch falls back to a compact control inside the viewport, typically in the upper-right corner so it remains reachable while you inspect the scene.

### Real Radar Live Detections (Planned)

Real-device radar data can be streamed into both the 2D radar and the 3D preview. The plan abstracts ingestion away from the radar UI, normalizes detection data, and renders live detections as realistic meshes in the 3D scene.

The planned normalized detection model includes trackerId, cameraId, className, confidence, lat, lon, timestampValue, and lastSeenAt. Real mode in radar filters to real-device cameras and plots detections using this shared data model, while the activities feed remains hidden from the UI in current plans. The real mode toggle is planned in the radar header alongside the radar title.

In 3D preview, live detections render as meshes with a class mapping that supports person and car with a fallback for unknown classes. Positions are computed by converting lat and lon into world coordinates using the same origin as the scene. Stale detections are removed via TTL cleanup. The data remains runtime-only and is not saved in scene JSON.

## Workflow

### Getting Started End-to-End

This workflow takes you from a blank scene to a recorded simulation. It includes the full end-to-end flow: create the environment, place devices and people, run the preview, and export outputs.

Start in the Editor View. In the top-left of the top bar, choose Map Mode if you want real-world tiles or Canvas Mode if you want a neutral grid. If you are in Map Mode, use the right sidebar top button Search Location to jump to a specific address or neighborhood, or use Cmd+K. The map flies to the selected result and becomes the base for your scene.

Create an area first. Click Create Area in the bottom tool strip, which is the second icon from the left, or press A. Click to add vertices around your space, then double-click or press Enter to close the polygon. Confirm the area appears with a colored border and the other tools become enabled. If you need multiple areas, open Area Management from the right sidebar second button and create additional areas, then click a row in the area list to make it active.

Add obstacles next. Use Draw Wall in the bottom tool strip, which is the third icon from the left, or press W to place wall segments. Double-click to finish. Use Draw Shapes, the fourth icon, to add rectangles, circles, triangles, or lines. While drawing, watch the measurement tooltips for lengths and dimensions, and use the Snap-to-Grid toggle in the bottom-right of the viewport if you want cleaner alignment.

Place cameras by clicking Place Device in the bottom tool strip, which is the fifth icon, or by pressing D. The Device Picker opens in the center of the screen. Select a camera type, then click inside the active area to place it. Drag the FOV wedge in the viewport to aim the camera, then fine-tune pan, tilt, zoom, and depth in the properties panel on the right. If you want to quickly review all cameras, open Devices in Use from the right sidebar fourth button and click a camera to focus it.

Place people by clicking Place Person, the sixth icon in the bottom tool strip, or by pressing P. Click valid positions inside the area. If you see a red preview, move to a valid spot away from walls, shapes, and other people. After placement, adjust person speed and behavior in the properties panel on the right.

Review and refine. Switch to Selector Mode from the Mode popover on the far left of the bottom tool strip, then click objects to resize, rotate, or move them. Use Undo and Redo in the top bar center if you need to revert. If you want to change the map appearance, open Map Style from the right sidebar third button and choose a style.

Run the simulation by clicking Live Preview in the top bar on the right. The view switches to Simulation Analysis. Use orbit controls to inspect the scene, check the radar overlay in the upper-left for detections, and review camera feeds in the right sidebar beneath the camera list. Click a camera in the camera list to focus it, and click PTZ to open the floating PTZ panel for live adjustments. Click a person in the 3D view or radar to show their trail.

Export outputs from Preview or Editor. In Preview, use Start Recording and Snapshot in the top bar on the right. In the editor, open the Export dropdown in the top bar on the right to download Scene JSON or a Scene Image. If your deployment includes save-time snapshot upload, the Save action will capture a snapshot automatically when you save.

## Export

### Recording and Snapshot Export

Recording is initiated from Preview by clicking Start Recording in the top bar on the right. The button turns red, the label changes to Stop Recording, and a REC timer appears in the top bar. A subtle red border may appear around the viewport. Click Stop Recording in the same top bar location to finish and download the file.

During recording, the 3D view, camera focus changes, PTZ adjustments, area switches, and map visibility toggles are captured. Recording targets 30 FPS and outputs a WebM file in VP9 format named simulation_YYYY-MM-DD_HH-MM-SS.webm.

Snapshot captures are also initiated from Preview by clicking Snapshot in the top bar on the right. Clicking Snapshot renders the current frame at high resolution, downloads a PNG named snapshot_YYYY-MM-DD_HH-MM-SS.png, and shows a brief white flash. Plans include optional overlay inclusion, annotation mode, and resolution selection such as 1x, 2x, and 4x.

Scene JSON export is available in the editor top bar on the right. Click the Export dropdown and choose Scene JSON to download the scene file named scene_YYYY-MM-DD_HH-MM-SS.json. Scene Image export is in the same menu and captures the current editor view as a PNG.

### Save-Time Snapshot Upload (Planned)

Some deployments may include a save-time snapshot feature. When enabled, saving a scene captures the current working canvas and uploads it alongside the scene data.

To trigger the capture, use the Save action provided by your build, such as a Save button in the editor top bar near Export or a Save and leave action in a leave dialog when you attempt to navigate away. On save, the active area is framed in view and a snapshot is captured. Canvas Mode uses the grid background, while Map Mode uses a light map style for capture. The snapshot is uploaded and linked to the save. If capture or upload fails, the save does not complete, a user-facing error message appears, and unsaved changes remain intact.
