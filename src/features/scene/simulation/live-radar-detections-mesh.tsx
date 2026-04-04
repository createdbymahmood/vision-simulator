import React from 'react'
import * as THREE from 'three'

import type {CameraEntity, SceneRoot} from '@/features/scene/types/types'

import type {CoordinateTransformer} from './simulation-helpers'

import {detectionColors} from './real-radar/real-radar-detection-marker-utils'
import {
  useLiveRadarCameraStates,
  useLiveRadarDetections,
} from './real-radar/use-live-radar-state'

interface LiveRadarDetectionsMeshProps {
  scene: SceneRoot
  focusAreaId?: string
  transformer: CoordinateTransformer
}

interface DetectionModelProps {
  color: string
}

interface DetectionRenderItem {
  id: string
  className: string
  confidence: number
  color: string
  position: THREE.Vector3
}

interface CameraPositionState {
  camera_lat: number
  camera_lon: number
}

interface WorldBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

interface FlatTubeProps {
  color: string
  end: [number, number]
  metalness?: number
  radius?: number
  roughness?: number
  start: [number, number]
  z?: number
}

const normalizeClassName = (value?: string) =>
  (value ?? 'unknown').toLowerCase()

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const normalizeIdentifier = (value?: string) =>
  (value ?? '').toLowerCase().replace(/[^0-9a-z]/g, '')

const getRealCameras = (cameras: CameraEntity[]) =>
  cameras.filter((camera) => camera.sourceDeviceKind === 'real')

interface CameraLookup {
  exactById: Record<string, CameraEntity>
  normalizedById: Record<string, CameraEntity>
}

const addCameraLookupValue = (
  lookup: CameraLookup,
  camera: CameraEntity,
  value?: string,
) => {
  if (!value) {
    return
  }

  lookup.exactById[value] = camera

  const normalized = normalizeIdentifier(value)
  if (normalized) {
    lookup.normalizedById[normalized] = camera
  }
}

const buildCameraLookup = (cameras: CameraEntity[]): CameraLookup => {
  const lookup: CameraLookup = {
    exactById: {},
    normalizedById: {},
  }

  cameras.forEach((camera) => {
    addCameraLookupValue(lookup, camera, camera.id)
    addCameraLookupValue(lookup, camera, camera.sourceDeviceId)
    addCameraLookupValue(lookup, camera, camera.sourceDeviceName)
    addCameraLookupValue(lookup, camera, camera.name)
  })

  return lookup
}

const getScopedGeoPoints = (scene: SceneRoot, focusAreaId?: string) => {
  const isVisibleArea = (areaId?: string) =>
    !focusAreaId || areaId === focusAreaId
  const points: [number, number][] = []

  scene.areas.forEach((area) => {
    if (isVisibleArea(area.id)) {
      points.push(...area.geometry.coordinates)
    }
  })
  scene.shapes.forEach((shape) => {
    if (isVisibleArea(shape.areaId)) {
      points.push(...shape.geometry)
    }
  })
  scene.walls.forEach((wall) => {
    if (isVisibleArea(wall.areaId)) {
      points.push(...wall.points)
    }
  })
  scene.cameras.forEach((camera) => {
    if (isVisibleArea(camera.areaId)) {
      points.push([camera.x, camera.y])
    }
  })
  scene.people.forEach((person) => {
    if (isVisibleArea(person.areaId)) {
      points.push([person.x, person.y])
    }
  })

  return points
}

const buildWorldBounds = (
  scene: SceneRoot,
  transformer: CoordinateTransformer,
  focusAreaId?: string,
) => {
  const points = getScopedGeoPoints(scene, focusAreaId)
  if (!points.length) {
    return null
  }

  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minZ = Number.POSITIVE_INFINITY
  let maxZ = Number.NEGATIVE_INFINITY

  points.forEach((point) => {
    const worldPoint = transformer.toVector3(point, 0)
    minX = Math.min(minX, worldPoint.x)
    maxX = Math.max(maxX, worldPoint.x)
    minZ = Math.min(minZ, worldPoint.z)
    maxZ = Math.max(maxZ, worldPoint.z)
  })

  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(minZ) ||
    !Number.isFinite(maxZ)
  ) {
    return null
  }

  return {
    minX,
    maxX,
    minZ,
    maxZ,
  } satisfies WorldBounds
}

const getStableYaw = (id: string) => {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 33 + id.charCodeAt(index)) % 360
  }
  return (Math.abs(hash) * Math.PI) / 180
}

const getCameraStateByExactKey = ({
  cameraStatesById,
  key,
}: {
  cameraStatesById: Record<string, CameraPositionState>
  key?: string
}) => {
  if (!key) {
    return undefined
  }

  return cameraStatesById[key]
}

const getCameraStateByNormalizedKey = ({
  cameraStateByNormalizedId,
  key,
}: {
  cameraStateByNormalizedId: Record<string, CameraPositionState>
  key?: string
}) => {
  if (!key) {
    return undefined
  }

  const normalizedKey = normalizeIdentifier(key)
  if (!normalizedKey) {
    return undefined
  }

  return cameraStateByNormalizedId[normalizedKey]
}

const getDetectionCameraState = ({
  cameraStatesById,
  cameraStateByNormalizedId,
  detectionCameraId,
  sourceCamera,
}: {
  cameraStatesById: Record<string, CameraPositionState>
  cameraStateByNormalizedId: Record<string, CameraPositionState>
  detectionCameraId: string
  sourceCamera?: CameraEntity
}) => {
  const exactKeys = [
    detectionCameraId,
    sourceCamera?.sourceDeviceId,
    sourceCamera?.id,
  ]
  for (const key of exactKeys) {
    const cameraState = getCameraStateByExactKey({cameraStatesById, key})
    if (cameraState) {
      return cameraState
    }
  }

  const normalizedKeys = [
    detectionCameraId,
    sourceCamera?.sourceDeviceId,
    sourceCamera?.id,
    sourceCamera?.sourceDeviceName,
  ]
  for (const key of normalizedKeys) {
    const cameraState = getCameraStateByNormalizedKey({
      cameraStateByNormalizedId,
      key,
    })
    if (cameraState) {
      return cameraState
    }
  }

  return undefined
}

const resolveSceneCamera = ({
  cameraLookup,
  detectionCameraId,
  sourceCameraState,
  transformer,
  worldPositionByCameraId,
}: {
  cameraLookup: CameraLookup
  detectionCameraId: string
  sourceCameraState?: CameraPositionState
  transformer: CoordinateTransformer
  worldPositionByCameraId: Map<string, THREE.Vector3>
}) => {
  const direct = cameraLookup.exactById[detectionCameraId]
  if (direct) {
    return direct
  }

  const normalizedDetectionCameraId = normalizeIdentifier(detectionCameraId)
  if (!normalizedDetectionCameraId && !sourceCameraState) {
    return undefined
  }

  const byNormalized = normalizedDetectionCameraId
    ? cameraLookup.normalizedById[normalizedDetectionCameraId]
    : undefined
  if (byNormalized) {
    return byNormalized
  }

  if (
    !sourceCameraState ||
    !Number.isFinite(sourceCameraState.camera_lat) ||
    !Number.isFinite(sourceCameraState.camera_lon)
  ) {
    return undefined
  }

  const liveCameraWorldPosition = transformer.toVector3(
    [sourceCameraState.camera_lon, sourceCameraState.camera_lat],
    0,
  )
  let nearestCamera: CameraEntity | undefined
  let nearestDistanceSq = Number.POSITIVE_INFINITY

  worldPositionByCameraId.forEach((cameraWorldPosition, cameraId) => {
    const distanceSq = cameraWorldPosition.distanceToSquared(
      liveCameraWorldPosition,
    )
    if (distanceSq < nearestDistanceSq) {
      nearestDistanceSq = distanceSq
      nearestCamera = cameraLookup.exactById[cameraId]
    }
  })

  return nearestCamera
}

const isPointInsideBounds = (
  point: THREE.Vector3,
  bounds: WorldBounds | null,
) => {
  if (!bounds) {
    return true
  }

  return (
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.z >= bounds.minZ &&
    point.z <= bounds.maxZ
  )
}

const resolveDetectionPosition = ({
  detectionLat,
  detectionLon,
  sourceCamera,
  sourceCameraState,
  transformer,
}: {
  detectionLat: number
  detectionLon: number
  sourceCamera?: CameraEntity
  sourceCameraState?: CameraPositionState
  transformer: CoordinateTransformer
}) => {
  const fallbackPosition = transformer.toVector3(
    [detectionLon, detectionLat],
    0,
  )

  if (
    !sourceCamera ||
    !sourceCameraState ||
    !Number.isFinite(sourceCameraState.camera_lat) ||
    !Number.isFinite(sourceCameraState.camera_lon)
  ) {
    return fallbackPosition
  }

  const liveCameraPosition = transformer.toVector3(
    [sourceCameraState.camera_lon, sourceCameraState.camera_lat],
    0,
  )
  const sceneCameraPosition = transformer.toVector3(
    [sourceCamera.x, sourceCamera.y],
    0,
  )
  const offsetFromLiveCamera = fallbackPosition.clone().sub(liveCameraPosition)

  return sceneCameraPosition.add(offsetFromLiveCamera)
}

const FlatTube: React.FC<FlatTubeProps> = ({
  color,
  end,
  metalness = 0.08,
  radius = 0.012,
  roughness = 0.55,
  start,
  z = 0,
}) => {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  const length = Math.hypot(dx, dy)
  const centerX = (start[0] + end[0]) / 2
  const centerY = (start[1] + end[1]) / 2
  const rotationZ = Math.atan2(dy, dx) - Math.PI / 2

  return (
    <mesh
      castShadow
      position={[centerX, centerY, z]}
      receiveShadow
      rotation={[0, 0, rotationZ]}
    >
      <cylinderGeometry args={[radius, radius, length, 12]} />
      <meshStandardMaterial
        metalness={metalness}
        color={color}
        roughness={roughness}
      />
    </mesh>
  )
}

const HelmetModel: React.FC<DetectionModelProps> = ({color}) => (
  <group position={[0, 0.09, 0]}>
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[0.08, 20, 12]} />
      <meshStandardMaterial metalness={0.35} color={color} roughness={0.45} />
    </mesh>
    <mesh castShadow position={[0, -0.05, 0]} receiveShadow>
      <cylinderGeometry args={[0.1, 0.1, 0.02, 24]} />
      <meshStandardMaterial metalness={0.1} color='#111827' roughness={0.75} />
    </mesh>
  </group>
)

const CigaretteModel: React.FC<DetectionModelProps> = () => (
  <group position={[0, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
    <mesh castShadow receiveShadow>
      <cylinderGeometry args={[0.008, 0.008, 0.18, 14]} />
      <meshStandardMaterial color='#f8fafc' roughness={0.85} />
    </mesh>
    <mesh castShadow position={[0, 0.092, 0]} receiveShadow>
      <sphereGeometry args={[0.012, 10, 8]} />
      <meshStandardMaterial
        emissive='#fb923c'
        emissiveIntensity={0.6}
        color='#f97316'
      />
    </mesh>
  </group>
)

const HatModel: React.FC<DetectionModelProps> = ({color}) => (
  <group position={[0, 0.1, 0]}>
    <mesh castShadow receiveShadow>
      <cylinderGeometry args={[0.085, 0.085, 0.12, 24]} />
      <meshStandardMaterial color={color} roughness={0.55} />
    </mesh>
    <mesh castShadow position={[0, -0.065, 0]} receiveShadow>
      <cylinderGeometry args={[0.13, 0.13, 0.015, 24]} />
      <meshStandardMaterial color='#0f172a' roughness={0.8} />
    </mesh>
  </group>
)

const FacemaskModel: React.FC<DetectionModelProps> = ({color}) => (
  <group position={[0, 0.05, 0]}>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[0.16, 0.08, 0.04]} />
      <meshStandardMaterial color={color} roughness={0.65} />
    </mesh>
    <mesh castShadow position={[0.09, 0, 0]} receiveShadow>
      <cylinderGeometry args={[0.005, 0.005, 0.08, 8]} />
      <meshStandardMaterial color='#94a3b8' />
    </mesh>
    <mesh castShadow position={[-0.09, 0, 0]} receiveShadow>
      <cylinderGeometry args={[0.005, 0.005, 0.08, 8]} />
      <meshStandardMaterial color='#94a3b8' />
    </mesh>
  </group>
)

const FireSmokeModel: React.FC<DetectionModelProps> = () => (
  <group position={[0, 0.1, 0]}>
    <mesh castShadow position={[0, 0.02, 0]} receiveShadow>
      <sphereGeometry args={[0.06, 16, 12]} />
      <meshStandardMaterial
        emissive='#f97316'
        emissiveIntensity={0.45}
        color='#fb923c'
      />
    </mesh>
    <mesh renderOrder={2} position={[0.03, 0.12, 0]}>
      <sphereGeometry args={[0.08, 14, 10]} />
      <meshStandardMaterial
        transparent
        color='#64748b'
        opacity={0.55}
        roughness={0.95}
      />
    </mesh>
    <mesh renderOrder={2} position={[-0.04, 0.18, 0.02]}>
      <sphereGeometry args={[0.07, 14, 10]} />
      <meshStandardMaterial
        transparent
        color='#94a3b8'
        opacity={0.42}
        roughness={0.95}
      />
    </mesh>
  </group>
)

const GlovesModel: React.FC<DetectionModelProps> = ({color}) => (
  <group position={[0, 0.03, 0]}>
    <mesh castShadow position={[-0.04, 0, 0]} receiveShadow>
      <boxGeometry args={[0.06, 0.03, 0.07]} />
      <meshStandardMaterial color={color} roughness={0.65} />
    </mesh>
    <mesh castShadow position={[0.04, 0, 0]} receiveShadow>
      <boxGeometry args={[0.06, 0.03, 0.07]} />
      <meshStandardMaterial color={color} roughness={0.65} />
    </mesh>
  </group>
)

const VestModel: React.FC<DetectionModelProps> = ({color}) => (
  <group position={[0, 0.12, 0]}>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[0.16, 0.22, 0.09]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
    <mesh castShadow position={[0, 0.02, 0.046]} receiveShadow>
      <boxGeometry args={[0.11, 0.02, 0.005]} />
      <meshStandardMaterial color='#f8fafc' roughness={0.2} />
    </mesh>
    <mesh castShadow position={[0, -0.05, 0.046]} receiveShadow>
      <boxGeometry args={[0.11, 0.02, 0.005]} />
      <meshStandardMaterial color='#f8fafc' roughness={0.2} />
    </mesh>
  </group>
)

const BootsModel: React.FC<DetectionModelProps> = ({color}) => (
  <group position={[0, 0.03, 0]}>
    <mesh castShadow position={[-0.045, 0, 0]} receiveShadow>
      <boxGeometry args={[0.07, 0.05, 0.12]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
    <mesh castShadow position={[0.045, 0, 0]} receiveShadow>
      <boxGeometry args={[0.07, 0.05, 0.12]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  </group>
)

const GogglesModel: React.FC<DetectionModelProps> = ({color}) => (
  <group position={[0, 0.05, 0]}>
    <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.06, 0.012, 10, 26]} />
      <meshStandardMaterial metalness={0.25} color={color} roughness={0.35} />
    </mesh>
    <mesh castShadow position={[0, 0, -0.03]} receiveShadow>
      <boxGeometry args={[0.16, 0.02, 0.01]} />
      <meshStandardMaterial color='#334155' roughness={0.8} />
    </mesh>
  </group>
)

const PersonModel: React.FC<DetectionModelProps> = ({color}) => (
  <group position={[0, 0.95, 0]}>
    <mesh castShadow receiveShadow>
      <capsuleGeometry args={[0.18, 1, 10, 16]} />
      <meshStandardMaterial color={color} roughness={0.55} />
    </mesh>
    <mesh castShadow position={[0, 0.75, 0]} receiveShadow>
      <sphereGeometry args={[0.14, 18, 14]} />
      <meshStandardMaterial color='#f8d6b3' roughness={0.6} />
    </mesh>
  </group>
)

const BicycleModel: React.FC<DetectionModelProps> = ({color}) => (
  <group position={[0, 0.24, 0]}>
    {[-0.42, 0.42].map((wheelX) => (
      <group key={`bicycle-wheel-${wheelX}`} position={[wheelX, 0, 0]}>
        <mesh castShadow receiveShadow>
          <torusGeometry args={[0.21, 0.022, 14, 34]} />
          <meshStandardMaterial color='#020617' roughness={0.86} />
        </mesh>
        <mesh castShadow receiveShadow>
          <torusGeometry args={[0.175, 0.005, 10, 28]} />
          <meshStandardMaterial color='#94a3b8' roughness={0.3} />
        </mesh>
        <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.08, 12]} />
          <meshStandardMaterial metalness={0.35} color='#64748b' />
        </mesh>
      </group>
    ))}

    {[-0.42, 0.42].map((wheelX) => (
      <React.Fragment key={`bicycle-spokes-${wheelX}`}>
        <FlatTube
          end={[wheelX, 0.15]}
          radius={0.003}
          start={[wheelX, -0.15]}
          color='#94a3b8'
          roughness={0.28}
        />
        <FlatTube
          end={[wheelX + 0.11, 0.11]}
          radius={0.003}
          start={[wheelX - 0.11, -0.11]}
          color='#94a3b8'
          roughness={0.28}
        />
        <FlatTube
          end={[wheelX + 0.11, -0.11]}
          radius={0.003}
          start={[wheelX - 0.11, 0.11]}
          color='#94a3b8'
          roughness={0.28}
        />
      </React.Fragment>
    ))}

    <FlatTube
      end={[-0.05, 0.09]}
      radius={0.015}
      start={[-0.42, 0.02]}
      color={color}
    />
    <FlatTube
      end={[-0.19, 0.25]}
      radius={0.013}
      start={[-0.42, 0.02]}
      color={color}
    />
    <FlatTube
      end={[-0.05, 0.09]}
      radius={0.013}
      start={[-0.19, 0.25]}
      color={color}
    />
    <FlatTube
      end={[0.21, 0.24]}
      radius={0.015}
      start={[-0.05, 0.09]}
      color={color}
    />
    <FlatTube
      end={[0.21, 0.24]}
      radius={0.013}
      start={[-0.19, 0.25]}
      color={color}
    />
    <FlatTube
      end={[0.42, 0.02]}
      radius={0.013}
      start={[0.21, 0.24]}
      color={color}
    />
    <FlatTube
      end={[0.28, 0.35]}
      radius={0.01}
      start={[0.21, 0.24]}
      color={color}
    />
    <FlatTube
      end={[-0.19, 0.31]}
      radius={0.01}
      start={[-0.19, 0.25]}
      color='#334155'
    />

    <mesh castShadow position={[0.31, 0.35, 0]} receiveShadow>
      <boxGeometry args={[0.18, 0.02, 0.045]} />
      <meshStandardMaterial color='#1e293b' roughness={0.72} />
    </mesh>
    <mesh castShadow position={[-0.19, 0.33, 0]} receiveShadow>
      <boxGeometry args={[0.16, 0.028, 0.06]} />
      <meshStandardMaterial color='#334155' roughness={0.7} />
    </mesh>

    <mesh
      castShadow
      position={[-0.05, 0.09, 0]}
      receiveShadow
      rotation={[Math.PI / 2, 0, 0]}
    >
      <torusGeometry args={[0.05, 0.007, 8, 24]} />
      <meshStandardMaterial metalness={0.35} color='#64748b' roughness={0.35} />
    </mesh>
    <FlatTube
      end={[0.02, 0.12]}
      radius={0.008}
      start={[-0.05, 0.09]}
      color='#475569'
    />
    <FlatTube
      end={[-0.12, 0.05]}
      radius={0.008}
      start={[-0.05, 0.09]}
      color='#475569'
    />
    <mesh castShadow position={[0.045, 0.135, 0]} receiveShadow>
      <boxGeometry args={[0.055, 0.015, 0.04]} />
      <meshStandardMaterial color='#1e293b' roughness={0.74} />
    </mesh>
    <mesh castShadow position={[-0.14, 0.04, 0]} receiveShadow>
      <boxGeometry args={[0.055, 0.015, 0.04]} />
      <meshStandardMaterial color='#1e293b' roughness={0.74} />
    </mesh>
  </group>
)

const MotorcycleModel: React.FC<DetectionModelProps> = ({color}) => (
  <group position={[0, 0.24, 0]}>
    {[-0.36, 0.38].map((wheelX) => (
      <group key={`motor-wheel-${wheelX}`} position={[wheelX, 0, 0]}>
        <mesh castShadow receiveShadow>
          <torusGeometry args={[0.22, 0.04, 14, 32]} />
          <meshStandardMaterial color='#020617' roughness={0.84} />
        </mesh>
        <mesh castShadow receiveShadow>
          <torusGeometry args={[0.16, 0.02, 10, 26]} />
          <meshStandardMaterial
            metalness={0.32}
            color='#94a3b8'
            roughness={0.35}
          />
        </mesh>
        <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.11, 12]} />
          <meshStandardMaterial metalness={0.4} color='#64748b' />
        </mesh>
      </group>
    ))}

    <FlatTube
      end={[-0.02, 0.11]}
      radius={0.018}
      start={[-0.36, 0.02]}
      color='#374151'
    />
    <FlatTube
      end={[0.18, 0.24]}
      radius={0.018}
      start={[-0.02, 0.11]}
      color='#374151'
    />
    <FlatTube
      end={[-0.13, 0.23]}
      radius={0.017}
      start={[-0.02, 0.11]}
      color='#334155'
    />
    <FlatTube
      end={[0.18, 0.24]}
      radius={0.017}
      start={[-0.13, 0.23]}
      color='#334155'
    />
    <FlatTube
      end={[0.38, 0.02]}
      radius={0.014}
      start={[0.18, 0.24]}
      z={-0.02}
      color='#475569'
    />
    <FlatTube
      end={[0.38, 0.02]}
      radius={0.014}
      start={[0.18, 0.24]}
      z={0.02}
      color='#475569'
    />
    <FlatTube
      end={[0.27, 0.34]}
      radius={0.01}
      start={[0.18, 0.24]}
      color='#1f2937'
    />

    <mesh
      castShadow
      position={[0.05, 0.27, 0]}
      receiveShadow
      rotation={[0, 0, Math.PI / 2]}
    >
      <capsuleGeometry args={[0.07, 0.14, 8, 12]} />
      <meshStandardMaterial metalness={0.28} color={color} roughness={0.42} />
    </mesh>
    <mesh castShadow position={[-0.14, 0.28, 0]} receiveShadow>
      <boxGeometry args={[0.25, 0.06, 0.17]} />
      <meshStandardMaterial color='#111827' roughness={0.6} />
    </mesh>
    <mesh castShadow position={[-0.03, 0.13, 0]} receiveShadow>
      <boxGeometry args={[0.2, 0.13, 0.16]} />
      <meshStandardMaterial metalness={0.22} color='#4b5563' roughness={0.52} />
    </mesh>
    <mesh
      castShadow
      position={[0.05, 0.04, -0.09]}
      receiveShadow
      rotation={[0, 0, Math.PI / 2]}
    >
      <cylinderGeometry args={[0.018, 0.018, 0.48, 14]} />
      <meshStandardMaterial metalness={0.5} color='#9ca3af' roughness={0.25} />
    </mesh>
    <mesh castShadow position={[0.31, 0.34, 0]} receiveShadow>
      <boxGeometry args={[0.16, 0.02, 0.06]} />
      <meshStandardMaterial color='#1f2937' roughness={0.72} />
    </mesh>
  </group>
)

const CarModel: React.FC<DetectionModelProps> = ({color}) => (
  <group position={[0, 0.3, 0]}>
    <mesh castShadow position={[0, 0.12, 0]} receiveShadow>
      <boxGeometry args={[1.2, 0.28, 0.56]} />
      <meshStandardMaterial metalness={0.3} color={color} roughness={0.42} />
    </mesh>
    <mesh castShadow position={[0.08, 0.31, 0]} receiveShadow>
      <boxGeometry args={[0.65, 0.22, 0.5]} />
      <meshStandardMaterial metalness={0.15} color='#cbd5e1' roughness={0.25} />
    </mesh>
    {[
      [-0.4, 0, 0.24],
      [0.4, 0, 0.24],
      [-0.4, 0, -0.24],
      [0.4, 0, -0.24],
    ].map((wheel) => (
      <mesh
        key={wheel.join(':')}
        castShadow
        position={wheel as [number, number, number]}
        receiveShadow
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.12, 0.12, 0.12, 16]} />
        <meshStandardMaterial color='#0f172a' roughness={0.85} />
      </mesh>
    ))}
  </group>
)

const BusModel: React.FC<DetectionModelProps> = ({color}) => (
  <group position={[0, 0.38, 0]}>
    <mesh castShadow position={[0, 0.2, 0]} receiveShadow>
      <boxGeometry args={[1.9, 0.5, 0.62]} />
      <meshStandardMaterial metalness={0.22} color={color} roughness={0.4} />
    </mesh>
    <mesh castShadow position={[0, 0.38, 0]} receiveShadow>
      <boxGeometry args={[1.75, 0.18, 0.56]} />
      <meshStandardMaterial color='#dbeafe' roughness={0.2} />
    </mesh>
    {[
      [-0.7, 0, 0.28],
      [0, 0, 0.28],
      [0.7, 0, 0.28],
      [-0.7, 0, -0.28],
      [0, 0, -0.28],
      [0.7, 0, -0.28],
    ].map((wheel) => (
      <mesh
        key={wheel.join(':')}
        castShadow
        position={wheel as [number, number, number]}
        receiveShadow
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.14, 0.14, 0.14, 16]} />
        <meshStandardMaterial color='#111827' roughness={0.85} />
      </mesh>
    ))}
  </group>
)

const TruckModel: React.FC<DetectionModelProps> = ({color}) => (
  <group position={[0, 0.42, 0]}>
    <mesh castShadow position={[-0.42, 0.2, 0]} receiveShadow>
      <boxGeometry args={[0.7, 0.45, 0.58]} />
      <meshStandardMaterial metalness={0.2} color={color} roughness={0.45} />
    </mesh>
    <mesh castShadow position={[0.38, 0.25, 0]} receiveShadow>
      <boxGeometry args={[1.15, 0.55, 0.66]} />
      <meshStandardMaterial metalness={0.15} color='#64748b' roughness={0.65} />
    </mesh>
    {[
      [-0.58, 0, 0.28],
      [-0.18, 0, 0.28],
      [0.28, 0, 0.28],
      [0.68, 0, 0.28],
      [-0.58, 0, -0.28],
      [-0.18, 0, -0.28],
      [0.28, 0, -0.28],
      [0.68, 0, -0.28],
    ].map((wheel) => (
      <mesh
        key={wheel.join(':')}
        castShadow
        position={wheel as [number, number, number]}
        receiveShadow
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.14, 0.14, 0.13, 16]} />
        <meshStandardMaterial color='#020617' roughness={0.88} />
      </mesh>
    ))}
  </group>
)

const BackpackModel: React.FC<DetectionModelProps> = ({color}) => (
  <group position={[0, 0.12, 0]}>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[0.16, 0.22, 0.1]} />
      <meshStandardMaterial color={color} roughness={0.65} />
    </mesh>
    <mesh castShadow position={[0.05, 0, -0.056]} receiveShadow>
      <boxGeometry args={[0.02, 0.2, 0.01]} />
      <meshStandardMaterial color='#1e293b' />
    </mesh>
    <mesh castShadow position={[-0.05, 0, -0.056]} receiveShadow>
      <boxGeometry args={[0.02, 0.2, 0.01]} />
      <meshStandardMaterial color='#1e293b' />
    </mesh>
  </group>
)

const CellphoneModel: React.FC<DetectionModelProps> = () => (
  <group position={[0, 0.03, 0]}>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[0.06, 0.12, 0.008]} />
      <meshStandardMaterial metalness={0.2} color='#111827' roughness={0.4} />
    </mesh>
    <mesh renderOrder={2} position={[0, 0, 0.005]}>
      <boxGeometry args={[0.05, 0.1, 0.001]} />
      <meshStandardMaterial
        emissive='#38bdf8'
        emissiveIntensity={0.18}
        color='#0f172a'
      />
    </mesh>
  </group>
)

const UnknownModel: React.FC<DetectionModelProps> = ({color}) => (
  <mesh castShadow position={[0, 0.06, 0]} receiveShadow>
    <boxGeometry args={[0.12, 0.12, 0.12]} />
    <meshStandardMaterial color={color} />
  </mesh>
)

const detectionShapeMap: Record<string, React.FC<DetectionModelProps>> = {
  helmet: HelmetModel,
  cigarette: CigaretteModel,
  hat: HatModel,
  facemask: FacemaskModel,
  firesmoke: FireSmokeModel,
  gloves: GlovesModel,
  vest: VestModel,
  boots: BootsModel,
  goggles: GogglesModel,
  person: PersonModel,
  bicycle: BicycleModel,
  motorcycle: MotorcycleModel,
  car: CarModel,
  bus: BusModel,
  truck: TruckModel,
  backpack: BackpackModel,
  cellphone: CellphoneModel,
}

const LIVE_DETECTION_BASE_SCALE = 4.2
const LIVE_DETECTION_CONFIDENCE_SCALE = 1.8
const LIVE_DETECTION_CLASS_SCALE: Partial<Record<string, number>> = {
  car: 1,
  person: 0.75,
}

const DetectionShape: React.FC<{className: string; color: string}> = ({
  className,
  color,
}) => {
  const Shape = detectionShapeMap[className] ?? UnknownModel
  return <Shape color={color} />
}

const GroundAlignedDetectionShape: React.FC<{
  className: string
  color: string
}> = ({className, color}) => {
  const contentRef = React.useRef<THREE.Group | null>(null)
  const [groundOffset, setGroundOffset] = React.useState(0)

  React.useLayoutEffect(() => {
    const group = contentRef.current
    if (!group) {
      return
    }

    group.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(group)
    if (!Number.isFinite(box.min.y)) {
      return
    }

    const nextOffset = -box.min.y
    setGroundOffset((previous) =>
      Math.abs(previous - nextOffset) > 1e-4 ? nextOffset : previous,
    )
  }, [className, color])

  return (
    <group position={[0, groundOffset, 0]}>
      <group ref={contentRef}>
        <DetectionShape className={className} color={color} />
      </group>
    </group>
  )
}

export const LiveRadarDetectionsMesh: React.FC<
  LiveRadarDetectionsMeshProps
> = ({scene, focusAreaId, transformer}) => {
  const detectionsById = useLiveRadarDetections()
  const cameraStatesById = useLiveRadarCameraStates()

  const realCameras = React.useMemo(
    () => getRealCameras(scene.cameras),
    [scene.cameras],
  )

  const cameraLookup = React.useMemo(
    () => buildCameraLookup(realCameras),
    [realCameras],
  )

  const worldPositionByCameraId = React.useMemo(
    () =>
      new Map(
        realCameras.map((camera) => [
          camera.id,
          transformer.toVector3([camera.x, camera.y], 0),
        ]),
      ),
    [realCameras, transformer],
  )

  const cameraStateByNormalizedId = React.useMemo(
    () =>
      Object.entries(cameraStatesById).reduce<
        Record<string, CameraPositionState>
      >((acc, [cameraId, cameraState]) => {
        const normalizedId = normalizeIdentifier(cameraId)
        if (normalizedId) {
          acc[normalizedId] = cameraState
        }
        return acc
      }, {}),
    [cameraStatesById],
  )

  const worldBounds = React.useMemo(
    () => buildWorldBounds(scene, transformer, focusAreaId),
    [focusAreaId, scene, transformer],
  )

  const renderItems = React.useMemo(() => {
    return Object.values(detectionsById).flatMap((detection) => {
      if (!Number.isFinite(detection.lat) || !Number.isFinite(detection.lon)) {
        return []
      }

      const sourceCameraState = getDetectionCameraState({
        cameraStatesById,
        cameraStateByNormalizedId,
        detectionCameraId: detection.cameraId,
      })
      const sourceCamera = resolveSceneCamera({
        cameraLookup,
        detectionCameraId: detection.cameraId,
        sourceCameraState,
        transformer,
        worldPositionByCameraId,
      })
      if (
        focusAreaId &&
        sourceCamera?.areaId &&
        sourceCamera.areaId !== focusAreaId
      ) {
        return []
      }

      const className = normalizeClassName(detection.className)
      const color = detectionColors[className] ?? '#f97316'
      const confidence = clamp01(detection.confidence ?? 0.6)
      const resolvedCameraState = getDetectionCameraState({
        cameraStatesById,
        cameraStateByNormalizedId,
        detectionCameraId: detection.cameraId,
        sourceCamera,
      })
      const position = resolveDetectionPosition({
        detectionLat: detection.lat,
        detectionLon: detection.lon,
        sourceCamera,
        sourceCameraState: resolvedCameraState,
        transformer,
      })
      if (!isPointInsideBounds(position, worldBounds)) {
        return []
      }

      return [
        {
          id: detection.id,
          className,
          confidence,
          color,
          position,
        } satisfies DetectionRenderItem,
      ]
    })
  }, [
    cameraLookup,
    cameraStateByNormalizedId,
    cameraStatesById,
    detectionsById,
    focusAreaId,
    worldBounds,
    transformer,
    worldPositionByCameraId,
  ])

  return (
    <group>
      {renderItems.map((item) => {
        const confidenceScale =
          LIVE_DETECTION_BASE_SCALE +
          item.confidence * LIVE_DETECTION_CONFIDENCE_SCALE
        const classScale = LIVE_DETECTION_CLASS_SCALE[item.className] ?? 1
        const finalScale = confidenceScale * classScale
        const yaw = getStableYaw(item.id)

        return (
          <group
            key={item.id}
            scale={[finalScale, finalScale, finalScale]}
            position={[item.position.x, item.position.y, item.position.z]}
            rotation={[0, yaw, 0]}
          >
            <GroundAlignedDetectionShape
              className={item.className}
              color={item.color}
            />
            <mesh
              position={[0, 0.002, 0]}
              receiveShadow
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[0.2, 0.28, 28]} />
              <meshBasicMaterial
                transparent
                color={item.color}
                opacity={0.22}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
