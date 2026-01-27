import React from 'react'
import * as THREE from 'three'

import type {CameraEntity} from '@/features/scene/domain/types'

import {DEFAULT_PERSON_RADIUS} from '@/features/scene/domain/constants/person-defaults'

import type {WorldEntity} from './simulation-helpers'

import {ShapeMesh} from './shape-mesh'
import {parseColorAndAlpha} from './simulation-helpers'
import {DEBUG_LAYER} from './simulation-layers'

const WALL_BASE_OPACITY = 0.8

const degToRad = (deg: number) => (deg * Math.PI) / 180

export const WallMesh: React.FC<{
  data: Extract<WorldEntity, {type: 'wall'}>
  onSelect: (id?: string) => void
  onFocus: (point: THREE.Vector3, distance?: number) => void
  selected: boolean
}> = ({data, onSelect, onFocus}) => {
  const midpoint = data.start.clone().add(data.end).multiplyScalar(0.5)
  midpoint.y = data.entity.height / 2
  const angle = Math.atan2(data.end.z - data.start.z, data.end.x - data.start.x)
  return (
    <group position={midpoint} rotation={[0, angle, 0]}>
      <mesh
        castShadow
        onClick={(event) => {
          event.stopPropagation()
          onSelect(data.entity.id)
          if (event.detail === 2) {
            onFocus(midpoint.clone(), Math.max(data.length, 8))
          }
        }}
        receiveShadow
      >
        <boxGeometry
          args={[data.length, data.entity.height, data.entity.thickness]}
        />
        <meshStandardMaterial
          transparent
          metalness={0}
          color={data.entity.color}
          opacity={data.dimmed ? WALL_BASE_OPACITY * 0.5 : WALL_BASE_OPACITY}
          roughness={0.9}
        />
      </mesh>
    </group>
  )
}

export const AreaMesh: React.FC<{
  data: Extract<WorldEntity, {type: 'area'}>
  onSelect: (id?: string) => void
  onFocus: (point: THREE.Vector3, distance?: number) => void
  selected: boolean
}> = ({data, onSelect, onFocus}) => {
  if (data.points.length < 3) {
    return null
  }
  const shape = new THREE.Shape()
  data.points.forEach((point, index) => {
    if (index === 0) {
      shape.moveTo(point.x, point.z)
    } else {
      shape.lineTo(point.x, point.z)
    }
  })
  const extrude = new THREE.ExtrudeGeometry(shape, {
    depth: 0.02,
    bevelEnabled: false,
  })
  extrude.rotateX(-Math.PI / 2)
  const fillColorParsed = parseColorAndAlpha(
    data.entity.style.fillColor ?? data.entity.color,
  )
  const baseOpacity = data.entity.style.fillOpacity ?? 1
  const appliedOpacity = baseOpacity * fillColorParsed.alpha
  const fillColor = fillColorParsed.color
  return (
    <mesh
      renderOrder={0}
      castShadow
      geometry={extrude}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(data.entity.id)
        if (event.detail === 2) {
          const focusPoint = new THREE.Box3()
            .setFromPoints(data.points)
            .getCenter(new THREE.Vector3())
          const size = new THREE.Box3()
            .setFromPoints(data.points)
            .getSize(new THREE.Vector3())
          onFocus(focusPoint, Math.max(size.x, size.z, 20))
        }
      }}
      position={[0, 0.01, 0]}
      receiveShadow
    >
      <meshBasicMaterial
        transparent
        side={THREE.DoubleSide}
        color={fillColor}
        opacity={appliedOpacity}
        polygonOffset
        polygonOffsetFactor={3}
        polygonOffsetUnits={3}
      />
    </mesh>
  )
}

export const PersonMesh: React.FC<{
  data: Extract<WorldEntity, {type: 'person'}>
  onSelect: (id?: string) => void
  onFocus: (point: THREE.Vector3, distance?: number) => void
  selected: boolean
}> = ({data, onSelect, onFocus, selected}) => {
  const radius = DEFAULT_PERSON_RADIUS
  const bodyHeight = Math.max(data.entity.height - radius * 2, radius)
  const color = selected ? '#F7DC6F' : '#4ECDC4'
  return (
    <group position={data.position}>
      <mesh
        castShadow
        onClick={(event) => {
          event.stopPropagation()
          onSelect(data.entity.id)
          if (event.detail === 2) {
            onFocus(data.position.clone(), Math.max(data.entity.height * 2, 8))
          }
        }}
        receiveShadow
      >
        <capsuleGeometry args={[radius, bodyHeight, 8, 16]} />
        <meshStandardMaterial
          emissive={selected ? '#F7DC6F' : '#000000'}
          emissiveIntensity={selected ? 0.4 : 0}
          transparent={data.dimmed}
          color={color}
          opacity={data.dimmed ? 0.5 : 1}
        />
      </mesh>
    </group>
  )
}

const buildFrustumGeometry = (
  camera: CameraEntity,
  opticHeight: number,
  maxFrustumDepth?: number,
) => {
  const yaw = 0 // yaw comes from parent group rotation
  const tilt = degToRad(camera.ptz?.tilt ?? 0)
  const fov = camera.fov / Math.max(camera.ptz?.zoom ?? 1, 0.0001)
  const near = Math.max(camera.nearClipping, 0.1)
  const unclampedFar = Math.max(camera.depth, near + 0.1)
  const far = Math.max(
    near + 0.1,
    Math.min(maxFrustumDepth ?? unclampedFar, unclampedFar),
  )
  const halfFov = degToRad(fov) / 2
  const radialSegments = 32

  const rotation = new THREE.Euler(tilt, yaw, 0, 'YXZ')
  const forward = new THREE.Vector3(0, 0, -1).applyEuler(rotation).normalize()
  const right = new THREE.Vector3(1, 0, 0).applyEuler(rotation).normalize()
  const up = new THREE.Vector3(0, 1, 0).applyEuler(rotation).normalize()

  const origin = new THREE.Vector3(0, 0, 0)
  const nearCenter = origin.clone().add(forward.clone().multiplyScalar(near))
  const farCenter = origin.clone().add(forward.clone().multiplyScalar(far))
  const nearRadius = Math.tan(halfFov) * near
  const farRadius = Math.tan(halfFov) * far

  const nearVertices: THREE.Vector3[] = []
  const farVertices: THREE.Vector3[] = []
  for (let i = 0; i < radialSegments; i += 1) {
    const angle = (i / radialSegments) * Math.PI * 2
    const offset = right
      .clone()
      .multiplyScalar(Math.cos(angle))
      .add(up.clone().multiplyScalar(Math.sin(angle)))
    nearVertices.push(
      nearCenter.clone().add(offset.clone().multiplyScalar(nearRadius)),
    )
    farVertices.push(
      farCenter.clone().add(offset.clone().multiplyScalar(farRadius)),
    )
  }

  const vertices = [
    ...nearVertices,
    ...farVertices,
    nearCenter.clone(),
    farCenter.clone(),
  ]
  const positions = new Float32Array(
    vertices.flatMap((vertex) => [vertex.x, vertex.y, vertex.z]),
  )

  const indices: number[] = []
  for (let i = 0; i < radialSegments; i += 1) {
    const next = (i + 1) % radialSegments
    const nearA = i
    const nearB = next
    const farA = i + radialSegments
    const farB = next + radialSegments
    indices.push(nearA, farA, farB, nearA, farB, nearB)
  }

  const nearCenterIndex = radialSegments * 2
  const farCenterIndex = radialSegments * 2 + 1
  for (let i = 0; i < radialSegments; i += 1) {
    const next = (i + 1) % radialSegments
    indices.push(nearCenterIndex, next, i)
    indices.push(farCenterIndex, i + radialSegments, next + radialSegments)
  }

  const lineIndices: number[] = []
  for (let i = 0; i < radialSegments; i += 1) {
    const next = (i + 1) % radialSegments
    lineIndices.push(i, next)
    lineIndices.push(i + radialSegments, next + radialSegments)
    lineIndices.push(i, i + radialSegments)
  }

  const surfaceGeometry = new THREE.BufferGeometry()
  surfaceGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3),
  )
  surfaceGeometry.setIndex(indices)
  surfaceGeometry.computeVertexNormals()

  const lineGeometry = new THREE.BufferGeometry()
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  lineGeometry.setIndex(lineIndices)

  return {surfaceGeometry, lineGeometry}
}

export const CameraMesh: React.FC<{
  data: Extract<WorldEntity, {type: 'camera'}>
  onSelect: (id?: string) => void
  onFocus: (point: THREE.Vector3, distance?: number) => void
  selected: boolean
  maxFrustumDepth?: number
  showFrustum?: boolean
}> = ({
  data,
  onSelect,
  onFocus,
  selected,
  maxFrustumDepth,
  showFrustum = true,
}) => {
  const {entity, position, dimmed} = data
  const bodyHeight = 0.6
  const standHeight = Math.max(entity.height - bodyHeight, 0.4)
  const color = entity.color
  const opticHeight = standHeight + bodyHeight * 0.5
  const yaw = -degToRad(entity.ptz?.pan ?? entity.direction)
  const groundPlane = React.useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    [],
  )
  const frustum = React.useMemo(() => {
    if (!showFrustum) {
      return null
    }
    return buildFrustumGeometry(entity, opticHeight, maxFrustumDepth)
  }, [entity, maxFrustumDepth, opticHeight, showFrustum])

  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh
        castShadow
        onClick={(event) => {
          event.stopPropagation()
          onSelect(entity.id)
          if (event.detail === 2) {
            onFocus(
              position.clone().setY(opticHeight),
              Math.max(entity.height * 2, 10),
            )
          }
        }}
        position={[0, standHeight / 2, 0]}
        receiveShadow
      >
        <cylinderGeometry args={[0.12, 0.12, standHeight, 12]} />
        <meshStandardMaterial metalness={0.2} color='#94A3B8' roughness={0.8} />
      </mesh>

      <mesh
        castShadow
        onClick={(event) => {
          event.stopPropagation()
          onSelect(entity.id)
          if (event.detail === 2) {
            onFocus(
              position.clone().setY(opticHeight),
              Math.max(entity.depth, 12),
            )
          }
        }}
        position={[0, standHeight + bodyHeight / 2, 0]}
        receiveShadow
      >
        <boxGeometry args={[0.45, bodyHeight, 0.35]} />
        <meshStandardMaterial
          emissive={color}
          emissiveIntensity={0.25}
          metalness={0.15}
          transparent={dimmed}
          color={color}
          opacity={dimmed ? 0.65 : 1}
          roughness={0.6}
        />
      </mesh>

      <mesh
        castShadow
        onClick={(event) => {
          event.stopPropagation()
          onSelect(entity.id)
        }}
        position={[0, standHeight + bodyHeight * 0.8, 0.28]}
      >
        <coneGeometry args={[0.14, 0.25, 16]} />
        <meshStandardMaterial metalness={0.2} color='#334155' roughness={0.5} />
      </mesh>

      {frustum ? (
        <>
          <mesh
            renderOrder={200}
            geometry={frustum.surfaceGeometry}
            onUpdate={(mesh) => mesh.layers.set(DEBUG_LAYER)}
            position={[0, opticHeight, 0]}
          >
            <meshBasicMaterial
              transparent
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
              color={color}
              opacity={dimmed ? 0.05 : 0.12}
              clippingPlanes={[groundPlane]}
            />
          </mesh>
          <lineSegments
            renderOrder={201}
            geometry={frustum.lineGeometry}
            onUpdate={(line) => line.layers.set(DEBUG_LAYER)}
            position={[0, opticHeight, 0]}
          >
            <lineBasicMaterial
              transparent
              linewidth={2}
              depthWrite={false}
              color={color}
              opacity={dimmed ? 0.3 : 0.8}
              clippingPlanes={[groundPlane]}
            />
          </lineSegments>
        </>
      ) : null}

      {selected ? (
        <mesh
          onUpdate={(mesh) => mesh.layers.set(DEBUG_LAYER)}
          position={[0, 0.05, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.35, 0.45, 32]} />
          <meshBasicMaterial transparent color={color} opacity={0.35} />
        </mesh>
      ) : null}
    </group>
  )
}

export const EntitiesMesh: React.FC<{
  entities: WorldEntity[]
  onSelectEntity: (id?: string) => void
  onFocus: (point: THREE.Vector3, distance?: number) => void
  selectedEntityIds: string[]
  maxFrustumDepth?: number
  showCameraFrustums?: boolean
}> = ({
  entities,
  onSelectEntity,
  onFocus,
  selectedEntityIds,
  maxFrustumDepth,
  showCameraFrustums = true,
}) => (
  <>
    {entities.map((entity) => {
      if (entity.type === 'area') {
        return (
          <AreaMesh
            data={entity}
            key={entity.entity.id}
            selected={selectedEntityIds.includes(entity.entity.id)}
            onFocus={onFocus}
            onSelect={onSelectEntity}
          />
        )
      }
      if (entity.type === 'wall') {
        return (
          <WallMesh
            data={entity}
            key={`${entity.entity.id}-${entity.segmentIndex}`}
            selected={selectedEntityIds.includes(entity.entity.id)}
            onFocus={onFocus}
            onSelect={onSelectEntity}
          />
        )
      }
      if (entity.type === 'person') {
        return (
          <PersonMesh
            data={entity}
            key={entity.entity.id}
            selected={selectedEntityIds.includes(entity.entity.id)}
            onFocus={onFocus}
            onSelect={onSelectEntity}
          />
        )
      }
      if (entity.type === 'shape') {
        return (
          <ShapeMesh
            data={entity}
            key={entity.entity.id}
            selected={selectedEntityIds.includes(entity.entity.id)}
            onFocus={onFocus}
            onSelect={onSelectEntity}
          />
        )
      }
      if (entity.type === 'camera') {
        return (
          <CameraMesh
            data={entity}
            key={entity.entity.id}
            maxFrustumDepth={maxFrustumDepth}
            showFrustum={showCameraFrustums}
            selected={selectedEntityIds.includes(entity.entity.id)}
            onFocus={onFocus}
            onSelect={onSelectEntity}
          />
        )
      }
      return null
    })}
  </>
)
