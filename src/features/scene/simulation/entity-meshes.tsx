import React from 'react'
import * as THREE from 'three'

import type {CameraEntity} from '@/features/scene/types/types'

import {DEFAULT_PERSON_RADIUS} from '@/features/scene/constants/person-defaults'
import {
  getEffectiveHorizontalFov,
  getEffectiveVerticalFov,
} from '@/features/scene/services/camera-optics'

import type {WorldEntity} from './simulation-helpers'

import {ShapeMesh} from './shape-mesh'
import {parseColorAndAlpha} from './simulation-helpers'
import {DEBUG_LAYER} from './simulation-layers'

const WALL_BASE_OPACITY = 1
const MAX_RENDER_FOV_DEG = 150
const MAX_RENDER_VERTICAL_FOV_DEG = 70
const WALL_CORNER_KEY_PRECISION = 1000
const WALL_COLLINEAR_DOT_THRESHOLD = 0.995
const MIN_WALL_CAP_RADIUS = 0.01
const MIN_CAMERA_NEAR_DISTANCE = 0.1
const CAMERA_FRUSTUM_SURFACE_INDICES: number[] = [
  0,
  1,
  2,
  0,
  2,
  3, // near
  4,
  7,
  6,
  4,
  6,
  5, // far
  0,
  4,
  5,
  0,
  5,
  1, // top
  1,
  5,
  6,
  1,
  6,
  2, // right
  2,
  6,
  7,
  2,
  7,
  3, // bottom
  3,
  7,
  4,
  3,
  4,
  0, // left
]
const CAMERA_FRUSTUM_LINE_INDICES: number[] = [
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  0, // near edges
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  4, // far edges
  0,
  4,
  1,
  5,
  2,
  6,
  3,
  7, // side edges
]

const degToRad = (deg: number) => (deg * Math.PI) / 180
type WallWorldEntity = Extract<WorldEntity, {type: 'wall'}>

const getWallMaterialStyle = (color: string, dimmed: boolean) => {
  const parsed = parseColorAndAlpha(color)
  const baseOpacity = dimmed ? WALL_BASE_OPACITY * 0.5 : WALL_BASE_OPACITY
  return {
    color: parsed.color ?? color,
    opacity: baseOpacity * parsed.alpha,
  }
}

interface WallCornerCapData {
  key: string
  position: THREE.Vector3
  radius: number
  height: number
  color: string
  opacity: number
  entityId: string
  focusDistance: number
}

interface WallCornerEntry {
  segment: WallWorldEntity
  point: THREE.Vector3
  otherPoint: THREE.Vector3
}

const getWallCornerKey = (point: THREE.Vector3) => {
  const x = Math.round(point.x * WALL_CORNER_KEY_PRECISION)
  const z = Math.round(point.z * WALL_CORNER_KEY_PRECISION)
  return `${x}:${z}`
}

const hasCornerAngle = (entries: WallCornerEntry[]) => {
  if (entries.length < 2) {
    return false
  }
  const directions = entries
    .map((entry) => {
      const vector = new THREE.Vector2(
        entry.otherPoint.x - entry.point.x,
        entry.otherPoint.z - entry.point.z,
      )
      const length = vector.length()
      if (length <= 1e-6) {
        return null
      }
      return vector.multiplyScalar(1 / length)
    })
    .filter((direction): direction is THREE.Vector2 => Boolean(direction))
  if (directions.length < 2) {
    return false
  }
  for (let index = 0; index < directions.length; index += 1) {
    for (
      let nextIndex = index + 1;
      nextIndex < directions.length;
      nextIndex += 1
    ) {
      const dot = Math.abs(directions[index].dot(directions[nextIndex]))
      if (dot < WALL_COLLINEAR_DOT_THRESHOLD) {
        return true
      }
    }
  }
  return false
}

const buildWallCornerCaps = (walls: WallWorldEntity[]): WallCornerCapData[] => {
  const groups = new Map<string, WallCornerEntry[]>()

  walls.forEach((segment) => {
    const startKey = getWallCornerKey(segment.start)
    const endKey = getWallCornerKey(segment.end)

    const startEntries = groups.get(startKey)
    if (startEntries) {
      startEntries.push({
        segment,
        point: segment.start,
        otherPoint: segment.end,
      })
    } else {
      groups.set(startKey, [
        {
          segment,
          point: segment.start,
          otherPoint: segment.end,
        },
      ])
    }

    const endEntries = groups.get(endKey)
    if (endEntries) {
      endEntries.push({
        segment,
        point: segment.end,
        otherPoint: segment.start,
      })
    } else {
      groups.set(endKey, [
        {
          segment,
          point: segment.end,
          otherPoint: segment.start,
        },
      ])
    }
  })

  const caps: WallCornerCapData[] = []
  groups.forEach((entries, key) => {
    if (!hasCornerAngle(entries)) {
      return
    }
    const point = entries[0]?.point
    if (!point) {
      return
    }
    const thickness = Math.max(
      ...entries.map((entry) => entry.segment.entity.thickness),
    )
    const height = Math.max(
      ...entries.map((entry) => entry.segment.entity.height),
    )
    const primarySegment = entries[0].segment
    const materialStyle = getWallMaterialStyle(
      primarySegment.entity.color,
      primarySegment.dimmed,
    )
    caps.push({
      key,
      position: new THREE.Vector3(point.x, height / 2, point.z),
      radius: Math.max(thickness / 2, MIN_WALL_CAP_RADIUS),
      height,
      color: materialStyle.color,
      opacity: materialStyle.opacity,
      entityId: primarySegment.entity.id,
      focusDistance: Math.max(thickness * 4, 8),
    })
  })

  return caps
}

const isWallEntity = (entity: WorldEntity): entity is WallWorldEntity =>
  entity.type === 'wall'

const getCameraFovAngles = (camera: CameraEntity) => {
  const horizontal = degToRad(
    Math.min(getEffectiveHorizontalFov(camera), MAX_RENDER_FOV_DEG),
  )
  const vertical = degToRad(
    Math.min(getEffectiveVerticalFov(camera), MAX_RENDER_VERTICAL_FOV_DEG),
  )
  return {horizontal, vertical}
}

export const WallMesh: React.FC<{
  data: WallWorldEntity
  onSelect: (id?: string) => void
  onFocus: (point: THREE.Vector3, distance?: number) => void
  selected: boolean
}> = ({data, onSelect, onFocus}) => {
  const midpoint = data.start.clone().add(data.end).multiplyScalar(0.5)
  midpoint.y = data.entity.height / 2
  const angle = Math.atan2(data.start.z - data.end.z, data.end.x - data.start.x)
  const materialStyle = getWallMaterialStyle(data.entity.color, data.dimmed)
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
        <meshBasicMaterial
          transparent
          color={materialStyle.color}
          fog={false}
          opacity={materialStyle.opacity}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

interface WallCornerCapsProps {
  walls: WallWorldEntity[]
  onSelect: (id?: string) => void
  onFocus: (point: THREE.Vector3, distance?: number) => void
}

const WallCornerCaps: React.FC<WallCornerCapsProps> = ({
  walls,
  onSelect,
  onFocus,
}) => {
  const caps = React.useMemo(() => buildWallCornerCaps(walls), [walls])

  return (
    <>
      {caps.map((cap) => (
        <mesh
          key={cap.key}
          castShadow
          onClick={(event) => {
            event.stopPropagation()
            onSelect(cap.entityId)
            if (event.detail === 2) {
              onFocus(cap.position.clone(), cap.focusDistance)
            }
          }}
          position={cap.position}
          receiveShadow
        >
          <cylinderGeometry args={[cap.radius, cap.radius, cap.height, 28]} />
          <meshBasicMaterial
            transparent
            color={cap.color}
            fog={false}
            opacity={cap.opacity}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  )
}

export const AreaMesh: React.FC<{
  data: Extract<WorldEntity, {type: 'area'}>
  onSelect: (id?: string) => void
  onFocus: (point: THREE.Vector3, distance?: number) => void
  selected: boolean
}> = ({data, onSelect, onFocus}) => {
  const extrude = React.useMemo(() => {
    if (data.points.length < 3) {
      return null
    }
    const shape = new THREE.Shape()
    data.points.forEach((point, index) => {
      const projectedY = -point.z
      if (index === 0) {
        shape.moveTo(point.x, projectedY)
      } else {
        shape.lineTo(point.x, projectedY)
      }
    })
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.02,
      bevelEnabled: false,
    })
    geometry.rotateX(-Math.PI / 2)
    return geometry
  }, [data.points])
  React.useEffect(
    () => () => {
      extrude?.dispose()
    },
    [extrude],
  )
  if (!extrude) {
    return null
  }
  const fillColorParsed = parseColorAndAlpha(
    data.entity.style.fillColor ?? data.entity.color,
  )
  const baseOpacity = data.entity.style.fillOpacity ?? 1
  const appliedOpacity = baseOpacity * fillColorParsed.alpha
  const fillColor = fillColorParsed.color
  return (
    <mesh
      renderOrder={20}
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
      position={[0, 0.015, 0]}
      receiveShadow
    >
      <meshBasicMaterial
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        color={fillColor}
        opacity={appliedOpacity}
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
  maxFrustumDepth?: number,
) => {
  const yaw = 0 // yaw comes from parent group rotation
  const tilt = degToRad(camera.ptz?.tilt ?? 0)
  const {horizontal, vertical} = getCameraFovAngles(camera)
  const near = MIN_CAMERA_NEAR_DISTANCE
  const unclampedFar = Math.max(camera.depth, near + 0.1)
  const far = Math.max(
    near + 0.1,
    Math.min(maxFrustumDepth ?? unclampedFar, unclampedFar),
  )
  const halfHorizontal = horizontal / 2
  const halfVertical = vertical / 2

  const rotation = new THREE.Euler(tilt, yaw, 0, 'YXZ')
  const forward = new THREE.Vector3(0, 0, -1).applyEuler(rotation).normalize()
  const right = new THREE.Vector3(1, 0, 0).applyEuler(rotation).normalize()
  const up = new THREE.Vector3(0, 1, 0).applyEuler(rotation).normalize()

  const origin = new THREE.Vector3(0, 0, 0)
  const nearCenter = origin.clone().add(forward.clone().multiplyScalar(near))
  const farCenter = origin.clone().add(forward.clone().multiplyScalar(far))
  const nearHalfWidth = Math.tan(halfHorizontal) * near
  const nearHalfHeight = Math.tan(halfVertical) * near
  const farHalfWidth = Math.tan(halfHorizontal) * far
  const farHalfHeight = Math.tan(halfVertical) * far

  const nearTopLeft = nearCenter
    .clone()
    .add(up.clone().multiplyScalar(nearHalfHeight))
    .add(right.clone().multiplyScalar(-nearHalfWidth))
  const nearTopRight = nearCenter
    .clone()
    .add(up.clone().multiplyScalar(nearHalfHeight))
    .add(right.clone().multiplyScalar(nearHalfWidth))
  const nearBottomRight = nearCenter
    .clone()
    .add(up.clone().multiplyScalar(-nearHalfHeight))
    .add(right.clone().multiplyScalar(nearHalfWidth))
  const nearBottomLeft = nearCenter
    .clone()
    .add(up.clone().multiplyScalar(-nearHalfHeight))
    .add(right.clone().multiplyScalar(-nearHalfWidth))

  const farTopLeft = farCenter
    .clone()
    .add(up.clone().multiplyScalar(farHalfHeight))
    .add(right.clone().multiplyScalar(-farHalfWidth))
  const farTopRight = farCenter
    .clone()
    .add(up.clone().multiplyScalar(farHalfHeight))
    .add(right.clone().multiplyScalar(farHalfWidth))
  const farBottomRight = farCenter
    .clone()
    .add(up.clone().multiplyScalar(-farHalfHeight))
    .add(right.clone().multiplyScalar(farHalfWidth))
  const farBottomLeft = farCenter
    .clone()
    .add(up.clone().multiplyScalar(-farHalfHeight))
    .add(right.clone().multiplyScalar(-farHalfWidth))

  const vertices = [
    nearTopLeft,
    nearTopRight,
    nearBottomRight,
    nearBottomLeft,
    farTopLeft,
    farTopRight,
    farBottomRight,
    farBottomLeft,
  ]
  const positions = new Float32Array(
    vertices.flatMap((vertex) => [vertex.x, vertex.y, vertex.z]),
  )

  const surfaceGeometry = new THREE.BufferGeometry()
  surfaceGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3),
  )
  surfaceGeometry.setIndex(CAMERA_FRUSTUM_SURFACE_INDICES)
  surfaceGeometry.computeVertexNormals()

  const lineGeometry = new THREE.BufferGeometry()
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  lineGeometry.setIndex(CAMERA_FRUSTUM_LINE_INDICES)

  return {surfaceGeometry, lineGeometry}
}

interface CameraBodyModelProps {
  standHeight: number
  mountPlateHeight: number
  cameraBodyLength: number
  cameraBodyCenterY: number
  cameraBodyCenterZ: number
  lensHoodLength: number
  lensHoodCenterZ: number
  lensBezelLength: number
  lensBezelCenterZ: number
  opticForwardOffset: number
  color: string
  dimmed: boolean
  selected: boolean
}

const CameraBodyModel: React.FC<CameraBodyModelProps> = ({
  standHeight,
  mountPlateHeight,
  cameraBodyLength,
  cameraBodyCenterY,
  cameraBodyCenterZ,
  lensHoodLength,
  lensHoodCenterZ,
  lensBezelLength,
  lensBezelCenterZ,
  opticForwardOffset,
  color,
  dimmed,
  selected,
}) => (
  <>
    <mesh
      castShadow
      onUpdate={(mesh) => mesh.layers.set(DEBUG_LAYER)}
      position={[0, standHeight / 2, 0]}
      receiveShadow
    >
      <cylinderGeometry args={[0.08, 0.08, standHeight, 16]} />
      <meshStandardMaterial metalness={0.18} color='#94A3B8' roughness={0.72} />
    </mesh>

    <mesh
      castShadow
      onUpdate={(mesh) => mesh.layers.set(DEBUG_LAYER)}
      position={[0, standHeight + mountPlateHeight / 2, 0]}
      receiveShadow
    >
      <cylinderGeometry args={[0.2, 0.2, mountPlateHeight, 24]} />
      <meshStandardMaterial metalness={0.28} color='#E2E8F0' roughness={0.45} />
    </mesh>

    <mesh
      castShadow
      onUpdate={(mesh) => mesh.layers.set(DEBUG_LAYER)}
      position={[0, standHeight - 0.02, -0.16]}
      receiveShadow
    >
      <boxGeometry args={[0.1, 0.08, 0.3]} />
      <meshStandardMaterial metalness={0.2} color='#CBD5E1' roughness={0.58} />
    </mesh>

    <mesh
      castShadow
      onUpdate={(mesh) => mesh.layers.set(DEBUG_LAYER)}
      position={[0, standHeight - 0.03, -0.27]}
      receiveShadow
    >
      <sphereGeometry args={[0.085, 24, 16]} />
      <meshStandardMaterial metalness={0.35} color='#64748B' roughness={0.35} />
    </mesh>

    <mesh
      castShadow
      onUpdate={(mesh) => mesh.layers.set(DEBUG_LAYER)}
      position={[0, cameraBodyCenterY, cameraBodyCenterZ]}
      receiveShadow
      rotation={[Math.PI / 2, 0, 0]}
    >
      <cylinderGeometry args={[0.12, 0.135, cameraBodyLength, 24]} />
      <meshStandardMaterial
        metalness={0.25}
        transparent={dimmed}
        color='#F1F5F9'
        opacity={dimmed ? 0.58 : 1}
        roughness={0.42}
      />
    </mesh>

    <mesh
      castShadow
      onUpdate={(mesh) => mesh.layers.set(DEBUG_LAYER)}
      position={[0, cameraBodyCenterY, cameraBodyCenterZ + 0.05]}
      receiveShadow
      rotation={[Math.PI / 2, 0, 0]}
    >
      <cylinderGeometry args={[0.138, 0.138, 0.06, 24]} />
      <meshStandardMaterial
        emissive={color}
        emissiveIntensity={selected ? 0.55 : 0.25}
        metalness={0.4}
        transparent={dimmed}
        color={color}
        opacity={dimmed ? 0.55 : 1}
        roughness={0.42}
      />
    </mesh>

    <mesh
      castShadow
      onUpdate={(mesh) => mesh.layers.set(DEBUG_LAYER)}
      position={[0, cameraBodyCenterY, lensHoodCenterZ]}
      receiveShadow
      rotation={[Math.PI / 2, 0, 0]}
    >
      <cylinderGeometry args={[0.17, 0.14, lensHoodLength, 24]} />
      <meshStandardMaterial metalness={0.35} color='#334155' roughness={0.3} />
    </mesh>

    <mesh
      castShadow
      onUpdate={(mesh) => mesh.layers.set(DEBUG_LAYER)}
      position={[0, cameraBodyCenterY, lensBezelCenterZ]}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <cylinderGeometry args={[0.082, 0.086, lensBezelLength, 24]} />
      <meshStandardMaterial metalness={0.38} color='#0F172A' roughness={0.25} />
    </mesh>

    <mesh
      onUpdate={(mesh) => mesh.layers.set(DEBUG_LAYER)}
      position={[0, cameraBodyCenterY, opticForwardOffset]}
    >
      <sphereGeometry args={[0.055, 24, 16]} />
      <meshStandardMaterial
        emissive={selected ? color : '#0B1120'}
        emissiveIntensity={selected ? 0.35 : 0.08}
        metalness={0.05}
        color='#020617'
        roughness={0.15}
      />
    </mesh>
  </>
)

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
  const standHeight = Math.max(entity.height - 0.36, 0.45)
  const mountPlateHeight = 0.06
  const cameraBodyLength = 0.62
  const cameraBodyCenterY = standHeight - 0.03
  const cameraBodyCenterZ = -0.44
  const lensHoodLength = 0.16
  const lensHoodCenterZ =
    cameraBodyCenterZ - cameraBodyLength / 2 - lensHoodLength / 2 + 0.03
  const lensBezelLength = 0.06
  const lensBezelCenterZ =
    lensHoodCenterZ - lensHoodLength / 2 - lensBezelLength / 2 + 0.015
  const opticHeight = cameraBodyCenterY
  const opticForwardOffset = lensBezelCenterZ - lensBezelLength / 2 - 0.02
  const color = entity.color
  const yaw = -degToRad(entity.ptz.pan)
  const focusDistance = Math.max(entity.depth, entity.height * 2, 12)
  const opticFocusPoint = React.useMemo(
    () =>
      position
        .clone()
        .add(
          new THREE.Vector3(0, opticHeight, opticForwardOffset).applyAxisAngle(
            new THREE.Vector3(0, 1, 0),
            yaw,
          ),
        ),
    [opticForwardOffset, opticHeight, position, yaw],
  )
  const groundPlane = React.useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    [],
  )
  const frustum = React.useMemo(() => {
    if (!showFrustum) {
      return null
    }
    return buildFrustumGeometry(entity, maxFrustumDepth)
  }, [entity, maxFrustumDepth, showFrustum])

  return (
    <group
      onClick={(event) => {
        event.stopPropagation()
        onSelect(entity.id)
        if (event.detail === 2) {
          onFocus(opticFocusPoint.clone(), focusDistance)
        }
      }}
      position={position}
      rotation={[0, yaw, 0]}
    >
      <CameraBodyModel
        dimmed={dimmed}
        lensBezelCenterZ={lensBezelCenterZ}
        lensBezelLength={lensBezelLength}
        selected={selected}
        standHeight={standHeight}
        cameraBodyCenterY={cameraBodyCenterY}
        cameraBodyCenterZ={cameraBodyCenterZ}
        cameraBodyLength={cameraBodyLength}
        color={color}
        lensHoodCenterZ={lensHoodCenterZ}
        lensHoodLength={lensHoodLength}
        mountPlateHeight={mountPlateHeight}
        opticForwardOffset={opticForwardOffset}
      />

      {frustum ? (
        <>
          <mesh
            renderOrder={200}
            geometry={frustum.surfaceGeometry}
            onUpdate={(mesh) => mesh.layers.set(DEBUG_LAYER)}
            position={[0, opticHeight, opticForwardOffset]}
          >
            <meshBasicMaterial
              transparent
              blending={THREE.AdditiveBlending}
              clippingPlanes={[groundPlane]}
              depthWrite={false}
              side={THREE.DoubleSide}
              color={color}
              opacity={dimmed ? 0.05 : 0.12}
            />
          </mesh>
          <lineSegments
            renderOrder={201}
            geometry={frustum.lineGeometry}
            onUpdate={(line) => line.layers.set(DEBUG_LAYER)}
            position={[0, opticHeight, opticForwardOffset]}
          >
            <lineBasicMaterial
              transparent
              linewidth={2}
              clippingPlanes={[groundPlane]}
              depthWrite={false}
              color={color}
              opacity={dimmed ? 0.3 : 0.8}
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
}) => {
  const wallEntities = React.useMemo(
    () => entities.filter(isWallEntity),
    [entities],
  )

  return (
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
              selected={selectedEntityIds.includes(entity.entity.id)}
              onFocus={onFocus}
              onSelect={onSelectEntity}
              showFrustum={showCameraFrustums}
            />
          )
        }
        return null
      })}
      <WallCornerCaps
        walls={wallEntities}
        onFocus={onFocus}
        onSelect={onSelectEntity}
      />
    </>
  )
}
