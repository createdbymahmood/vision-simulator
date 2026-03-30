# Radar

Radar provides a 2D tactical overview during simulation. It is always visible in Simulation Analysis and appears as an overlay in the upper-left area of the viewport.

The radar panel is a semi-transparent, glassmorphism card with a default size of 300px by 300px. It is draggable and resizable between 200px and 500px. The header contains the title and minimize control, and the footer shows people, cameras, and detection counts with a real-time update target around 30 FPS.

Radar visualization renders camera indicators in their assigned colors with simplified FOV wedges, people indicators in blue that turn yellow when selected, and subtle area outlines. An optional grid overlay can be enabled for scale reference.

Selecting a person triggers a ping animation with three expanding circles, a highlighted person marker, and an optional dashed connection line to cameras that can see the person. A subtle ping sound can be enabled in supported builds. Interactions include clicking to select people and cameras, mouse-wheel zoom, background drag for panning, and a context menu for toggles like grid, trails, and FOV wedges. The radar can also be locked to prevent dragging.

Real Radar Mode is planned. It adds a simulated/real mode toggle in the radar header. Simulated mode is the default, and real mode filters to real-device cameras in the active area. A radar activities feed exists in code but is hidden from the UI in current plans.
