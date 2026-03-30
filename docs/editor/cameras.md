# Cameras and FOV

Cameras are placed inside areas and rendered with a unique color and a visible FOV wedge. They can be adjusted with drag handles and PTZ controls.

To place a camera, go to the bottom navigation and click Place Device or press D to open the Device Picker. The picker appears centered on the screen and lists camera types with HFOV, VFOV, and depth. Select a camera type, then move the cursor into an area. The cursor shows a camera icon and a dashed range circle using a 12px dash and 6px gap with a subtle rotation. The next available camera color is previewed on the cursor. Click to place the camera; a drop-in animation plays and the camera properties panel opens automatically. If you click outside the area, the cursor becomes not-allowed and placement is blocked with an error toast.

Each camera is auto-assigned a unique color from a 20-color palette, and colors repeat only after all 20 are used, with a hue shift. The palette is #FF6B6B, #4ECDC4, #45B7D1, #FFA07A, #98D8C8, #F7DC6F, #BB8FCE, #85C1E2, #F8B739, #52B788, #E63946, #A8DADC, #F77F00, #06FFA5, #9D4EDD, #FF006E, #8338EC, #00B4D8, #90E0EF, #FFB703. You can override a camera color in the properties panel on the right, and the change updates all views immediately.

In the editor, the camera icon is filled with the camera color, a direction arrow shows facing direction, and the FOV wedge uses low opacity with a colored border. Hover increases FOV opacity for clarity. You can drag the FOV wedge edge in the viewport to adjust direction, and PTZ controls in the properties panel provide precise pan, tilt, and zoom adjustments. Measurement tooltips show camera range during placement and HFOV, VFOV, and depth while adjusting FOV.

Planned 2D FOV occlusion in Map Mode clips the FOV wedge against walls and shapes that are taller than the camera height, ignores shorter obstacles, and clamps the wedge to the active area. Placement can be blocked if the wedge cannot project inside the area.

The Devices in Use panel is opened from the right sidebar. Click the Devices in Use button or use Cmd+Shift+D to view the list of cameras with color dots and specs, and click a camera in the list to select and focus it in the viewport.
