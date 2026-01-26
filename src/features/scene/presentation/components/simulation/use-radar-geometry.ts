import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
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
  RadarPoint,
  RadarWedge,
} from './simulation-radar-svg'

import {closeRing} from '../map-view/map-view-helpers'
import {buildFovRing, degToRad} from './simulation-radar-helpers'

interface UseRadarGeometryInput {
  scene: SceneRoot
  radarSettings: RadarSettings
  transformer: CoordinateTransformer
  peopleWorld: VisionState['peopleWorld']
  cameraDetections: VisionState['visibleByCameraId']
}

export const useRadarGeometry = ({
  scene,
  radarSettings,
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
    const base =
      Math.min(radarSettings.size.width, radarSettings.size.height) - 32
    return (base / Math.max(width, height)) * radarSettings.zoom
  }, [
    radarSettings.size.height,
    radarSettings.size.width,
    radarSettings.zoom,
    worldBounds,
  ])

  const center = React.useMemo(
    () => ({
      x: (worldBounds.minX + worldBounds.maxX) / 2,
      z: (worldBounds.minZ + worldBounds.maxZ) / 2,
    }),
    [worldBounds],
  )

  const toRadar = useCallbackRef((point: {x: number; z: number}) => ({
    x:
      (point.x - center.x) * scale +
      radarSettings.size.width / 2 +
      radarSettings.pan.x,
    y:
      (point.z - center.z) * scale +
      radarSettings.size.height / 2 +
      radarSettings.pan.y,
  }))

  const cameraMarkers = React.useMemo<RadarCameraMarker[]>(
    () =>
      scene.cameras.map((camera) => {
        const world = transformer.toVector3([camera.x, camera.y])
        const point = toRadar({x: world.x, z: world.z})
        const yaw = -degToRad(camera.ptz?.pan ?? camera.direction)
        const arrowLength = 2
        const arrowWorld = {
          x: world.x + Math.sin(yaw) * arrowLength,
          z: world.z - Math.cos(yaw) * arrowLength,
        }
        const arrowPoint = toRadar(arrowWorld)
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
    if (!radarSettings.showWedges) {
      return []
    }
    return scene.cameras.map((camera) => {
      const world = transformer.toVector3([camera.x, camera.y])
      const ring = buildFovRing({camera, origin: {x: world.x, z: world.z}})
      const points = ring.map((point) => toRadar(point))
      const origin = toRadar({x: world.x, z: world.z})
      return {camera, origin, points}
    })
  }, [radarSettings.showWedges, scene.cameras, toRadar, transformer])

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
    if (!radarSettings.showGrid) {
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
  }, [radarSettings.showGrid, toRadar, worldBounds])

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
