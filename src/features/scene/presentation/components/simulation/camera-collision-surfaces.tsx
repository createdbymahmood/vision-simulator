import type * as THREE from 'three'

import React from 'react'

import type {CameraEntity} from '@/features/scene/domain/types'

import type {WorldEntity} from './simulation-helpers'

import {ShapeCollisionSurface} from './camera-collision-shape'
import {
  createCameraFrustumPlanes,
  getCameraOpticHeight,
} from './camera-collision-utils'

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
