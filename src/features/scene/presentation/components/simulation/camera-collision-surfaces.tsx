import type * as THREE from 'three'

import React from 'react'

import type {CameraEntity} from '@/features/scene/domain/types'

import type {WorldEntity} from './simulation-helpers'

import {ShapeCollisionSurface} from './camera-collision-shape'
import {
  createCameraFrustumPlanes,
  getCameraOpticHeight,
} from './camera-collision-utils'
import {WallCollisionSurface} from './camera-collision-wall'

interface CameraCollisionSurfacesProps {
  cameras: CameraEntity[]
  entities: WorldEntity[]
}

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
        if (!camera.showCollisions) {
          return null
        }
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
                opacity={wall.entity.height >= camera.height ? 0.35 : 0.2}
              />
            ))}
            {shapes.map((shape) => (
              <ShapeCollisionSurface
                data={shape}
                key={`${camera.id}-${shape.entity.id}`}
                planes={planes}
                color={camera.color}
                opacity={
                  (shape.entity.height ?? 0) >= camera.height ? 0.4 : 0.2
                }
              />
            ))}
          </group>
        )
      })}
    </>
  )
}
