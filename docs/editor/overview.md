# Editor Layout and Modes

When the app loads you are in the Editor View. The editor is a single-page workspace with a fixed top bar, a fixed bottom tool strip, and a central viewport. The top bar is 56px tall and is divided into three zones. On the left you will find the Map/Canvas segmented toggle, which switches the background between Map Mode and Canvas Mode. In the middle you will find the Edit Mode toggle along with Clear Board, Undo, and Redo. On the right you will find the Export dropdown and the Live Preview button that switches to Simulation Analysis.

The bottom navigation is 64px tall and contains the creation tools in a fixed order. From left to right you will see the Mode popover for Hand and Selector modes, Create Area, Draw Wall, Draw Shapes, Place Device, and Place Person. If a tool is disabled, it is because the required prerequisites are missing, most commonly that no area exists yet.

The right sidebar is 48px wide and contains secondary tools. From top to bottom you will see Search Location in Map Mode only, Area Management, Map Style in Map Mode only, and Devices in Use. Use these buttons to manage areas, switch map styles, or open the camera list. Search Location opens a dialog for geocoding results.

The main viewport shows your scene. In Map Mode the Mapbox tiles are visible. In Canvas Mode the tiles are hidden and a neutral grid is shown. A coordinate readout appears in the bottom-left corner of the viewport and updates as you move the cursor. Snap-to-Grid and Measurement Overlay toggles appear in the bottom-right corner. Snap-to-Grid aligns points to a 0.5m grid. The measurement overlay shows distance guides while you draw or move objects.

Map Mode and Canvas Mode are visual-only; they do not change any data. The transition between modes uses a short 200ms animation. Edit Mode controls whether creation and editing tools are active. When Edit Mode is off, you can still select objects but cannot create or modify them.

Global interaction rules apply everywhere. Areas are mandatory before placing walls, shapes, cameras, or people. Clicking on blank space closes open panels, popovers, and dialogs. The app always uses full viewport height and width. Coordinates are in meters and rotation is in degrees. The coordinate display format is X: 12.5 m | Y: -3.2 m.

A planned Design Mode top bar redesign defines a left section with back button, project name, and a more options button, and a right section with edit mode toggle, clear board, undo, redo, export, and a Live preview button labeled Live preview.

Cursor states are explicit and consistent. Area drawing uses a crosshair with a 12px blue dot, wall drawing uses a crosshair with an 8px red dot, shape drawing shows a crosshair with a ghost preview, camera placement uses a camera icon with a range circle, and person placement uses a person icon with a collision radius. Invalid placement uses a not-allowed cursor with red tint, selection hover uses a pointer, dragging uses a move cursor, resize handles use directional resize cursors, and rotation uses a dedicated rotate cursor.
