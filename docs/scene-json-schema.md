# Scene JSON Schema

Scene exports follow the `SceneRoot` shape defined in `src/features/scene/domain/types.ts`.

## Root Structure

```json
{
  "version": "1.1",
  "mode": "map",
  "mapVisible": true,
  "units": "meters",
  "origin": {
    "lat": 34.052235,
    "lng": -118.243683,
    "description": "Los Angeles, CA"
  },
  "simulationSeed": 42,
  "activeAreaId": "area-1",
  "areas": [],
  "walls": [],
  "shapes": [],
  "cameras": [],
  "people": [],
  "meta": {
    "createdAt": "2026-01-27T00:00:00.000Z",
    "updatedAt": "2026-01-27T00:00:00.000Z",
    "mapStyle": "street",
    "radarEnabled": true,
    "collisionVisualizationEnabled": true
  }
}
```

## Entities

### AreaEntity

- `id`: string
- `type`: "area"
- `name`: string
- `geometry`: `{ type: "polygon", coordinates: GeoPoint[], bezierControls: GeoPoint[] }`
- `pointCount`: number
- `color`: string
- `style`: `{ fillColor, fillOpacity, borderColor, borderWidth }`
- `boundaryMode`: "strict"

### WallEntity

- `id`: string
- `type`: "wall"
- `areaId`: string
- `points`: GeoPoint[]
- `thickness`: number
- `height`: number
- `color`: string

### ShapeEntity

All shapes share:

- `id`: string
- `type`: "shape"
- `areaId`: string
- `geometry`: GeoPoint[]
- `height`: number
- `color`: string

Shape-specific fields:

- **Rectangle**: `shapeType: "rectangle"`, `width?`, `length?`, `rotation?`
- **Circle**: `shapeType: "circle"`, `radius?`
- **Triangle**: `shapeType: "triangle"`, `points?`
- **Line**: `shapeType: "line"`, `points?`, `thickness?`

### CameraEntity

- `id`: string
- `type`: "camera"
- `name`: string
- `areaId`: string
- `typePreset`: string
- `x`, `y`: number (map coordinates)
- `height`: number
- `direction`: number
- `fov`: number
- `depth`: number
- `zoom`: number
- `nearClipping`: number
- `resolution`: `{ width, height }`
- `color`: string
- `ptz`: `{ pan, tilt, zoom, limits }`
- `ptzPresets`: `{ name, pan, tilt, zoom }[]`
- `showCollisions`: boolean

### PersonEntity

- `id`: string
- `type`: "person"
- `name`: string
- `areaId`: string
- `x`, `y`: number
- `height`: number
- `speed`: number

## Notes

- `GeoPoint` is `[lng, lat]` in map coordinates.
- `SceneVersion` is currently `"1.1"`.
- Optional fields may be omitted by editors or during intermediate states.
