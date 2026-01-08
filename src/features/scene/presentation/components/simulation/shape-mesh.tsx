import React from 'react'
import {type ThreeEvent} from '@react-three/fiber'
import * as THREE from 'three'

import type {WorldEntity} from './simulation-helpers'

const SHAPE_BASE_OPACITY = 0.8
const SHAPE_SURFACE_OFFSET = 0.02
const MIN_SHAPE_HEIGHT = 0.05
const DEFAULT_LINE_THICKNESS = 0.1

type LineShapeData = {
  kind: 'line'
  position: THREE.Vector3
  rotationY: number
  length: number
  thickness: number
  focusPoint: THREE.Vector3
  focusDistance: number
}

type CylinderShapeData = {
  kind: 'cylinder'
  position: THREE.Vector3
  radius: number
  focusPoint: THREE.Vector3
  focusDistance: number
}

type ExtrudeShapeData = {
  kind: 'extrude'
  position: THREE.Vector3
  geometry: THREE.ExtrudeGeometry
  focusPoint: THREE.Vector3
  focusDistance: number
}

type ShapeData = LineShapeData | CylinderShapeData | ExtrudeShapeData

const stripClosingPoint = (points: THREE.Vector3[]) => {
  if (points.length < 2) {
    return points
  }
  const first = points[0]
  const last = points[points.length - 1]
  if (first.x === last.x && first.z === last.z) {
    return points.slice(0, -1)
  }
  return points
}

const buildLineShapeData = (
  points: THREE.Vector3[],
  shapeHeight: number,
  lineThickness: number,
): ShapeData | null => {
  if (points.length < 2) {
    return null
  }
  const start = points[0]
  const end = points[points.length - 1]
  const center = start.clone().add(end).multiplyScalar(0.5)
  const length = start.distanceTo(end)
  const focusPoint = new THREE.Vector3(
    center.x,
    shapeHeight / 2 + SHAPE_SURFACE_OFFSET,
    center.z,
  )
  return {
    kind: 'line',
    position: focusPoint.clone(),
    rotationY: Math.atan2(end.z - start.z, end.x - start.x),
    length,
    thickness: lineThickness,
    focusPoint,
    focusDistance: Math.max(length, shapeHeight, lineThickness) * 1.6,
  }
}

const buildCircleShapeData = (
  points: THREE.Vector3[],
  shapeHeight: number,
): ShapeData | null => {
  if (points.length < 2) {
    return null
  }
  const bounds = new THREE.Box3().setFromPoints(points)
  const size = bounds.getSize(new THREE.Vector3())
  const center = bounds.getCenter(new THREE.Vector3())
  const radius = Math.max(size.x, size.z) / 2 || 0.1
  const focusPoint = new THREE.Vector3(
    center.x,
    shapeHeight / 2 + SHAPE_SURFACE_OFFSET,
    center.z,
  )
  return {
    kind: 'cylinder',
    position: focusPoint.clone(),
    radius,
    focusPoint,
    focusDistance: Math.max(radius * 2, shapeHeight) * 2,
  }
}

const buildExtrudeShapeData = (
  points: THREE.Vector3[],
  shapeHeight: number,
): ShapeData | null => {
  if (points.length < 3) {
    return null
  }
  const bounds = new THREE.Box3().setFromPoints(points)
  const size = bounds.getSize(new THREE.Vector3())
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
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: shapeHeight,
    bevelEnabled: false,
  })
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, -shapeHeight / 2, 0)

  const focusPoint = new THREE.Vector3(
    center.x,
    shapeHeight / 2 + SHAPE_SURFACE_OFFSET,
    center.z,
  )

  return {
    kind: 'extrude',
    geometry,
    position: focusPoint.clone(),
    focusPoint,
    focusDistance: Math.max(size.x, size.z, shapeHeight) * 1.6,
  }
}

const useShapeData = (
  entity: Extract<WorldEntity, {type: 'shape'}>['entity'],
  points: THREE.Vector3[],
  shapeHeight: number,
  lineThickness: number,
) =>
  React.useMemo(() => {
    if (entity.shapeType === 'line') {
      return buildLineShapeData(points, shapeHeight, lineThickness)
    }
    const sanitized = stripClosingPoint(points)
    if (entity.shapeType === 'circle') {
      return buildCircleShapeData(sanitized, shapeHeight)
    }
    return buildExtrudeShapeData(sanitized, shapeHeight)
  }, [entity.shapeType, lineThickness, points, shapeHeight])

export const ShapeMesh: React.FC<{
  data: Extract<WorldEntity, {type: 'shape'}>
  onSelect: (id?: string) => void
  onFocus: (point: THREE.Vector3, distance?: number) => void
  selected: boolean
}> = ({data, onSelect, onFocus, selected}) => {
  const {entity, points, dimmed} = data
  const color = entity.color ?? '#94A3B8'
  const shapeHeight = Math.max(entity.height ?? 0, MIN_SHAPE_HEIGHT)
  const lineThickness = Math.max(
    (entity as {thickness?: number}).thickness ?? DEFAULT_LINE_THICKNESS,
    0.02,
  )
  const renderOrder = data.renderOrder ?? 0

  const shapeData = useShapeData(entity, points, shapeHeight, lineThickness)

  React.useEffect(() => {
    const extrudeGeometry = shapeData?.kind === 'extrude' ? shapeData.geometry : null
    return () => {
      extrudeGeometry?.dispose()
    }
  }, [shapeData])

  if (!shapeData) {
    return null
  }

  const baseOpacity = dimmed ? SHAPE_BASE_OPACITY * 0.5 : SHAPE_BASE_OPACITY

  const handleSelect = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onSelect(entity.id)
    if (event.detail === 2) {
      onFocus(shapeData.focusPoint.clone(), shapeData.focusDistance)
    }
  }

  if (shapeData.kind === 'line') {
    return (
      <group
        position={shapeData.position}
        rotation={[0, shapeData.rotationY, 0]}
        renderOrder={renderOrder}
      >
        <mesh castShadow receiveShadow onClick={handleSelect} renderOrder={renderOrder}>
          <boxGeometry
            args={[shapeData.length, shapeHeight, shapeData.thickness]}
          />
          <meshStandardMaterial
            color={color}
            roughness={0.8}
            metalness={0.1}
            transparent
            opacity={baseOpacity}
            emissive={selected ? color : '#000000'}
            emissiveIntensity={selected ? 0.3 : 0}
            depthWrite={false}
          />
        </mesh>
      </group>
    )
  }

  if (shapeData.kind === 'cylinder') {
    return (
      <group position={shapeData.position} renderOrder={renderOrder}>
        <mesh castShadow receiveShadow onClick={handleSelect} renderOrder={renderOrder}>
          <cylinderGeometry
            args={[shapeData.radius, shapeData.radius, shapeHeight, 48]}
          />
          <meshStandardMaterial
            color={color}
            roughness={0.8}
            metalness={0.1}
            transparent
            opacity={baseOpacity}
            emissive={selected ? color : '#000000'}
            emissiveIntensity={selected ? 0.3 : 0}
            depthWrite={false}
          />
        </mesh>
      </group>
    )
  }

  return (
    <group position={shapeData.position} renderOrder={renderOrder}>
      <mesh
        castShadow
        receiveShadow
        geometry={shapeData.geometry}
        onClick={handleSelect}
        renderOrder={renderOrder}
      >
        <meshStandardMaterial
          color={color}
          roughness={0.8}
          metalness={0.1}
          transparent
          opacity={baseOpacity}
          emissive={selected ? color : '#000000'}
          emissiveIntensity={selected ? 0.3 : 0}
          polygonOffset
          polygonOffsetFactor={2}
          polygonOffsetUnits={2}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
