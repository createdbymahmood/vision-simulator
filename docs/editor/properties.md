# Properties Panels

To open a properties panel, click any object in the viewport while in Selector mode. The panel slides in from the right, applies changes immediately, and closes on ESC, outside click, or tool switch. Changes are committed with debouncing to avoid noisy undo stacks, so rapid slider updates produce a single history entry.

Area properties include name, point count, perimeter, area in square meters, fill color and opacity, border color and width, and boundary mode. Wall properties include segment count, total length, thickness, height, and color. Shape properties include height and color, plus shape-specific fields such as rectangle width and height, circle radius, triangle base and height, and line length, angle, and thickness.

Camera properties are grouped into General, Position, Optics, and PTZ. General includes name, type preset, and color. Position includes height and direction, while X and Y are adjusted on the map. Optics includes FOV, depth, near clipping, and resolution. PTZ includes pan, tilt, and zoom. Color changes update camera icon and FOV immediately.

Person properties include name, height, speed, and behavior and trail settings that affect simulation.

PTZ controls provide a D-pad for pan and tilt, a pan slider from 0 to 360 degrees, a tilt slider from -45 to 90 degrees, and a zoom slider from 1x to 10x or device limits. When a camera is selected, arrow keys adjust pan and tilt and plus/minus adjust zoom. PTZ changes update the FOV wedge and camera orientation in real time.
