import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
  LineString,
  MultiLineString,
  MultiPolygon,
  Point,
  Polygon,
} from 'geojson'

import {
  booleanPointInPolygon,
  buffer,
  destination,
  featureCollection,
  intersect,
  lineIntersect,
  lineString,
  point,
  pointToLineDistance,
  polygon,
  polygonToLine,
  area as turfArea,
  distance as turfDistance,
  length as turfLength,
} from '@turf/turf'

import type {
  AreaEntity,
  CameraEntity,
  GeoPoint,
  PersonEntity,
  PolygonGeometry,
  ShapeEntity,
  WallEntity,
} from '@/features/scene/domain/types'
import type {EditorTool} from '@/features/scene/infrastructure/stores/ui.store'

import {
  AREA_COLORS,
  DEFAULT_AREA_STYLE,
} from '@/features/scene/domain/constants/area-style'
import {DEFAULT_PERSON_RADIUS} from '@/features/scene/domain/constants/person-defaults'
import {SHAPE_STROKE_COLOR} from '@/features/scene/domain/constants/shape-style'
import {
  DEFAULT_WALL_COLOR,
  DEFAULT_WALL_THICKNESS,
} from '@/features/scene/domain/constants/wall-style'
import {getEffectiveHorizontalFov} from '@/features/scene/domain/services/camera-optics'

const DEFAULT_FOV_SEGMENTS = 24
const DEFAULT_LINE_SHAPE_THICKNESS = 0.1
const MIN_FOV_DISTANCE = 0
const MIN_INTERSECTION_DISTANCE = 0.05

export const getBaseCursor = (
  activeTool: EditorTool,
  isEditMode: boolean,
  isDragging: boolean,
) => {
  if (activeTool === 'draw-area' && isEditMode) {
    return 'none'
  }
  if (activeTool === 'hand') {
    return isDragging ? 'grabbing' : 'grab'
  }
  if (activeTool === 'select') {
    return 'default'
  }
  if (activeTool === 'draw-wall' || activeTool === 'draw-shape') {
    return 'crosshair'
  }
  if (activeTool === 'place-camera' || activeTool === 'place-person') {
    return 'none'
  }
  return undefined
}

export const closeRing = (points: GeoPoint[]) => {
  if (points.length === 0) {
    return points
  }
  const [firstLng, firstLat] = points[0]
  const [lastLng, lastLat] = points[points.length - 1]
  if (firstLng === lastLng && firstLat === lastLat) {
    return points
  }
  return [...points, points[0]]
}

export const formatMeters = (meters: number) => `${meters.toFixed(1)} m`
export const formatArea = (squareMeters: number) =>
  `${squareMeters.toFixed(1)} m²`

export const computePerimeter = (points: GeoPoint[]) => {
  if (points.length < 2) {
    return 0
  }
  const ring = closeRing(points)
  return turfLength(lineString(ring), {units: 'kilometers'}) * 1000
}

export const computeArea = (points: GeoPoint[]) => {
  if (points.length < 3) {
    return 0
  }
  const ring = closeRing(points)
  return turfArea(polygon([ring]))
}

export const computeSegmentLength = (points: GeoPoint[]) => {
  if (points.length < 2) {
    return 0
  }
  return turfLength(lineString(points.slice(-2)), {units: 'kilometers'}) * 1000
}

export const projectPoint = (
  start: GeoPoint,
  bearingDegrees: number,
  distanceMeters: number,
): GeoPoint => {
  const dest = destination(
    point(start),
    distanceMeters / 1000,
    bearingDegrees,
    {
      units: 'kilometers',
    },
  )
  return dest.geometry.coordinates as GeoPoint
}

export const createPolygonGeometry = (points: GeoPoint[]): PolygonGeometry => ({
  type: 'polygon',
  coordinates: closeRing(points),
  bezierControls: [],
})

export const computeAngleDeg = (a: GeoPoint, b: GeoPoint) => {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI
  return (angle + 360) % 360
}

export const isPointInsideArea = (pointCoords: GeoPoint, area: AreaEntity) => {
  const ring = closeRing(area.geometry.coordinates)
  return booleanPointInPolygon(point(pointCoords), polygon([ring]))
}

export const createRectangleRing = (
  start: GeoPoint,
  end: GeoPoint,
  constrainSquare = false,
  fromCenter = false,
): GeoPoint[] => {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  const side = constrainSquare
    ? Math.max(Math.abs(dx), Math.abs(dy))
    : undefined
  const width = constrainSquare
    ? Math.sign(dx || 1) * (side ?? Math.abs(dx))
    : dx
  const height = constrainSquare
    ? Math.sign(dy || 1) * (side ?? Math.abs(dy))
    : dy

  const origin = fromCenter
    ? [start[0] - width / 2, start[1] - height / 2]
    : start
  const [x, y] = origin
  const ring: GeoPoint[] = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
  ]
  return closeRing(ring)
}

export const createLineGeometry = (start: GeoPoint, end: GeoPoint) => [
  start,
  end,
]

export const createTriangleRing = (points: GeoPoint[]) =>
  points.length === 3 ? closeRing(points) : null

export const createCircleRing = (
  center: GeoPoint,
  radiusMeters: number,
  segments = 64,
): GeoPoint[] => {
  const coords: GeoPoint[] = []
  for (let i = 0; i < segments; i += 1) {
    const bearing = (i / segments) * 360
    const dest = destination(point(center), radiusMeters / 1000, bearing, {
      units: 'kilometers',
    })
    coords.push(dest.geometry.coordinates as GeoPoint)
  }
  return closeRing(coords)
}

export const createFovRing = (
  origin: GeoPoint,
  direction: number,
  fov: number,
  depth: number,
  segments = DEFAULT_FOV_SEGMENTS,
) => {
  const halfFov = fov / 2
  const start = direction - halfFov
  const step = fov / segments
  const ring: GeoPoint[] = [origin]

  for (let i = 0; i <= segments; i += 1) {
    const bearing = start + step * i
    ring.push(projectPoint(origin, bearing, depth))
  }

  ring.push(origin)
  return closeRing(ring)
}

interface FovOcclusionObstacle {
  boundary: Feature<LineString | MultiLineString>
  height: number
}

const getIntersectionDistance = (
  origin: GeoPoint,
  ray: Feature<LineString>,
  boundary: Feature<LineString | MultiLineString>,
) => {
  const intersections = lineIntersect(ray, boundary)
  if (!intersections.features.length) {
    return null
  }
  let closest = Infinity
  intersections.features.forEach((feature) => {
    const coords = feature.geometry.coordinates as GeoPoint
    const meters =
      turfDistance(point(origin), point(coords), {units: 'kilometers'}) * 1000
    if (meters > MIN_INTERSECTION_DISTANCE && meters < closest) {
      closest = meters
    }
  })
  return Number.isFinite(closest) ? closest : null
}

const buildLineBuffer = (points: GeoPoint[], thickness: number) => {
  if (points.length < 2) {
    return null
  }
  try {
    return buffer(lineString(points), thickness / 2, {
      units: 'meters',
    }) as Feature<MultiPolygon | Polygon>
  } catch {
    return null
  }
}

const buildPolygonObstacle = (
  points: GeoPoint[],
): Feature<MultiPolygon | Polygon> | null => {
  if (points.length < 3) {
    return null
  }
  return polygon([closeRing(points)])
}

export const buildFovOcclusionObstacles = (
  walls: WallEntity[],
  shapes: ShapeEntity[],
): FovOcclusionObstacle[] => {
  const obstacles: FovOcclusionObstacle[] = []

  walls.forEach((wall) => {
    const buffered = buildLineBuffer(
      wall.points,
      wall.thickness ?? DEFAULT_WALL_THICKNESS,
    )
    if (!buffered) {
      return
    }
    const boundary = polygonToLine(buffered) as Feature<
      LineString | MultiLineString
    >
    obstacles.push({boundary, height: wall.height ?? 0})
  })

  shapes.forEach((shape) => {
    let polygonFeature: Feature<MultiPolygon | Polygon> | null = null
    if (shape.shapeType === 'line') {
      const thickness =
        (shape as ShapeEntity & {thickness?: number}).thickness ??
        DEFAULT_LINE_SHAPE_THICKNESS
      polygonFeature = buildLineBuffer(shape.geometry, thickness)
    } else {
      polygonFeature = buildPolygonObstacle(shape.geometry)
    }
    if (!polygonFeature) {
      return
    }
    const boundary = polygonToLine(polygonFeature) as Feature<
      LineString | MultiLineString
    >
    obstacles.push({boundary, height: shape.height ?? 0})
  })

  return obstacles
}

export const buildOccludedFovRing = ({
  origin,
  direction,
  fov,
  depth,
  cameraHeight,
  area,
  obstacles,
  segments = DEFAULT_FOV_SEGMENTS,
}: {
  origin: GeoPoint
  direction: number
  fov: number
  depth: number
  cameraHeight: number
  area?: AreaEntity | null
  obstacles: FovOcclusionObstacle[]
  segments?: number
}) => {
  const halfFov = fov / 2
  const start = direction - halfFov
  const step = fov / segments
  const ring: GeoPoint[] = [origin]
  const areaBoundary = area
    ? (polygonToLine(
        polygon([closeRing(area.geometry.coordinates)]),
      ) as Feature<LineString | MultiLineString>)
    : null
  const safeDepth = Math.max(depth, MIN_FOV_DISTANCE)

  for (let i = 0; i <= segments; i += 1) {
    const bearing = start + step * i
    const rayEnd = projectPoint(origin, bearing, depth)
    const ray = lineString([origin, rayEnd]) as Feature<LineString>
    let maxDistance = depth

    if (areaBoundary) {
      const boundaryHit = getIntersectionDistance(origin, ray, areaBoundary)
      if (boundaryHit !== null && boundaryHit < maxDistance) {
        maxDistance = boundaryHit
      }
    }

    obstacles.forEach((obstacle) => {
      const hitDistance = getIntersectionDistance(
        origin,
        ray,
        obstacle.boundary,
      )
      if (hitDistance === null) {
        return
      }
      const normalizedDistance = Math.min(hitDistance / safeDepth, 1)
      const rayHeightAtHit = cameraHeight * (1 - normalizedDistance)
      if (obstacle.height < rayHeightAtHit) {
        return
      }
      if (hitDistance < maxDistance) {
        maxDistance = hitDistance
      }
    })

    const appliedDistance = Math.max(maxDistance, MIN_FOV_DISTANCE)
    ring.push(projectPoint(origin, bearing, appliedDistance))
  }

  ring.push(origin)
  return closeRing(ring)
}

export const getNextAreaColor = (areas: AreaEntity[]) =>
  AREA_COLORS[areas.length % AREA_COLORS.length] ?? DEFAULT_AREA_STYLE.fillColor

export const buildAreaFeatureCollection = (
  areas: AreaEntity[],
  activeAreaId?: string,
) => ({
  type: 'FeatureCollection' as const,
  features: areas.map((area) => ({
    type: 'Feature' as const,
    id: area.id,
    properties: {
      id: area.id,
      areaId: area.id,
      entityType: 'area',
      color: area.style.fillColor,
      opacity: area.style.fillOpacity,
      borderColor: area.style.borderColor,
      isActive: area.id === activeAreaId,
      pointCount: area.pointCount,
    },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [closeRing(area.geometry.coordinates)],
    },
  })),
})

export const getSafeRing = (coordinates: GeoPoint[]) => {
  if (!coordinates || coordinates.length < 4) {
    return null
  }
  const hasInvalid = coordinates.some(
    (coordinate) =>
      !coordinate ||
      !Number.isFinite(coordinate[0]) ||
      !Number.isFinite(coordinate[1]),
  )
  if (hasInvalid) {
    return null
  }
  return closeRing(coordinates)
}

export const distanceToSegment = (
  targetPoint: GeoPoint,
  a: GeoPoint,
  b: GeoPoint,
) => {
  const [px, py] = targetPoint
  const [ax, ay] = a
  const [bx, by] = b
  const dx = bx - ax
  const dy = by - ay
  const lengthSq = dx * dx + dy * dy
  if (lengthSq === 0) {
    return Math.hypot(px - ax, py - ay)
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / lengthSq
  t = Math.max(0, Math.min(1, t))
  const projX = ax + t * dx
  const projY = ay + t * dy
  return Math.hypot(px - projX, py - projY)
}

export const buildOverlapFeatures = (
  areas: AreaEntity[],
): FeatureCollection | null => {
  if (areas.length < 2) {
    return null
  }
  const features: Feature[] = []
  areas.forEach((area, index) => {
    const baseRing = getSafeRing(area.geometry.coordinates)
    if (!baseRing || baseRing.length < 4) {
      return
    }
    const base = polygon([baseRing]) as Feature<
      MultiPolygon | Polygon,
      GeoJsonProperties
    >
    for (let i = index + 1; i < areas.length; i += 1) {
      const otherRing = getSafeRing(areas[i].geometry.coordinates)
      if (!otherRing || otherRing.length < 4) {
        continue
      }

      const other = polygon([otherRing]) as Feature<
        MultiPolygon | Polygon,
        GeoJsonProperties
      >

      try {
        const overlap = intersect(
          featureCollection([base, other]) as FeatureCollection<
            MultiPolygon | Polygon,
            GeoJsonProperties
          >,
        )
        if (overlap) {
          features.push(overlap as Feature)
        }
      } catch {
        // ignore invalid intersections
      }
    }
  })
  return features.length > 0
    ? ({type: 'FeatureCollection', features} as FeatureCollection)
    : null
}

export const buildWallFeatures = (walls: WallEntity[]): FeatureCollection => ({
  type: 'FeatureCollection',
  features: walls
    .filter((wall) => wall.points.length >= 2)
    .map((wall) => ({
      type: 'Feature' as const,
      id: wall.id,
      properties: {
        id: wall.id,
        areaId: wall.areaId,
        entityType: 'wall',
        color: wall.color ?? DEFAULT_WALL_COLOR,
        thickness: wall.thickness,
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: wall.points,
      },
    })),
})

export const buildWallVertexFeatures = (
  walls: WallEntity[],
): FeatureCollection => ({
  type: 'FeatureCollection',
  features: walls
    .filter((wall) => wall.points.length > 0)
    .flatMap((wall) =>
      wall.points.map((coordinate, index) => ({
        type: 'Feature' as const,
        id: `${wall.id}-vertex-${index}`,
        properties: {
          id: wall.id,
          areaId: wall.areaId,
          entityType: 'wall',
          color: wall.color ?? DEFAULT_WALL_COLOR,
          role: index === 0 ? 'start' : 'vertex',
        },
        geometry: {
          type: 'Point' as const,
          coordinates: coordinate,
        },
      })),
    ),
})

export const buildShapeFeatures = (
  shapes: ShapeEntity[],
): FeatureCollection => ({
  type: 'FeatureCollection',
  features: shapes
    .filter((shape) => shape.geometry.length >= 2)
    .map((shape) => {
      const isLine = shape.shapeType === 'line'
      const lineCoordinates = [...shape.geometry] as number[][]
      const polygonCoordinates = [closeRing([...shape.geometry]) as number[][]]
      const geometry: Geometry = isLine
        ? {
            type: 'LineString',
            coordinates: lineCoordinates,
          }
        : {
            type: 'Polygon',
            coordinates: polygonCoordinates,
          }
      return {
        type: 'Feature',
        id: shape.id,
        properties: {
          id: shape.id,
          areaId: shape.areaId,
          entityType: 'shape',
          color: shape.color ?? SHAPE_STROKE_COLOR,
          shapeType: shape.shapeType,
        },
        geometry,
      } as Feature<Geometry, GeoJsonProperties>
    }),
})

export const buildCameraFeatures = (
  cameras: CameraEntity[],
): FeatureCollection<Point> => ({
  type: 'FeatureCollection',
  features: cameras.map((camera) => ({
    type: 'Feature',
    id: camera.id,
    properties: {
      id: camera.id,
      areaId: camera.areaId,
      entityType: 'camera',
      direction: camera.ptz?.pan ?? camera.direction,
      color: camera.color,
    },
    geometry: {
      type: 'Point',
      coordinates: [camera.x, camera.y],
    },
  })),
})

export interface CameraLayerData {
  points: FeatureCollection<Point>
  fovs: FeatureCollection<Polygon>
  directions: FeatureCollection<LineString>
}

export const buildCameraLayerData = (
  cameras: CameraEntity[],
  areas: AreaEntity[],
  walls: WallEntity[],
  shapes: ShapeEntity[],
): CameraLayerData => {
  const pointFeatures: Feature<Point>[] = []
  const fovFeatures: Feature<Polygon>[] = []
  const directionFeatures: Feature<LineString>[] = []
  const areaMap = new Map(areas.map((area) => [area.id, area]))
  const wallGroups = new Map<string, WallEntity[]>()
  const shapeGroups = new Map<string, ShapeEntity[]>()
  const obstacleGroups = new Map<string, FovOcclusionObstacle[]>()

  walls.forEach((wall) => {
    const group = wallGroups.get(wall.areaId) ?? []
    group.push(wall)
    wallGroups.set(wall.areaId, group)
  })

  shapes.forEach((shape) => {
    const group = shapeGroups.get(shape.areaId) ?? []
    group.push(shape)
    shapeGroups.set(shape.areaId, group)
  })

  cameras.forEach((camera) => {
    const origin: GeoPoint = [camera.x, camera.y]
    const effectivePan = camera.ptz?.pan ?? camera.direction
    const effectiveFov = getEffectiveHorizontalFov(camera)
    const area = areaMap.get(camera.areaId)
    const obstacles =
      obstacleGroups.get(camera.areaId) ??
      buildFovOcclusionObstacles(
        wallGroups.get(camera.areaId) ?? [],
        shapeGroups.get(camera.areaId) ?? [],
      )
    obstacleGroups.set(camera.areaId, obstacles)
    const fovRing = buildOccludedFovRing({
      origin,
      direction: effectivePan,
      fov: effectiveFov,
      depth: camera.depth,
      cameraHeight: camera.height,
      area,
      obstacles,
    })
    const directionPoint = projectPoint(
      origin,
      effectivePan,
      camera.depth * 0.6,
    )

    pointFeatures.push({
      type: 'Feature',
      id: camera.id,
      properties: {
        id: camera.id,
        areaId: camera.areaId,
        entityType: 'camera',
        direction: effectivePan,
        color: camera.color,
      },
      geometry: {
        type: 'Point',
        coordinates: origin,
      },
    })

    fovFeatures.push({
      type: 'Feature',
      id: camera.id,
      properties: {
        id: camera.id,
        cameraId: camera.id,
        areaId: camera.areaId,
        entityType: 'camera',
        color: camera.color,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [fovRing],
      },
    })

    directionFeatures.push({
      type: 'Feature',
      id: camera.id,
      properties: {
        id: camera.id,
        cameraId: camera.id,
        areaId: camera.areaId,
        entityType: 'camera',
        color: camera.color,
      },
      geometry: {
        type: 'LineString',
        coordinates: [origin, directionPoint],
      },
    })
  })

  return {
    points: {type: 'FeatureCollection', features: pointFeatures},
    fovs: {type: 'FeatureCollection', features: fovFeatures},
    directions: {type: 'FeatureCollection', features: directionFeatures},
  }
}

export const buildPersonFeatures = (
  people: PersonEntity[],
): FeatureCollection<Point> => ({
  type: 'FeatureCollection',
  features: people.map((person) => ({
    type: 'Feature',
    id: person.id,
    properties: {
      id: person.id,
      areaId: person.areaId,
      entityType: 'person',
      radius: DEFAULT_PERSON_RADIUS,
    },
    geometry: {
      type: 'Point',
      coordinates: [person.x, person.y],
    },
  })),
})

export type PersonCollisionType = 'person' | 'shape' | 'wall'

interface PersonCollisionParams {
  candidate: GeoPoint
  radius?: number
  areaId?: string
  people: PersonEntity[]
  walls: WallEntity[]
  shapes: ShapeEntity[]
  personId?: string
}

export const getPersonCollision = ({
  candidate,
  radius = DEFAULT_PERSON_RADIUS,
  areaId,
  people,
  walls,
  shapes,
  personId,
}: PersonCollisionParams): {blocked: boolean; type?: PersonCollisionType} => {
  const relevantWalls = areaId
    ? walls.filter((wall) => wall.areaId === areaId)
    : walls
  const candidatePoint = point(candidate)
  const hitsWall = relevantWalls.some((wall) => {
    if (wall.points.length < 2) {
      return false
    }
    const thresholdMeters = radius + (wall.thickness ?? DEFAULT_WALL_THICKNESS)
    return wall.points.some((wallPoint, index) => {
      if (index === wall.points.length - 1) {
        return false
      }
      const next = wall.points[index + 1]
      const segment = lineString([wallPoint, next])
      const distance = pointToLineDistance(candidatePoint, segment, {
        units: 'meters',
      })
      return distance < thresholdMeters
    })
  })

  if (hitsWall) {
    return {blocked: true, type: 'wall'}
  }

  const relevantShapes = areaId
    ? shapes.filter((shape) => shape.areaId === areaId)
    : shapes
  const hitsShape = relevantShapes.some((shape) => {
    if (shape.shapeType === 'line' && shape.geometry.length >= 2) {
      const linePoints = shape.geometry
      const thickness = (shape as {thickness?: number}).thickness ?? 0
      return linePoints.some((shapePoint, index) => {
        if (index === linePoints.length - 1) {
          return false
        }
        const segment = lineString([shapePoint, linePoints[index + 1]])
        const distance = pointToLineDistance(candidatePoint, segment, {
          units: 'meters',
        })
        return distance < radius + thickness
      })
    }
    if (shape.geometry.length < 3) {
      return false
    }
    const ringCoords = closeRing(shape.geometry)
    if (ringCoords.length < 4) {
      return false
    }
    const ring = polygon([ringCoords])
    try {
      return booleanPointInPolygon(point(candidate), ring)
    } catch {
      return false
    }
  })

  if (hitsShape) {
    return {blocked: true, type: 'shape'}
  }

  const relevantPeople = areaId
    ? people.filter((person) => person.areaId === areaId)
    : people
  const collidingPerson = relevantPeople.some((person) => {
    if (person.id === personId) return false
    const distanceMeters = turfDistance(
      candidatePoint,
      point([person.x, person.y]),
      {units: 'meters'},
    )
    return distanceMeters < radius + DEFAULT_PERSON_RADIUS
  })

  if (collidingPerson) {
    return {blocked: true, type: 'person'}
  }

  return {blocked: false}
}

export const doesWallPathHitPerson = (
  path: GeoPoint[],
  people: PersonEntity[],
  thickness: number,
) => {
  if (path.length < 2) {
    return false
  }
  return people.some((person) => {
    const personPoint = point([person.x, person.y])
    return path.some((wallPoint, index) => {
      if (index === path.length - 1) {
        return false
      }
      const next = path[index + 1]
      const segment = lineString([wallPoint, next])
      const distanceMeters = pointToLineDistance(personPoint, segment, {
        units: 'meters',
      })
      return distanceMeters < DEFAULT_PERSON_RADIUS + thickness
    })
  })
}

export const doesShapeHitPerson = (
  shape: ShapeEntity,
  people: PersonEntity[],
) => {
  if (shape.geometry.length < 2) {
    return false
  }

  const ring = shape.shapeType === 'line' ? null : getSafeRing(shape.geometry)
  const linePoints = shape.shapeType === 'line' ? shape.geometry : null
  const shapePolygon = ring ? polygon([ring]) : null
  const lineThickness = (shape as {thickness?: number}).thickness ?? 0

  return people.some((person) => {
    const personPoint = point([person.x, person.y])
    if (shapePolygon) {
      try {
        if (booleanPointInPolygon(personPoint, shapePolygon)) {
          return true
        }
      } catch {
        /* ignore invalid polygon */
      }

      // Edge proximity for polygons
      return ring
        ? ring.some((edgePoint, index) => {
            if (index === ring.length - 1) {
              return false
            }
            const next = ring[index + 1]
            const segment = lineString([edgePoint, next])
            const distanceMeters = pointToLineDistance(personPoint, segment, {
              units: 'meters',
            })
            return distanceMeters < DEFAULT_PERSON_RADIUS
          })
        : false
    }

    if (linePoints) {
      return linePoints.some((edgePoint, index) => {
        if (index === linePoints.length - 1) {
          return false
        }
        const next = linePoints[index + 1]
        const segment = lineString([edgePoint, next])
        const distanceMeters = pointToLineDistance(personPoint, segment, {
          units: 'meters',
        })
        return distanceMeters < DEFAULT_PERSON_RADIUS + lineThickness
      })
    }

    return false
  })
}

const segmentDistanceMeters = (
  a: GeoPoint,
  b: GeoPoint,
  c: GeoPoint,
  d: GeoPoint,
) => {
  const segA = lineString([a, b])
  const segB = lineString([c, d])
  const intersects = lineIntersect(segA, segB)
  if (intersects.features.length > 0) {
    return 0
  }
  const d1 = pointToLineDistance(point(a), segB, {units: 'meters'})
  const d2 = pointToLineDistance(point(b), segB, {units: 'meters'})
  const d3 = pointToLineDistance(point(c), segA, {units: 'meters'})
  const d4 = pointToLineDistance(point(d), segA, {units: 'meters'})
  return Math.min(d1, d2, d3, d4)
}

export const doesWallCollideWithShapes = (
  wallPoints: GeoPoint[],
  shapes: ShapeEntity[],
  thickness: number,
  areaId?: string,
) => {
  if (wallPoints.length < 2) {
    return false
  }
  const filteredShapes = areaId
    ? shapes.filter((shape) => shape.areaId === areaId)
    : shapes

  return filteredShapes.some((shape) => {
    if (shape.shapeType === 'line' && shape.geometry.length >= 2) {
      const shapePoints = shape.geometry
      return wallPoints.some((wallPoint, index) => {
        if (index === wallPoints.length - 1) {
          return false
        }
        const nextWall = wallPoints[index + 1]
        return shapePoints.some((shapePoint, sIndex) => {
          if (sIndex === shapePoints.length - 1) {
            return false
          }
          const nextShape = shapePoints[sIndex + 1]
          return (
            segmentDistanceMeters(wallPoint, nextWall, shapePoint, nextShape) <
            thickness
          )
        })
      })
    }

    const ring = getSafeRing(shape.geometry)
    if (!ring) {
      return false
    }
    const ringLine = lineString(ring)
    const wallLine = lineString(wallPoints)

    if (lineIntersect(wallLine, ringLine).features.length > 0) {
      return true
    }

    try {
      const poly = polygon([ring])
      if (wallPoints.some((pt) => booleanPointInPolygon(point(pt), poly))) {
        return true
      }
    } catch {
      /* ignore invalid polygon */
    }

    return wallPoints.some((pt, index) => {
      if (index === wallPoints.length - 1) {
        return false
      }
      const next = wallPoints[index + 1]
      return ring.some((ringPt, ringIndex) => {
        if (ringIndex === ring.length - 1) {
          return false
        }
        const ringNext = ring[ringIndex + 1]
        return segmentDistanceMeters(pt, next, ringPt, ringNext) < thickness
      })
    })
  })
}

export const doesShapeCollideWithWalls = (
  shape: ShapeEntity,
  walls: WallEntity[],
) => {
  if (shape.geometry.length < 2) {
    return false
  }
  const relevantWalls = walls.filter((wall) => wall.areaId === shape.areaId)
  if (relevantWalls.length === 0) {
    return false
  }

  if (shape.shapeType === 'line') {
    const shapePoints = shape.geometry
    return relevantWalls.some((wall) =>
      wall.points.some((wallPt, index) => {
        if (index === wall.points.length - 1) {
          return false
        }
        const wallNext = wall.points[index + 1]
        return shapePoints.some((shapePt, sIndex) => {
          if (sIndex === shapePoints.length - 1) {
            return false
          }
          const shapeNext = shapePoints[sIndex + 1]
          return (
            segmentDistanceMeters(shapePt, shapeNext, wallPt, wallNext) <
            wall.thickness
          )
        })
      }),
    )
  }

  const ring = getSafeRing(shape.geometry)
  if (!ring) {
    return false
  }
  const ringLine = lineString(ring)

  return relevantWalls.some((wall) => {
    if (wall.points.length < 2) {
      return false
    }
    const wallLine = lineString(wall.points)
    if (lineIntersect(wallLine, ringLine).features.length > 0) {
      return true
    }

    try {
      const poly = polygon([ring])
      if (wall.points.some((pt) => booleanPointInPolygon(point(pt), poly))) {
        return true
      }
    } catch {
      /* ignore invalid polygon */
    }

    return wall.points.some((wallPt, index) => {
      if (index === wall.points.length - 1) {
        return false
      }
      const wallNext = wall.points[index + 1]
      return ring.some((ringPt, ringIndex) => {
        if (ringIndex === ring.length - 1) {
          return false
        }
        const ringNext = ring[ringIndex + 1]
        return (
          segmentDistanceMeters(wallPt, wallNext, ringPt, ringNext) <
          wall.thickness
        )
      })
    })
  })
}
