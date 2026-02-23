import React from 'react'

import type {CameraEntity, SceneRoot} from '@/features/scene/domain/types'
import type {
  RadarSettings,
  VisionState,
} from '@/features/scene/infrastructure/stores/ui.store'

import type {CoordinateTransformer} from './simulation-helpers'
import type {
  RadarAreaPath,
  RadarCameraMarker,
  RadarConnectionLine,
  RadarGridLine,
  RadarPersonMarker,
  RadarWedge,
} from './simulation-radar-svg'

import {closeRing, projectPoint} from '../map-view/map-view-helpers'
import {buildObstacleSegmentsByArea} from './camera-vision'
import {buildFovGroundRing} from './simulation-radar-helpers'

interface UseRadarGeometryInput {
  enabled?: boolean
  scene: SceneRoot
  focusAreaId?: string
  radarSettings: RadarSettings
  size: {width: number; height: number}
  transformer: CoordinateTransformer
  peopleWorld: VisionState['peopleWorld']
  cameraDetections: VisionState['visibleByCameraId']
}

interface RadarWorldPoint {
  x: number
  z: number
}

interface RadarAreaWorldPath {
  id: string
  points: RadarWorldPoint[]
  fillColor: string
  fillOpacity: number
  borderColor: string
  borderWidth: number
}

interface RadarCameraWorldMarker {
  camera: CameraEntity
  point: RadarWorldPoint
  arrowPoint: RadarWorldPoint
}

interface RadarWedgeWorld {
  camera: CameraEntity
  origin: RadarWorldPoint
  points: RadarWorldPoint[]
}

// eslint-disable-next-line max-lines-per-function
export const useRadarGeometry = ({
  enabled = true,
  scene,
  focusAreaId,
  radarSettings,
  size,
  transformer,
  peopleWorld,
  cameraDetections,
}: UseRadarGeometryInput) => {
  const visibleAreas = React.useMemo(() => {
    if (!enabled) {
      return []
    }

    return focusAreaId
      ? scene.areas.filter((area) => area.id === focusAreaId)
      : scene.areas
  }, [enabled, focusAreaId, scene.areas])

  const visibleCameras = React.useMemo(() => {
    if (!enabled) {
      return []
    }

    return focusAreaId
      ? scene.cameras.filter((camera) => camera.areaId === focusAreaId)
      : scene.cameras
  }, [enabled, focusAreaId, scene.cameras])

  const visiblePeople = React.useMemo(() => {
    if (!enabled) {
      return []
    }

    return focusAreaId
      ? scene.people.filter((person) => person.areaId === focusAreaId)
      : scene.people
  }, [enabled, focusAreaId, scene.people])

  const visiblePeopleIds = React.useMemo(
    () => new Set(visiblePeople.map((person) => person.id)),
    [visiblePeople],
  )

  const areaById = React.useMemo(
    () => new Map(scene.areas.map((area) => [area.id, area])),
    [scene.areas],
  )

  const cameraById = React.useMemo(
    () => new Map(visibleCameras.map((camera) => [camera.id, camera])),
    [visibleCameras],
  )

  const obstaclesByArea = React.useMemo(
    () =>
      enabled ? buildObstacleSegmentsByArea(scene, transformer) : new Map(),
    [enabled, scene, transformer],
  )

  const areaWorldPaths = React.useMemo<RadarAreaWorldPath[]>(
    () =>
      visibleAreas.map((area) => ({
        id: area.id,
        points: closeRing(area.geometry.coordinates).map((coord) => {
          const vec = transformer.toVector3(coord)
          return {x: vec.x, z: vec.z}
        }),
        fillColor: area.style.fillColor,
        fillOpacity: area.style.fillOpacity,
        borderColor: area.style.borderColor,
        borderWidth: area.style.borderWidth,
      })),
    [transformer, visibleAreas],
  )

  const cameraWorldMarkers = React.useMemo<RadarCameraWorldMarker[]>(
    () =>
      visibleCameras.map((camera) => {
        const world = transformer.toVector3([camera.x, camera.y])
        const pan = camera.ptz.pan
        const arrowDistance = Math.max(camera.depth * 0.15, 2)
        const directionGeo = projectPoint(
          [camera.x, camera.y],
          pan,
          arrowDistance,
        )
        const directionWorld = transformer.toVector3(directionGeo)

        return {
          camera,
          point: {x: world.x, z: world.z},
          arrowPoint: {x: directionWorld.x, z: directionWorld.z},
        }
      }),
    [transformer, visibleCameras],
  )

  const cameraWorldById = React.useMemo(
    () =>
      new Map(
        cameraWorldMarkers.map((marker) => [marker.camera.id, marker.point]),
      ),
    [cameraWorldMarkers],
  )

  const worldPoints = React.useMemo(() => {
    const points: RadarWorldPoint[] = []
    areaWorldPaths.forEach((area) => {
      points.push(...area.points)
    })
    cameraWorldMarkers.forEach((camera) => {
      points.push(camera.point)
    })
    return points
  }, [areaWorldPaths, cameraWorldMarkers])

  const worldBounds = React.useMemo(() => {
    if (worldPoints.length === 0) {
      return {minX: -50, maxX: 50, minZ: -50, maxZ: 50}
    }

    let minX = Infinity
    let maxX = -Infinity
    let minZ = Infinity
    let maxZ = -Infinity

    worldPoints.forEach((point) => {
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minZ = Math.min(minZ, point.z)
      maxZ = Math.max(maxZ, point.z)
    })

    return {minX, maxX, minZ, maxZ}
  }, [worldPoints])

  const scale = React.useMemo(() => {
    const width = Math.max(worldBounds.maxX - worldBounds.minX, 1)
    const height = Math.max(worldBounds.maxZ - worldBounds.minZ, 1)
    const base = Math.min(size.width, size.height) - 32
    return (base / Math.max(width, height)) * radarSettings.zoom
  }, [radarSettings.zoom, size.height, size.width, worldBounds])

  const center = React.useMemo(
    () => ({
      x: (worldBounds.minX + worldBounds.maxX) / 2,
      z: (worldBounds.minZ + worldBounds.maxZ) / 2,
    }),
    [worldBounds],
  )

  const toRadar = React.useMemo(() => {
    const offsetX = size.width / 2 + radarSettings.pan.x
    const offsetY = size.height / 2 + radarSettings.pan.y

    return (point: RadarWorldPoint) => ({
      x: (point.x - center.x) * scale + offsetX,
      y: (point.z - center.z) * scale + offsetY,
    })
  }, [
    center.x,
    center.z,
    radarSettings.pan.x,
    radarSettings.pan.y,
    size.height,
    size.width,
    scale,
  ])

  const cameraMarkers = React.useMemo<RadarCameraMarker[]>(
    () =>
      cameraWorldMarkers.map((marker) => ({
        camera: marker.camera,
        point: toRadar(marker.point),
        arrowPoint: toRadar(marker.arrowPoint),
      })),
    [cameraWorldMarkers, toRadar],
  )

  const peopleMarkers = React.useMemo<RadarPersonMarker[]>(() => {
    if (!enabled) {
      return []
    }

    return visiblePeople
      .map((person) => {
        const world = peopleWorld[person.id]
        const point = world ? toRadar({x: world.x, z: world.z}) : null
        return point ? {id: person.id, point} : null
      })
      .filter((item): item is RadarPersonMarker => item !== null)
  }, [enabled, peopleWorld, toRadar, visiblePeople])

  const wedgeWorlds = React.useMemo<RadarWedgeWorld[]>(() => {
    if (!enabled) {
      return []
    }

    return visibleCameras.map((camera) => {
      const area = areaById.get(camera.areaId)
      const obstacles = obstaclesByArea.get(camera.areaId) ?? []
      const ring = buildFovGroundRing({
        camera,
        origin: [camera.x, camera.y],
        area,
        obstacles,
      })
      const originWorld = transformer.toVector3([camera.x, camera.y])

      return {
        camera,
        origin: {x: originWorld.x, z: originWorld.z},
        points: ring.map((point) => {
          const world = transformer.toVector3(point)
          return {x: world.x, z: world.z}
        }),
      }
    })
  }, [areaById, enabled, obstaclesByArea, transformer, visibleCameras])

  const wedges = React.useMemo<RadarWedge[]>(
    () =>
      wedgeWorlds.map((wedge) => ({
        camera: wedge.camera,
        origin: toRadar(wedge.origin),
        points: wedge.points.map((point) => toRadar(point)),
      })),
    [toRadar, wedgeWorlds],
  )

  const connections = React.useMemo<RadarConnectionLine[]>(() => {
    if (!enabled) {
      return []
    }

    const lines: RadarConnectionLine[] = []

    Object.entries(cameraDetections).forEach(([cameraId, personIds]) => {
      const camera = cameraById.get(cameraId)
      if (!camera) {
        return
      }

      const cameraWorld = cameraWorldById.get(cameraId)
      if (!cameraWorld) {
        return
      }

      const cameraPoint = toRadar(cameraWorld)

      personIds.forEach((personId) => {
        if (!visiblePeopleIds.has(personId)) {
          return
        }

        const world = peopleWorld[personId]
        if (!world) {
          return
        }

        lines.push({
          camera,
          personId,
          cameraPoint,
          personPoint: toRadar({x: world.x, z: world.z}),
        })
      })
    })

    return lines
  }, [
    cameraById,
    cameraDetections,
    cameraWorldById,
    enabled,
    peopleWorld,
    toRadar,
    visiblePeopleIds,
  ])

  const gridLines = React.useMemo<RadarGridLine[]>(() => {
    if (!enabled) {
      return []
    }

    const step = 5
    const lines: RadarGridLine[] = []

    for (
      let x = Math.floor(worldBounds.minX / step) * step;
      x <= worldBounds.maxX;
      x += step
    ) {
      const start = toRadar({x, z: worldBounds.minZ})
      const end = toRadar({x, z: worldBounds.maxZ})
      lines.push({id: `x-${x}`, start, end})
    }

    for (
      let z = Math.floor(worldBounds.minZ / step) * step;
      z <= worldBounds.maxZ;
      z += step
    ) {
      const start = toRadar({x: worldBounds.minX, z})
      const end = toRadar({x: worldBounds.maxX, z})
      lines.push({id: `z-${z}`, start, end})
    }

    return lines
  }, [enabled, toRadar, worldBounds])

  const areaPaths = React.useMemo<RadarAreaPath[]>(
    () =>
      areaWorldPaths.map((area) => {
        const points = area.points.map((point) => toRadar(point))
        const path = points
          .map((point, index) =>
            index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
          )
          .join(' ')

        return {
          id: area.id,
          path: `${path} Z`,
          fillColor: area.fillColor,
          fillOpacity: area.fillOpacity,
          borderColor: area.borderColor,
          borderWidth: area.borderWidth,
        }
      }),
    [areaWorldPaths, toRadar],
  )

  return {
    areaPaths,
    cameraMarkers,
    connections,
    gridLines,
    peopleMarkers,
    toRadar,
    wedges,
  }
}
