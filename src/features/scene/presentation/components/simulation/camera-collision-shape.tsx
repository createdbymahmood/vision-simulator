import {useFrame} from '@react-three/fiber'
import React from 'react'
import * as THREE from 'three'

import type {WorldEntity} from './simulation-helpers'

import {DEBUG_LAYER} from './simulation-layers'

const MIN_SHAPE_HEIGHT = 0.05
const DEFAULT_LINE_THICKNESS = 0.1

interface ShapeCollisionSurfaceProps {
  data: Extract<WorldEntity, {type: 'shape'}>
  planes: THREE.Plane[]
  color: string
  opacity: number
}

export const ShapeCollisionSurface: React.FC<ShapeCollisionSurfaceProps> = ({
  data,
  planes,
  color,
  opacity,
}) => {
  const {entity, points} = data
  const shapeHeight = Math.max(entity.height ?? 0, MIN_SHAPE_HEIGHT)
  const lineThickness = Math.max(
    (entity as {thickness?: number}).thickness ?? DEFAULT_LINE_THICKNESS,
    0.02,
  )

  const geometry = React.useMemo(() => {
    if (entity.shapeType === 'line') {
      if (points.length < 2) {
        return null
      }
      const start = points[0]
      const end = points[points.length - 1]
      const length = start.distanceTo(end)
      return {
        kind: 'line' as const,
        geometry: new THREE.BoxGeometry(length, shapeHeight, lineThickness),
        position: start.clone().add(end).multiplyScalar(0.5),
        rotation: Math.atan2(end.z - start.z, end.x - start.x),
      }
    }

    if (entity.shapeType === 'circle') {
      const bounds = new THREE.Box3().setFromPoints(points)
      const size = bounds.getSize(new THREE.Vector3())
      const center = bounds.getCenter(new THREE.Vector3())
      const radius = Math.max(size.x, size.z) / 2 || 0.1
      return {
        kind: 'cylinder' as const,
        geometry: new THREE.CylinderGeometry(radius, radius, shapeHeight, 48),
        position: new THREE.Vector3(center.x, shapeHeight / 2, center.z),
        rotation: 0,
      }
    }

    if (points.length < 3) {
      return null
    }
    const bounds = new THREE.Box3().setFromPoints(points)
    const center = bounds.getCenter(new THREE.Vector3())
    const shape = new THREE.Shape()
    points.forEach((point, index) => {
      const x = point.x - center.x
      const y = -(point.z - center.z)
      if (index === 0) {
        shape.moveTo(x, y)
      } else {
        shape.lineTo(x, y)
      }
    })
    const extrude = new THREE.ExtrudeGeometry(shape, {
      depth: shapeHeight,
      bevelEnabled: false,
    })
    extrude.rotateX(-Math.PI / 2)
    extrude.translate(0, -shapeHeight / 2, 0)
    return {
      kind: 'extrude' as const,
      geometry: extrude,
      position: new THREE.Vector3(center.x, shapeHeight / 2, center.z),
      rotation: 0,
    }
  }, [entity.shapeType, lineThickness, points, shapeHeight])

  React.useEffect(() => {
    if (!geometry || geometry.kind !== 'extrude') {
      return
    }
    return () => {
      geometry.geometry.dispose()
    }
  }, [geometry])

  const materialRef = React.useRef<THREE.MeshBasicMaterial | null>(null)
  useFrame(({clock}) => {
    if (!materialRef.current) {
      return
    }
    const pulse = 0.85 + 0.15 * Math.sin(clock.elapsedTime * Math.PI)
    materialRef.current.opacity = opacity * pulse
  })

  if (!geometry) {
    return null
  }

  return (
    <group position={geometry.position} rotation={[0, geometry.rotation, 0]}>
      <mesh
        renderOrder={300}
        geometry={geometry.geometry}
        onUpdate={(mesh) => mesh.layers.set(DEBUG_LAYER)}
      >
        <meshBasicMaterial
          transparent
          blending={THREE.AdditiveBlending}
          clippingPlanes={planes}
          depthWrite={false}
          ref={materialRef}
          side={THREE.DoubleSide}
          clipIntersection
          color={color}
          opacity={opacity}
          polygonOffset
          polygonOffsetFactor={2}
          polygonOffsetUnits={2}
        />
      </mesh>
    </group>
  )
}
