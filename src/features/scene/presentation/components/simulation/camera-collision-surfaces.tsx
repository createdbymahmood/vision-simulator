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

  const wallEntities = React.useMemo(
    () =>
      entities.filter(
        (entity): entity is Extract<WorldEntity, {type: 'wall'}> =>
          entity.type === 'wall',
      ),
    [entities],
  )

  const shapeEntities = React.useMemo(
    () =>
      entities.filter(
        (entity): entity is Extract<WorldEntity, {type: 'shape'}> =>
          entity.type === 'shape',
      ),
    [entities],
  )

  return (
    <>
      {cameras.map((camera) => {
        const position = cameraWorldPositions.get(camera.id)
        if (!position) {
          return null
        }
        const opticHeight = getCameraOpticHeight(camera)
        const planes = createCameraFrustumPlanes(camera, position, opticHeight)

        return (
          <group key={camera.id}>
            {wallEntities
              .filter((wall) => wall.entity.areaId === camera.areaId)
              .map((wall) => (
                <WallCollisionSurface
                  data={wall}
                  key={`${camera.id}-${wall.entity.id}-${wall.segmentIndex}`}
                  planes={planes}
                  color={camera.color}
                  opacity={wall.entity.height >= camera.height ? 0.35 : 0.2}
                />
              ))}
            {shapeEntities
              .filter((shape) => shape.entity.areaId === camera.areaId)
              .map((shape) => (
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
