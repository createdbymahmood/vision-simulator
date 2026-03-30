# People

People are actors in the simulation. They are placed inside areas and cannot overlap obstacles or other people.

To place a person, go to the bottom navigation and click Place Person or press P, move the cursor inside an area, and click a valid position. The cursor shows a person icon with a collision radius preview. The default radius is 0.3m (0.6m diameter). A blue preview indicates valid placement, while a red preview and not-allowed cursor indicate invalid placement.

Placement validation checks that the position is inside the active area, does not overlap walls or shapes, and does not overlap other people. If invalid, a tooltip explains the reason and clicking can trigger a short shake animation and an error toast.

On placement, a fade-in and pulse animation plays, the properties panel opens automatically on the right, and you can immediately drag to adjust position. Collision rules remain active during dragging.

Person properties include name, height (default 1.7m), speed (default 1.2 m/s), and behavior and trail settings used by the simulation.
