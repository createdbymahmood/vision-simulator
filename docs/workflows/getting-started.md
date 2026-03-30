# Getting Started End-to-End

This workflow takes you from a blank scene to a recorded simulation. It includes the full end-to-end flow: create the environment, place devices and people, run the preview, and export outputs.

Start in the Editor View. In the top-left of the top bar, choose Map Mode if you want real-world tiles or Canvas Mode if you want a neutral grid. If you are in Map Mode, use the right sidebar top button Search Location to jump to a specific address or neighborhood, or use Cmd+K. The map flies to the selected result and becomes the base for your scene.

Create an area first. Click Create Area in the bottom tool strip, which is the second icon from the left, or press A. Click to add vertices around your space, then double-click or press Enter to close the polygon. Confirm the area appears with a colored border and the other tools become enabled. If you need multiple areas, open Area Management from the right sidebar second button and create additional areas, then click a row in the area list to make it active.

Add obstacles next. Use Draw Wall in the bottom tool strip, which is the third icon from the left, or press W to place wall segments. Double-click to finish. Use Draw Shapes, the fourth icon, to add rectangles, circles, triangles, or lines. While drawing, watch the measurement tooltips for lengths and dimensions, and use the Snap-to-Grid toggle in the bottom-right of the viewport if you want cleaner alignment.

Place cameras by clicking Place Device in the bottom tool strip, which is the fifth icon, or by pressing D. The Device Picker opens in the center of the screen. Select a camera type, then click inside the active area to place it. Drag the FOV wedge in the viewport to aim the camera, then fine-tune pan, tilt, zoom, and depth in the properties panel on the right. If you want to quickly review all cameras, open Devices in Use from the right sidebar fourth button and click a camera to focus it.

Place people by clicking Place Person, the sixth icon in the bottom tool strip, or by pressing P. Click valid positions inside the area. If you see a red preview, move to a valid spot away from walls, shapes, and other people. After placement, adjust person speed and behavior in the properties panel on the right.

Review and refine. Switch to Selector Mode from the Mode popover on the far left of the bottom tool strip, then click objects to resize, rotate, or move them. Use Undo and Redo in the top bar center if you need to revert. If you want to change the map appearance, open Map Style from the right sidebar third button and choose a style.

Run the simulation by clicking Live Preview in the top bar on the right. The view switches to Simulation Analysis. Use orbit controls to inspect the scene, check the radar overlay in the upper-left for detections, and review camera feeds in the right sidebar beneath the camera list. Click a camera in the camera list to focus it, and click PTZ to open the floating PTZ panel for live adjustments. Click a person in the 3D view or radar to show their trail.

Export outputs from Preview or Editor. In Preview, use Start Recording and Snapshot in the top bar on the right. In the editor, open the Export dropdown in the top bar on the right to download Scene JSON or a Scene Image. If your deployment includes save-time snapshot upload, the Save action will capture a snapshot automatically when you save.
