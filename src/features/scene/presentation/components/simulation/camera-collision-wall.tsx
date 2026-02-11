import React from 'react'
import * as THREE from 'three'

import type {WorldEntity} from './simulation-helpers'

import {DEBUG_LAYER} from './simulation-layers'

interface WallCollisionSurfaceProps {
  data: Extract<WorldEntity, {type: 'wall'}>
  planes: THREE.Plane[]
  color: string
  opacity: number
}

export const WallCollisionSurface: React.FC<WallCollisionSurfaceProps> = ({
  data,
  planes,
  color,
  opacity,
}) => {
  const midpoint = data.start.clone().add(data.end).multiplyScalar(0.5)
  midpoint.y = data.entity.height / 2
  const angle = Math.atan2(data.start.z - data.end.z, data.end.x - data.start.x)

  return (
    <group position={midpoint} rotation={[0, angle, 0]}>
      <mesh renderOrder={300} onUpdate={(mesh) => mesh.layers.set(DEBUG_LAYER)}>
        <boxGeometry
          args={[data.length, data.entity.height, data.entity.thickness]}
        />
        <meshBasicMaterial
          transparent
          blending={THREE.NormalBlending}
          clippingPlanes={planes}
          depthWrite={false}
          side={THREE.DoubleSide}
          clipIntersection
          color={color}
          fog={false}
          opacity={opacity}
          polygonOffset
          polygonOffsetFactor={2}
          polygonOffsetUnits={2}
        />
      </mesh>
    </group>
  )
}
