import type * as THREE from 'three'

import React from 'react'

import type {CameraEntity, SceneRoot} from '@/features/scene/domain/types'

import type {CoordinateTransformer} from './simulation-helpers'

import {detectionColors} from './real-radar/real-radar-detection-marker-utils'
import {useLiveRadarDetections} from './real-radar/use-live-radar-state'

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

const normalizeClassName = (value?: string) =>
  (value ?? 'unknown').toLowerCase()

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const getCameraByIncomingId = (cameras: CameraEntity[]) =>
  cameras.reduce<Record<string, CameraEntity>>((acc, camera) => {
    if (camera.id) {
      acc[camera.id] = camera
    }
    if (camera.sourceDeviceId) {
      acc[camera.sourceDeviceId] = camera
    }
    return acc
  }, {})

const getStableYaw = (id: string) => {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 33 + id.charCodeAt(index)) % 360
  }
  return (Math.abs(hash) * Math.PI) / 180
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
  <group position={[0, 0.26, 0]}>
    <mesh
      castShadow
      position={[-0.36, 0, 0]}
      receiveShadow
      rotation={[Math.PI / 2, 0, 0]}
    >
      <torusGeometry args={[0.23, 0.03, 12, 28]} />
      <meshStandardMaterial color='#0f172a' roughness={0.8} />
    </mesh>
    <mesh
      castShadow
      position={[0.36, 0, 0]}
      receiveShadow
      rotation={[Math.PI / 2, 0, 0]}
    >
      <torusGeometry args={[0.23, 0.03, 12, 28]} />
      <meshStandardMaterial color='#0f172a' roughness={0.8} />
    </mesh>
    <mesh
      castShadow
      position={[0, 0.08, 0]}
      receiveShadow
      rotation={[0, 0, Math.PI / 8]}
    >
      <cylinderGeometry args={[0.02, 0.02, 0.75, 12]} />
      <meshStandardMaterial color={color} />
    </mesh>
    <mesh
      castShadow
      position={[0.1, 0.2, 0]}
      receiveShadow
      rotation={[0, 0, -Math.PI / 4]}
    >
      <cylinderGeometry args={[0.02, 0.02, 0.45, 12]} />
      <meshStandardMaterial color={color} />
    </mesh>
    <mesh castShadow position={[0.28, 0.24, 0]} receiveShadow>
      <boxGeometry args={[0.22, 0.03, 0.06]} />
      <meshStandardMaterial color='#334155' />
    </mesh>
  </group>
)

const MotorcycleModel: React.FC<DetectionModelProps> = ({color}) => (
  <group position={[0, 0.28, 0]}>
    <mesh
      castShadow
      position={[-0.35, 0, 0]}
      receiveShadow
      rotation={[Math.PI / 2, 0, 0]}
    >
      <torusGeometry args={[0.24, 0.045, 12, 30]} />
      <meshStandardMaterial color='#020617' roughness={0.75} />
    </mesh>
    <mesh
      castShadow
      position={[0.35, 0, 0]}
      receiveShadow
      rotation={[Math.PI / 2, 0, 0]}
    >
      <torusGeometry args={[0.24, 0.045, 12, 30]} />
      <meshStandardMaterial color='#020617' roughness={0.75} />
    </mesh>
    <mesh castShadow position={[0, 0.2, 0]} receiveShadow>
      <boxGeometry args={[0.62, 0.2, 0.3]} />
      <meshStandardMaterial metalness={0.2} color={color} roughness={0.45} />
    </mesh>
    <mesh castShadow position={[0.08, 0.33, 0]} receiveShadow>
      <boxGeometry args={[0.28, 0.08, 0.22]} />
      <meshStandardMaterial color='#111827' />
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

const DetectionShape: React.FC<{className: string; color: string}> = ({
  className,
  color,
}) => {
  const Shape = detectionShapeMap[className] ?? UnknownModel
  return <Shape color={color} />
}

export const LiveRadarDetectionsMesh: React.FC<
  LiveRadarDetectionsMeshProps
> = ({scene, focusAreaId, transformer}) => {
  const detectionsById = useLiveRadarDetections()

  const cameraByIncomingId = React.useMemo(
    () => getCameraByIncomingId(scene.cameras),
    [scene.cameras],
  )

  const renderItems = React.useMemo(() => {
    return Object.values(detectionsById).flatMap((detection) => {
      if (!Number.isFinite(detection.lat) || !Number.isFinite(detection.lon)) {
        return []
      }

      const sourceCamera = cameraByIncomingId[detection.cameraId]
      if (focusAreaId) {
        if (!sourceCamera) {
          return []
        }
        if (sourceCamera.areaId !== focusAreaId) {
          return []
        }
      }

      const className = normalizeClassName(detection.className)
      const color = detectionColors[className] ?? '#f97316'
      const confidence = clamp01(detection.confidence ?? 0.6)
      const position = transformer.toVector3([detection.lon, detection.lat], 0)

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
  }, [cameraByIncomingId, detectionsById, focusAreaId, transformer])

  return (
    <group>
      {renderItems.map((item) => {
        const confidenceScale = 0.85 + item.confidence * 0.35
        const yaw = getStableYaw(item.id)

        return (
          <group
            key={item.id}
            scale={[confidenceScale, confidenceScale, confidenceScale]}
            position={[item.position.x, item.position.y, item.position.z]}
            rotation={[0, yaw, 0]}
          >
            <DetectionShape className={item.className} color={item.color} />
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
