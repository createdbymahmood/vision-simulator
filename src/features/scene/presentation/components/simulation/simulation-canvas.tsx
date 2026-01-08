import React from 'react'
import {Canvas, useFrame, useThree} from '@react-three/fiber'
import {OrbitControls} from '@react-three/drei'
import * as THREE from 'three'
import type {OrbitControls as OrbitControlsImpl} from 'three-stdlib'

import {DEFAULT_PERSON_RADIUS} from '@/features/scene/domain/constants/person-defaults'
import type {
  CameraEntity,
  SceneMode,
  SceneRoot,
} from '@/features/scene/domain/types'

import {
  type WorldEntity,
  closeRingVectors,
  computeSceneOrigin,
  createCoordinateTransformer,
  parseColorAndAlpha,
  transformFeatureCollectionsToThreeJSShapes,
} from './simulation-helpers'

interface SimulationCanvasProps {
  scene: SceneRoot
  sceneMode: SceneMode
  showMapTexture: boolean
  focusAreaId?: string
  onSelectEntity: (id?: string) => void
  selectedEntityIds: string[]
}

const createGridTexture = () => {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return null
  }
  ctx.fillStyle = '#F8FAFC'
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)'
  ctx.lineWidth = 1
  for (let i = 0; i <= size; i += 32) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, size)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(size, i)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(15, 23, 42, 0.18)'
  ctx.lineWidth = 1.5
  for (let i = 0; i <= size; i += 128) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, size)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(size, i)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  return texture
}

const createMapTexture = () => {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return null
  }
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#E0F2FE')
  gradient.addColorStop(1, '#F8FAFC')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)'
  ctx.lineWidth = 2
  for (let i = 0; i <= size; i += 96) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, size)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(size, i)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(32, size * 0.2)
  ctx.bezierCurveTo(
    size * 0.25,
    size * 0.25,
    size * 0.6,
    size * 0.35,
    size,
    size * 0.3,
  )
  ctx.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  return texture
}

const degToRad = (deg: number) => (deg * Math.PI) / 180

const GroundPlane: React.FC<{
  showMapTexture: boolean
  mapTexture: THREE.Texture | null
  gridTexture: THREE.Texture | null
}> = ({showMapTexture, mapTexture, gridTexture}) => {
  const planeSize = 1000
  const mapOffset = -0.004
  const gridOffset = -0.002
  const [mapOpacity, setMapOpacity] = React.useState(showMapTexture ? 1 : 0)
  const [gridOpacity, setGridOpacity] = React.useState(showMapTexture ? 0 : 1)

  React.useEffect(() => {
    const start = performance.now()
    const duration = 400
    const initialMap = mapOpacity
    const initialGrid = gridOpacity
    const targetMap = showMapTexture ? 1 : 0
    const targetGrid = showMapTexture ? 0 : 1

    const step = () => {
      const elapsed = performance.now() - start
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setMapOpacity(initialMap + (targetMap - initialMap) * eased)
      setGridOpacity(initialGrid + (targetGrid - initialGrid) * eased)
      if (t < 1) {
        requestAnimationFrame(step)
      }
    }
    step()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMapTexture])

  React.useEffect(() => {
    if (mapTexture) {
      mapTexture.repeat.set(planeSize / 16, planeSize / 16)
    }
    if (gridTexture) {
      gridTexture.repeat.set(planeSize / 4, planeSize / 4)
    }
  }, [gridTexture, mapTexture, planeSize])

  return (
    <>
      <mesh position={[0, mapOffset, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[planeSize, planeSize]} />
        <meshStandardMaterial
          map={mapTexture ?? undefined}
          color={mapTexture ? undefined : '#E5E7EB'}
          transparent
          opacity={mapOpacity}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <mesh position={[0, gridOffset, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[planeSize, planeSize]} />
        <meshStandardMaterial
          map={gridTexture ?? undefined}
          color={gridTexture ? undefined : '#F8FAFC'}
          transparent
          opacity={gridOpacity}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
    </>
  )
}

const WallMesh: React.FC<{
  data: Extract<WorldEntity, {type: 'wall'}>
  onSelect: (id?: string) => void
  onFocus: (point: THREE.Vector3, distance?: number) => void
  selected: boolean
}> = ({data, onSelect, onFocus, selected: _selected}) => {
  const midpoint = data.start.clone().add(data.end).multiplyScalar(0.5)
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
          transparent={data.dimmed}
          opacity={data.dimmed ? 0.5 : 1}
        />
      </mesh>
    </group>
  )
}

const ShapeMesh: React.FC<{
  data: Extract<WorldEntity, {type: 'shape'}>
  onSelect: (id?: string) => void
  onFocus: (point: THREE.Vector3, distance?: number) => void
  selected: boolean
}> = ({data, onSelect, onFocus, selected: _selected}) => {
  const {entity, points} = data
  if (points.length < 2) {
    return null
  }

  const renderHeight = Math.max(entity.height ?? 0, 0.05)
  const polygonPoints = closeRingVectors(points)
  const bounds = new THREE.Box3().setFromPoints(points)
  const center = bounds
    .getCenter(new THREE.Vector3())
    .setY(renderHeight / 2 + 0.1)
  const size = bounds.getSize(new THREE.Vector3())

  const shapeColor = parseColorAndAlpha(entity.color)
  const commonMaterial = (
    <meshStandardMaterial
      color={shapeColor.color}
      roughness={0.9}
      metalness={0}
      transparent
      opacity={shapeColor.alpha}
      polygonOffset
      polygonOffsetFactor={4}
      polygonOffsetUnits={4}
    />
  )

  if (entity.shapeType === 'line' && points.length >= 2) {
    const start = points[0]
    const end = points[1]
    const length = start.distanceTo(end)
    const thickness = entity.thickness ?? 0.2
    const midpoint = start.clone().add(end).multiplyScalar(0.5)
    const angle = Math.atan2(end.z - start.z, end.x - start.x)
    return (
      <group position={midpoint.clone().setY(midpoint.y + 0.1)} rotation={[0, angle, 0]}>
        <mesh
          castShadow
          receiveShadow
          renderOrder={2}
          onClick={(event) => {
            event.stopPropagation()
            onSelect(entity.id)
            if (event.detail === 2) {
              onFocus(midpoint.clone(), Math.max(length, renderHeight * 2, 10))
            }
          }}
        >
          <boxGeometry args={[length, renderHeight, thickness]} />
          {commonMaterial}
        </mesh>
      </group>
    )
  }

  const shape2d = new THREE.Shape()
  polygonPoints.forEach((pt, index) => {
    if (index === 0) {
      shape2d.moveTo(pt.x, pt.z)
    } else {
      shape2d.lineTo(pt.x, pt.z)
    }
  })
  const geometry = new THREE.ExtrudeGeometry(shape2d, {
    depth: renderHeight,
    bevelEnabled: false,
  })
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, 0.1, 0)

  return (
    <mesh
      geometry={geometry}
      castShadow
      receiveShadow
      renderOrder={data.renderOrder}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(entity.id)
        if (event.detail === 2) {
          onFocus(center.clone(), Math.max(size.x, size.z, entity.height * 2, 10))
        }
      }}
    >
      {commonMaterial}
    </mesh>
  )

  return null
}

const AreaMesh: React.FC<{
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
  const fillColorParsed = parseColorAndAlpha(data.entity.style.fillColor ?? data.entity.color)
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

const PersonMesh: React.FC<{
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
    // near
    0, 1, 2, 0, 2, 3,
    // far
    4, 5, 6, 4, 6, 7,
    // sides
    0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7,
  ]

  const lineIndices = [
    0,
    1,
    1,
    2,
    2,
    3,
    3,
    0, // near
    4,
    5,
    5,
    6,
    6,
    7,
    7,
    4, // far
    0,
    4,
    1,
    5,
    2,
    6,
    3,
    7, // edges
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

const CameraMesh: React.FC<{
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

const Lights: React.FC = () => (
  <>
    <hemisphereLight args={['#cdeaff', '#e2e8f0', 0.35]} />
    <ambientLight intensity={0.25} />
    <directionalLight
      color='#f8fafc'
      intensity={0.9}
      position={[120, 180, 80]}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
    />
  </>
)

interface FocusRequest {
  point: THREE.Vector3
  distance: number
}

const FocusController: React.FC<{
  request: FocusRequest | null
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}> = ({request, controlsRef}) => {
  const {camera} = useThree()
  const focusRef = React.useRef<{
    fromPos: THREE.Vector3
    toPos: THREE.Vector3
    fromTarget: THREE.Vector3
    toTarget: THREE.Vector3
    start: number
  } | null>(null)

  React.useEffect(() => {
    if (!request || !controlsRef.current) {
      return
    }
    const fromPos = camera.position.clone()
    const fromTarget = controlsRef.current.target.clone()
    const offset = new THREE.Vector3(
      request.distance * 0.6,
      request.distance * 0.4,
      request.distance * 0.6,
    )
    const toPos = request.point.clone().add(offset)
    focusRef.current = {
      fromPos,
      toPos,
      fromTarget,
      toTarget: request.point.clone(),
      start: performance.now(),
    }
  }, [camera, controlsRef, request])

  useFrame(() => {
    const controls = controlsRef.current
    if (!controls) {
      return
    }
    if (focusRef.current) {
      const elapsed = performance.now() - focusRef.current.start
      const duration = 800
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      camera.position
        .copy(focusRef.current.fromPos)
        .lerp(focusRef.current.toPos, eased)
      controls.target
        .copy(focusRef.current.fromTarget)
        .lerp(focusRef.current.toTarget, eased)
      controls.update()
      if (t >= 1) {
        focusRef.current = null
      }
    } else {
      controls.update()
    }
  })
  return null
}

const SimulationScene: React.FC<SimulationCanvasProps> = ({
  scene,
  sceneMode: _sceneMode,
  showMapTexture,
  focusAreaId,
  onSelectEntity,
  selectedEntityIds,
}) => {
  const controlsRef = React.useRef<OrbitControlsImpl | null>(null)
  const originPoint = React.useMemo(
    () => computeSceneOrigin(scene),
    [scene],
  )
  const transformer = React.useMemo(
    () => createCoordinateTransformer(originPoint),
    [originPoint],
  )

  const gridTexture = React.useMemo(() => createGridTexture(), [])
  const mapTexture = React.useMemo(() => createMapTexture(), [])

  const entities: WorldEntity[] = React.useMemo(
    () =>
      transformFeatureCollectionsToThreeJSShapes(
        scene,
        transformer,
        focusAreaId,
      ),
    [focusAreaId, scene, transformer],
  )

  const bounds = React.useMemo(() => {
    const points = entities
      .filter((entity) => entity.type === 'area')
      .flatMap(
        (entity) => (entity as Extract<WorldEntity, {type: 'area'}>).points,
      )
    if (!points.length) {
      return null
    }
    const box = new THREE.Box3().setFromPoints(points)
    return box
  }, [entities])

  const [focusRequest, setFocusRequest] = React.useState<FocusRequest | null>(
    null,
  )

  const areaFocus = React.useMemo(() => {
    const targetAreas = entities.filter(
      (entity) =>
        entity.type === 'area' &&
        (!focusAreaId || entity.entity.id === focusAreaId),
    ) as Extract<WorldEntity, {type: 'area'}>[]
    const points =
      targetAreas.length > 0
        ? targetAreas.flatMap((area) => area.points)
        : entities
            .filter((entity) => entity.type === 'area')
            .flatMap(
              (entity) =>
                (entity as Extract<WorldEntity, {type: 'area'}>).points,
            )
    if (!points.length) {
      return null
    }
    const box = new THREE.Box3().setFromPoints(points)
    const center = new THREE.Vector3()
    box.getCenter(center)
    const size = new THREE.Vector3()
    box.getSize(size)
    const distance = Math.max(size.x, size.z, 10) * 1.2
    return {point: center, distance}
  }, [entities, focusAreaId])

  React.useEffect(() => {
    if (areaFocus) {
      setFocusRequest(areaFocus)
    } else if (!focusAreaId) {
      setFocusRequest(null)
    }
  }, [areaFocus, focusAreaId])

  const requestFocus = React.useCallback(
    (point: THREE.Vector3, distance = 10) => {
      setFocusRequest({point, distance})
    },
    [],
  )

  React.useEffect(() => {
    if (!controlsRef.current) {
      return
    }
    const camera = controlsRef.current.object
    const target = new THREE.Vector3()
    if (bounds) {
      bounds.getCenter(target)
      const size = new THREE.Vector3()
      bounds.getSize(size)
      const distance = Math.max(size.x, size.z, 40)
      camera.position.set(
        target.x + distance * 0.8,
        distance * 0.5,
        target.z + distance * 0.8,
      )
      controlsRef.current.target.copy(target)
    } else {
      camera.position.set(40, 30, 40)
      controlsRef.current.target.set(0, 0, 0)
    }
    camera.updateProjectionMatrix()
    controlsRef.current.update()
  }, [bounds])

  return (
    <>
      <color attach='background' args={['#E0F2FE']} />
      <fog attach='fog' args={['#E0F2FE', 150, 1200]} />
      <Lights />
      <GroundPlane
        showMapTexture={showMapTexture}
        gridTexture={gridTexture}
        mapTexture={mapTexture}
      />

      {entities.map((entity) => {
        if (entity.type === 'area') {
          return (
            <AreaMesh
              key={entity.entity.id}
              data={entity}
              onSelect={onSelectEntity}
              onFocus={requestFocus}
              selected={selectedEntityIds.includes(entity.entity.id)}
            />
          )
        }
        if (entity.type === 'wall') {
          return (
            <WallMesh
              key={entity.entity.id}
              data={entity}
              onSelect={onSelectEntity}
              onFocus={requestFocus}
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
              onFocus={requestFocus}
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
              onFocus={requestFocus}
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
              onFocus={requestFocus}
              selected={selectedEntityIds.includes(entity.entity.id)}
            />
          )
        }
        return null
      })}

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={500}
        target={[0, 0, 0]}
      />
      <FocusController request={focusRequest} controlsRef={controlsRef} />
    </>
  )
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = (props) => {
  return (
    <Canvas
      className='h-full w-full'
      shadows
      camera={{fov: 50, position: [40, 30, 40], near: 0.5, far: 1200}}
      gl={{antialias: true, alpha: true, logarithmicDepthBuffer: true}}
      onCreated={({gl}) => {
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.toneMapping = THREE.NoToneMapping
        gl.shadowMap.enabled = true
        gl.shadowMap.type = THREE.PCFSoftShadowMap
      }}
    >
      <SimulationScene {...props} />
    </Canvas>
  )
}
