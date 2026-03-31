# Real Radar Live Detections (Planned)

Real-device radar data can be streamed into both the 2D radar and the 3D preview. The plan abstracts ingestion away from the radar UI, normalizes detection data, and renders live detections as realistic meshes in the 3D scene.

The planned normalized detection model includes trackerId, cameraId, className, confidence, lat, lon, timestampValue, and lastSeenAt. Real mode in radar filters to real-device cameras and plots detections using this shared data model, while the activities feed remains hidden from the UI in current plans. The real mode toggle is planned in the radar header alongside the radar title.

In 3D preview, live detections render as meshes with a class mapping that supports person and car with a fallback for unknown classes. Positions are computed by converting lat and lon into world coordinates using the same origin as the scene. Stale detections are removed via TTL cleanup. The data remains runtime-only and is not saved in scene JSON.

<!-- Screenshot: Place docs/assets/screenshots/simulation-real-radar-live.webp and capture: Real radar mode toggle and live detections in 3D. -->
![Real radar mode toggle and live detections in 3D.](../assets/screenshots/simulation-real-radar-live.webp)
