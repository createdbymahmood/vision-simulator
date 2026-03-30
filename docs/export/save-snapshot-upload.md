# Save-Time Snapshot Upload (Planned)

Some deployments may include a save-time snapshot feature. When enabled, saving a scene captures the current working canvas and uploads it alongside the scene data.

To trigger the capture, use the Save action provided by your build, such as a Save button in the editor top bar or a Save and leave action in a leave dialog. On save, the active area is framed in view and a snapshot is captured. Canvas Mode uses the grid background, while Map Mode uses a light map style for capture. The snapshot is uploaded and linked to the save. If capture or upload fails, the save does not complete, a user-facing error message appears, and unsaved changes remain intact.
