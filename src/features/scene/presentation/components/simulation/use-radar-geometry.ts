import React from 'react'

import type {SceneRoot} from '@/features/scene/domain/types'
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
import {getCameraOpticHeight} from './camera-collision-utils'
import {buildFovGroundRing} from './simulation-radar-helpers'

interface UseRadarGeometryInput {
  scene: SceneRoot
  radarSettings: RadarSettings
  size: {width: number; height: number}
  transformer: CoordinateTransformer
  peopleWorld: VisionState['peopleWorld']
  cameraDetections: VisionState['visibleByCameraId']
}

// eslint-disable-next-line max-lines-per-function
export const useRadarGeometry = ({
  scene,
  radarSettings,
  size,
  transformer,
  peopleWorld,
  cameraDetections,
}: UseRadarGeometryInput) => {
  const worldPoints = React.useMemo(() => {
    const points: {x: number; z: number}[] = []
    scene.areas.forEach((area) => {
      closeRing(area.geometry.coordinates).forEach((coord) => {
        const vec = transformer.toVector3(coord)
        points.push({x: vec.x, z: vec.z})
      })
    })
    scene.cameras.forEach((camera) => {
      const vec = transformer.toVector3([camera.x, camera.y])
      points.push({x: vec.x, z: vec.z})
    })
    return points
  }, [scene.areas, scene.cameras, transformer])

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
    return (point: {x: number; z: number}) => ({
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
      scene.cameras.map((camera) => {
        const world = transformer.toVector3([camera.x, camera.y])
        const point = toRadar({x: world.x, z: world.z})
        const pan = camera.ptz.pan
        const arrowDistance = Math.max(camera.depth * 0.15, 2)
        const directionGeo = projectPoint(
          [camera.x, camera.y],
          pan,
          arrowDistance,
        )
        const directionWorld = transformer.toVector3(directionGeo)
        const arrowPoint = toRadar({x: directionWorld.x, z: directionWorld.z})
        return {camera, point, arrowPoint}
      }),
    [scene.cameras, toRadar, transformer],
  )

  const peopleMarkers = React.useMemo<RadarPersonMarker[]>(
    () =>
      scene.people
        .map((person) => {
          const world = peopleWorld[person.id]
          const point = world ? toRadar({x: world.x, z: world.z}) : null
          return point ? {id: person.id, point} : null
        })
        .filter((item): item is RadarPersonMarker => item !== null),
    [peopleWorld, scene.people, toRadar],
  )

  const wedges = React.useMemo<RadarWedge[]>(() => {
    return scene.cameras.map((camera) => {
      const opticHeight = getCameraOpticHeight(camera)
      const ring = buildFovGroundRing({
        camera,
        origin: [camera.x, camera.y],
        opticHeight,
      })
      const points = ring
        .map((point) => transformer.toVector3(point))
        .map((point) => toRadar({x: point.x, z: point.z}))
      const originWorld = transformer.toVector3([camera.x, camera.y])
      const origin = toRadar({x: originWorld.x, z: originWorld.z})
      return {camera, origin, points}
    })
  }, [scene.cameras, toRadar, transformer])

  const connections = React.useMemo<RadarConnectionLine[]>(() => {
    const lines: RadarConnectionLine[] = []
    Object.entries(cameraDetections).forEach(([cameraId, personIds]) => {
      const camera = scene.cameras.find((item) => item.id === cameraId)
      if (!camera) {
        return
      }
      const cameraWorld = transformer.toVector3([camera.x, camera.y])
      const cameraPoint = toRadar({x: cameraWorld.x, z: cameraWorld.z})
      personIds.forEach((personId) => {
        const world = peopleWorld[personId]
        if (!world) {
          return
        }
        lines.push({
          camera,
          cameraPoint,
          personPoint: toRadar({x: world.x, z: world.z}),
        })
      })
    })
    return lines
  }, [cameraDetections, peopleWorld, scene.cameras, toRadar, transformer])

  const gridLines = React.useMemo<RadarGridLine[]>(() => {
    const step = 5
    const lines: RadarGridLine[] = []
    for (
      let x = Math.floor(worldBounds.minX / step) * step;
      x <= worldBounds.maxX;
      x += step
    ) {
      const start = toRadar({x, z: worldBounds.minZ})
      const end = toRadar({x, z: worldBounds.maxZ})
      lines.push({start, end})
    }
    for (
      let z = Math.floor(worldBounds.minZ / step) * step;
      z <= worldBounds.maxZ;
      z += step
    ) {
      const start = toRadar({x: worldBounds.minX, z})
      const end = toRadar({x: worldBounds.maxX, z})
      lines.push({start, end})
    }
    return lines
  }, [toRadar, worldBounds])

  const areaPaths = React.useMemo<RadarAreaPath[]>(
    () =>
      scene.areas.map((area) => {
        const points = closeRing(area.geometry.coordinates).map((coord) => {
          const vec = transformer.toVector3(coord)
          return toRadar({x: vec.x, z: vec.z})
        })
        const path = points
          .map((point, index) =>
            index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
          )
          .join(' ')
        return {id: area.id, path: `${path} Z`}
      }),
    [scene.areas, toRadar, transformer],
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
