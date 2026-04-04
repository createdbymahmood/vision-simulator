import type * as THREE from 'three'

import React from 'react'

import type {CameraEntity} from '@/features/scene/types/types'

import type {WorldEntity} from './simulation-helpers'

import {ShapeCollisionSurface} from './camera-collision-shape'
import {
  createCameraFrustumPlanes,
  getCameraOpticHeight,
} from './camera-collision-utils'
import {WallCollisionSurface} from './camera-collision-wall'

const WALL_FULL_OCCLUSION_OPACITY = 0.35
const SHAPE_FULL_OCCLUSION_OPACITY = 0.4
const PARTIAL_OCCLUSION_OPACITY = 0.2

interface CameraCollisionSurfacesProps {
  cameras: CameraEntity[]
  entities: WorldEntity[]
}

const getCollisionOpacity = ({
  cameraHeight,
  obstacleHeight,
  fullOcclusionOpacity,
}: {
  cameraHeight: number
  obstacleHeight: number
  fullOcclusionOpacity: number
}) =>
  obstacleHeight >= cameraHeight
    ? fullOcclusionOpacity
    : PARTIAL_OCCLUSION_OPACITY

export const CameraCollisionSurfaces: React.FC<
  CameraCollisionSurfacesProps
> = ({cameras, entities}) => {
  const cameraWorldPositions = React.useMemo(() => {
    const map = new Map<string, THREE.Vector3>()
    entities.forEach((entity) => {
      if (entity.type !== 'camera') {
        return
      }
      map.set(entity.entity.id, entity.position.clone())
    })
    return map
  }, [entities])

  const wallEntitiesByArea = React.useMemo(() => {
    const map = new Map<string, Extract<WorldEntity, {type: 'wall'}>[]>()
    entities.forEach((entity) => {
      if (entity.type !== 'wall') {
        return
      }
      const areaWalls = map.get(entity.entity.areaId)
      if (areaWalls) {
        areaWalls.push(entity)
      } else {
        map.set(entity.entity.areaId, [entity])
      }
    })
    return map
  }, [entities])

  const shapeEntitiesByArea = React.useMemo(() => {
    const map = new Map<string, Extract<WorldEntity, {type: 'shape'}>[]>()
    entities.forEach((entity) => {
      if (entity.type !== 'shape') {
        return
      }
      const areaShapes = map.get(entity.entity.areaId)
      if (areaShapes) {
        areaShapes.push(entity)
      } else {
        map.set(entity.entity.areaId, [entity])
      }
    })
    return map
  }, [entities])

  return (
    <>
      {cameras.map((camera) => {
        const position = cameraWorldPositions.get(camera.id)
        if (!position) {
          return null
        }
        const walls = wallEntitiesByArea.get(camera.areaId) ?? []
        const shapes = shapeEntitiesByArea.get(camera.areaId) ?? []
        if (walls.length === 0 && shapes.length === 0) {
          return null
        }
        const opticHeight = getCameraOpticHeight(camera)
        const planes = createCameraFrustumPlanes(camera, position, opticHeight)

        return (
          <group key={camera.id}>
            {walls.map((wall) => (
              <WallCollisionSurface
                data={wall}
                key={`${camera.id}-${wall.entity.id}-${wall.segmentIndex}`}
                planes={planes}
                color={camera.color}
                opacity={getCollisionOpacity({
                  cameraHeight: camera.height,
                  obstacleHeight: wall.entity.height,
                  fullOcclusionOpacity: WALL_FULL_OCCLUSION_OPACITY,
                })}
              />
            ))}
            {shapes.map((shape) => (
              <ShapeCollisionSurface
                data={shape}
                key={`${camera.id}-${shape.entity.id}`}
                planes={planes}
                color={camera.color}
                opacity={getCollisionOpacity({
                  cameraHeight: camera.height,
                  obstacleHeight: shape.entity.height ?? 0,
                  fullOcclusionOpacity: SHAPE_FULL_OCCLUSION_OPACITY,
                })}
              />
            ))}
          </group>
        )
      })}
    </>
  )
}
