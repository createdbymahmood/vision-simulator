# People Movement and Trails

The simulation animates people using deterministic steering behaviors. Movement is reproducible when the same seed is used.

Each person has position, velocity, a desired wander direction, and a speed in meters per second. Forces applied each frame include wander, obstacle avoidance from walls and shapes, person avoidance to keep about a 2m separation, and strong boundary repulsion with clamping at the area edges. Collision detection uses a spatial hash grid to keep performance stable as the scene grows.

Determinism is achieved using a seeded random generator and a fixed 60 FPS timestep. The seed is stored in scene.simulationSeed and is exported with the scene.

Each person stores a ring buffer of recent positions. A trail renders for the selected person and shows the last 20 seconds with fading opacity. To view a trail, enter Simulation Analysis, then click a person in the 3D viewport or click the person icon in the radar panel. The view header hints that clicking a person shows a trail, and the trail follows the person until you select another target or clear the selection.

<!-- Screenshot: Place docs/assets/screenshots/simulation-person-trail.webp and capture: Selected person in preview with movement trail visible. -->
![Selected person in preview with movement trail visible.](../assets/screenshots/simulation-person-trail.webp)
