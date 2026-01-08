import React from 'react'
import * as THREE from 'three'

import {DEFAULT_PERSON_RADIUS} from '@/features/scene/domain/constants/person-defaults'
import type {CameraEntity} from '@/features/scene/domain/types'

import {parseColorAndAlpha} from './simulation-helpers'
import type {WorldEntity} from './simulation-helpers'
import {ShapeMesh} from './shape-mesh'

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
        receiveShadow
        onClick={(event) => {
          event.stopPropagation()
          onSelect(data.entity.id)
          if (event.detail === 2) {
            onFocus(midpoint.clone(), Math.max(data.length, 8))
          }
        }}
      >
        <boxGeometry
          args={[data.length, data.entity.height, data.entity.thickness]}
        />
        <meshStandardMaterial
          color={data.entity.color}
          roughness={0.9}
          metalness={0}
          transparent
          opacity={data.dimmed ? WALL_BASE_OPACITY * 0.5 : WALL_BASE_OPACITY}
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
      geometry={extrude}
      position={[0, 0.01, 0]}
      castShadow
      receiveShadow
      renderOrder={0}
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
    >
      <meshBasicMaterial
        color={fillColor}
        transparent
        opacity={appliedOpacity}
        side={THREE.DoubleSide}
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
        receiveShadow
        onClick={(event) => {
          event.stopPropagation()
          onSelect(data.entity.id)
          if (event.detail === 2) {
            onFocus(data.position.clone(), Math.max(data.entity.height * 2, 8))
          }
        }}
      >
        <capsuleGeometry args={[radius, bodyHeight, 8, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={selected ? '#F7DC6F' : '#000000'}
          emissiveIntensity={selected ? 0.4 : 0}
          transparent={data.dimmed}
          opacity={data.dimmed ? 0.5 : 1}
        />
      </mesh>
    </group>
  )
}

const buildFrustumGeometry = (
  camera: CameraEntity,
  origin: THREE.Vector3,
  panOverride?: number,
) => {
  const yaw = panOverride ?? degToRad(camera.ptz?.pan ?? camera.direction)
  const tilt = degToRad(camera.ptz?.tilt ?? 0)
  const fov = camera.fov / Math.max(camera.ptz?.zoom ?? 1, 0.0001)
  const near = Math.max(camera.nearClipping, 0.1)
  const far = Math.max(camera.depth, near + 0.1)
  const halfFov = degToRad(fov) / 2

  const rotation = new THREE.Euler(-tilt, yaw, 0, 'YXZ')
  const forward = new THREE.Vector3(0, 0, -1).applyEuler(rotation).normalize()
  const right = new THREE.Vector3(1, 0, 0).applyEuler(rotation).normalize()
  const up = new THREE.Vector3(0, 1, 0).applyEuler(rotation).normalize()

  const nearCenter = origin.clone().add(forward.clone().multiplyScalar(near))
  const farCenter = origin.clone().add(forward.clone().multiplyScalar(far))
  const nearSize = Math.tan(halfFov) * near
  const farSize = Math.tan(halfFov) * far

  const buildCorners = (center: THREE.Vector3, size: number) => [
    center
      .clone()
      .add(up.clone().multiplyScalar(size))
      .sub(right.clone().multiplyScalar(size)),
    center
      .clone()
      .add(up.clone().multiplyScalar(size))
      .add(right.clone().multiplyScalar(size)),
    center
      .clone()
      .sub(up.clone().multiplyScalar(size))
      .add(right.clone().multiplyScalar(size)),
    center
      .clone()
      .sub(up.clone().multiplyScalar(size))
      .sub(right.clone().multiplyScalar(size)),
  ]

  const nearCorners = buildCorners(nearCenter, nearSize)
  const farCorners = buildCorners(farCenter, farSize)
  const vertices = [...nearCorners, ...farCorners]
  const positions = new Float32Array(vertices.flatMap((v) => [v.x, v.y, v.z]))

  const indices = [
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2,
    3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7,
  ]

  const lineIndices = [
    0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7,
  ]

  const surfaceGeometry = new THREE.BufferGeometry()
  surfaceGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3),
  )
  surfaceGeometry.setIndex(indices)

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
}> = ({data, onSelect, onFocus, selected}) => {
  const {entity, position, dimmed} = data
  const bodyHeight = 0.6
  const standHeight = Math.max(entity.height - bodyHeight, 0.4)
  const color = entity.color
  const opticHeight = standHeight + bodyHeight * 0.5
  const frustum = React.useMemo(
    () =>
      buildFrustumGeometry(
        entity,
        new THREE.Vector3(position.x, position.y + opticHeight, position.z),
        0,
      ),
    [entity, opticHeight, position.x, position.y, position.z],
  )

  return (
    <group
      position={position}
      rotation={[0, degToRad(entity.ptz?.pan ?? entity.direction), 0]}
    >
      <mesh
        castShadow
        receiveShadow
        position={[0, standHeight / 2, 0]}
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
      >
        <cylinderGeometry args={[0.12, 0.12, standHeight, 12]} />
        <meshStandardMaterial color='#94A3B8' roughness={0.8} metalness={0.2} />
      </mesh>

      <mesh
        position={[0, standHeight + bodyHeight / 2, 0]}
        castShadow
        receiveShadow
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
      >
        <boxGeometry args={[0.45, bodyHeight, 0.35]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.25}
          roughness={0.6}
          metalness={0.15}
          transparent={dimmed}
          opacity={dimmed ? 0.65 : 1}
        />
      </mesh>

      <mesh
        position={[0, standHeight + bodyHeight * 0.8, 0.28]}
        castShadow
        onClick={(event) => {
          event.stopPropagation()
          onSelect(entity.id)
        }}
      >
        <coneGeometry args={[0.14, 0.25, 16]} />
        <meshStandardMaterial color='#334155' roughness={0.5} metalness={0.2} />
      </mesh>

      <mesh
        geometry={frustum.surfaceGeometry}
        position={[0, standHeight + bodyHeight * 0.5, 0]}
      >
        <meshBasicMaterial
          color={color}
          transparent
          opacity={dimmed ? 0.05 : 0.12}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <lineSegments
        geometry={frustum.lineGeometry}
        position={[0, standHeight + bodyHeight * 0.5, 0]}
      >
        <lineBasicMaterial
          color={color}
          linewidth={2}
          transparent
          opacity={dimmed ? 0.3 : 0.8}
        />
      </lineSegments>

      {selected ? (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.45, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.35} />
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
}> = ({entities, onSelectEntity, onFocus, selectedEntityIds}) => (
  <>
    {entities.map((entity) => {
      if (entity.type === 'area') {
        return (
          <AreaMesh
            key={entity.entity.id}
            data={entity}
            onSelect={onSelectEntity}
            onFocus={onFocus}
            selected={selectedEntityIds.includes(entity.entity.id)}
          />
        )
      }
      if (entity.type === 'wall') {
        return (
          <WallMesh
            key={`${entity.entity.id}-${entity.segmentIndex}`}
            data={entity}
            onSelect={onSelectEntity}
            onFocus={onFocus}
            selected={selectedEntityIds.includes(entity.entity.id)}
          />
        )
      }
      if (entity.type === 'person') {
        return (
          <PersonMesh
            key={entity.entity.id}
            data={entity}
            onSelect={onSelectEntity}
            onFocus={onFocus}
            selected={selectedEntityIds.includes(entity.entity.id)}
          />
        )
      }
      if (entity.type === 'shape') {
        return (
          <ShapeMesh
            key={entity.entity.id}
            data={entity}
            onSelect={onSelectEntity}
            onFocus={onFocus}
            selected={selectedEntityIds.includes(entity.entity.id)}
          />
        )
      }
      if (entity.type === 'camera') {
        return (
          <CameraMesh
            key={entity.entity.id}
            data={entity}
            onSelect={onSelectEntity}
            onFocus={onFocus}
            selected={selectedEntityIds.includes(entity.entity.id)}
          />
        )
      }
      return null
    })}
  </>
)
