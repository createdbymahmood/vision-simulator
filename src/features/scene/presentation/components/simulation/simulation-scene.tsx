import type {OrbitControls as OrbitControlsImpl} from 'three-stdlib'

import {OrbitControls, PerspectiveCamera, View} from '@react-three/drei'
import {useFrame, useThree} from '@react-three/fiber'
import React from 'react'
import * as THREE from 'three'
import {useCallbackRef} from '@radix-ui/react-use-callback-ref'

import type {SceneMode, SceneRoot} from '@/features/scene/domain/types'

import type {WorldEntity} from './simulation-helpers'

import {computeBounds} from '../map-view/selection-geometry'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'
import {EntitiesMesh} from './entity-meshes'
import {CameraCollisionSurfaces} from './camera-collision-surfaces'
import {CameraFovFootprints} from './camera-fov-footprints'
import {GroundPlane} from './ground-plane'
import {PersonTrail} from './person-trail'
import {getCameraOpticHeight} from './camera-collision-utils'
import {
  buildObstacleSegmentsByArea,
  computeCameraVisionState,
} from './camera-vision'
import {useSimulatedPeople} from './use-simulated-people'
import {
  computeSceneOrigin,
  createCoordinateTransformer,
  transformFeatureCollectionsToThreeJSShapes,
} from './simulation-helpers'
import {createGridTexture, createMapTexture} from './simulation-textures'

interface FocusRequest {
  point: THREE.Vector3
  distance: number
}

const degToRad = (deg: number) => (deg * Math.PI) / 180

export interface SimulationSceneProps {
  scene: SceneRoot
  sceneMode: SceneMode
  showMapTexture: boolean
  focusAreaId?: string
  onSelectEntity: (id?: string) => void
  selectedEntityIds: string[]
  cameraFeedTargets?: CameraFeedTarget[]
}

export interface CameraFeedTarget {
  id: string
  ref: React.RefObject<HTMLDivElement>
}

const Lights: React.FC = () => (
  <>
    <hemisphereLight args={['#cdeaff', '#e2e8f0', 0.35]} />
    <ambientLight intensity={0.25} />
    <directionalLight
      intensity={0.9}
      castShadow
      color='#f8fafc'
      position={[120, 180, 80]}
      shadow-mapSize-height={2048}
      shadow-mapSize-width={2048}
    />
  </>
)

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
      const eased = 1 - (1 - t) ** 3
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

export const SimulationScene: React.FC<SimulationSceneProps> = ({
  scene,
  sceneMode: _sceneMode,
  showMapTexture,
  focusAreaId,
  onSelectEntity,
  selectedEntityIds,
  cameraFeedTargets,
}) => {
  const setVisionState = useUiStore((state) => state.setVisionState)
  const controlsRef = React.useRef<OrbitControlsImpl | null>(null)
  const originPoint = React.useMemo(() => computeSceneOrigin(scene), [scene])
  const transformer = React.useMemo(
    () => createCoordinateTransformer(originPoint),
    [originPoint],
  )

  const gridTexture = React.useMemo(() => createGridTexture(), [])
  const fallbackMapTexture = React.useMemo(() => createMapTexture(), [])
  const [staticMapTexture, setStaticMapTexture] =
    React.useState<THREE.Texture | null>(null)
  const [isStaticMapReady, setIsStaticMapReady] = React.useState(false)

  const geoPoints = React.useMemo(() => {
    const points: [number, number][] = []
    scene.areas.forEach((area) => points.push(...area.geometry.coordinates))
    scene.shapes.forEach((shape) => points.push(...shape.geometry))
    scene.walls.forEach((wall) => points.push(...wall.points))
    scene.people.forEach((person) => points.push([person.x, person.y]))
    scene.cameras.forEach((camera) => points.push([camera.x, camera.y]))
    return points
  }, [scene])

  const geoBounds = React.useMemo(() => computeBounds(geoPoints), [geoPoints])

  const mapPlaneSize = React.useMemo(() => {
    if (!geoBounds) {
      return {width: 800, height: 800}
    }
    const minFlat = transformer.toFlat([geoBounds.minLng, geoBounds.minLat])
    const maxXFlat = transformer.toFlat([geoBounds.maxLng, geoBounds.minLat])
    const maxZFlat = transformer.toFlat([geoBounds.minLng, geoBounds.maxLat])
    const width = Math.abs(maxXFlat.x - minFlat.x)
    const height = Math.abs(maxZFlat.z - minFlat.z)
    const paddingMultiplier = 1
    const paddingAbsolute = 0
    return {
      width: Math.max(width * paddingMultiplier, width + paddingAbsolute, 200),
      height: Math.max(
        height * paddingMultiplier,
        height + paddingAbsolute,
        200,
      ),
    }
  }, [geoBounds, transformer])

  const gridPlaneSize = React.useMemo(() => {
    const base = mapPlaneSize
    const multiplier = 8
    return {
      width: Math.max(base.width * multiplier, 3200),
      height: Math.max(base.height * multiplier, 3200),
    }
  }, [mapPlaneSize])

  React.useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!showMapTexture || !geoBounds || !token) {
      setStaticMapTexture(null)
      setIsStaticMapReady(false)
      return
    }
    const maxSize = 1280
    const planeAspect = mapPlaneSize.width / mapPlaneSize.height || 1
    let reqWidth = maxSize
    let reqHeight = Math.max(1, Math.round(reqWidth / planeAspect))
    if (reqHeight > maxSize) {
      reqHeight = maxSize
      reqWidth = Math.max(1, Math.round(reqHeight * planeAspect))
    }

    const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/[${geoBounds.minLng},${geoBounds.minLat},${geoBounds.maxLng},${geoBounds.maxLat}]/${reqWidth}x${reqHeight}@2x?attribution=false&logo=false&access_token=${token}`
    let canceled = false
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    loader.load(
      url,
      (texture) => {
        if (canceled) return
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = 8
        texture.flipY = true
        texture.needsUpdate = true
        setStaticMapTexture(texture)
        setIsStaticMapReady(true)
      },
      undefined,
      () => {
        if (!canceled) {
          setStaticMapTexture(null)
          setIsStaticMapReady(false)
        }
      },
    )
    return () => {
      canceled = true
    }
  }, [geoBounds, mapPlaneSize.height, mapPlaneSize.width, showMapTexture])

  const entities: WorldEntity[] = React.useMemo(
    () =>
      transformFeatureCollectionsToThreeJSShapes(
        scene,
        transformer,
        focusAreaId,
      ),
    [focusAreaId, scene, transformer],
  )
  const simulatedPeoplePositions = useSimulatedPeople({scene, transformer})
  const obstaclesByArea = React.useMemo(
    () => buildObstacleSegmentsByArea(scene, transformer),
    [scene, transformer],
  )
  const lastVisionTick = React.useRef(0)
  const handleFeedSelect = useCallbackRef(() => undefined)
  const handleFeedFocus = useCallbackRef(() => undefined)

  const renderedEntities = React.useMemo(() => {
    if (simulatedPeoplePositions.size === 0) {
      return entities
    }
    return entities.map((entity) => {
      if (entity.type !== 'person') {
        return entity
      }
      const override = simulatedPeoplePositions.get(entity.entity.id)
      if (!override) {
        return entity
      }
      return {...entity, position: override.clone()}
    })
  }, [entities, simulatedPeoplePositions])

  const selectedPersonId = React.useMemo(
    () => selectedEntityIds.find((id) => id.startsWith('person-')),
    [selectedEntityIds],
  )

  const collisionCameras = React.useMemo(() => scene.cameras, [scene.cameras])
  const camerasById = React.useMemo(
    () => new Map(scene.cameras.map((camera) => [camera.id, camera])),
    [scene.cameras],
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
    return new THREE.Box3().setFromPoints(points)
  }, [entities])

  const maxFrustumDepth = React.useMemo(() => {
    if (!bounds) {
      return undefined
    }
    const size = new THREE.Vector3()
    bounds.getSize(size)
    return Math.max(size.x, size.z)
  }, [bounds])

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

  useFrame(({clock}) => {
    if (clock.elapsedTime - lastVisionTick.current < 1 / 30) {
      return
    }
    lastVisionTick.current = clock.elapsedTime
    setVisionState(
      computeCameraVisionState({
        scene,
        transformer,
        simulatedPeoplePositions,
        obstaclesByArea,
      }),
    )
  })

  return (
    <>
      <color args={['#E0F2FE']} attach='background' />
      <fog args={['#E0F2FE', 150, 1200]} attach='fog' />
      <Lights />
      <GroundPlane
        gridPlaneSize={gridPlaneSize}
        gridTexture={gridTexture}
        isStaticMap={Boolean(staticMapTexture && isStaticMapReady)}
        mapPlaneSize={mapPlaneSize}
        mapTexture={staticMapTexture ?? fallbackMapTexture}
        showMapTexture={showMapTexture}
      />

      <EntitiesMesh
        entities={renderedEntities}
        maxFrustumDepth={maxFrustumDepth}
        selectedEntityIds={selectedEntityIds}
        onFocus={requestFocus}
        onSelectEntity={onSelectEntity}
      />
      <PersonTrail
        selectedPersonId={selectedPersonId}
        positions={simulatedPeoplePositions}
      />
      {collisionCameras.length > 0 ? (
        <>
          <CameraFovFootprints
            cameras={collisionCameras}
            scene={scene}
            transformer={transformer}
          />
          <CameraCollisionSurfaces
            cameras={collisionCameras}
            entities={entities}
          />
        </>
      ) : null}

      {cameraFeedTargets?.map((target, index) => {
        const camera = camerasById.get(target.id)
        if (!camera) {
          return null
        }
        const basePosition = transformer.toVector3([camera.x, camera.y], 0)
        const opticHeight = getCameraOpticHeight(camera)
        const fov = camera.fov / Math.max(camera.ptz?.zoom ?? 1, 0.0001)
        const near = Math.max(camera.nearClipping ?? 0.1, 0.1)
        const far = Math.max(camera.depth, near + 0.1)
        const yaw = -degToRad(camera.ptz?.pan ?? camera.direction)
        const tilt = degToRad(camera.ptz?.tilt ?? 0)

        return (
          <View key={target.id} track={target.ref} index={20 + index}>
            <PerspectiveCamera
              makeDefault
              position={[basePosition.x, opticHeight, basePosition.z]}
              rotation={[tilt, yaw, 0]}
              fov={fov}
              near={near}
              far={far}
            />
            <color args={['#111827']} attach='background' />
            <Lights />
            <GroundPlane
              gridPlaneSize={gridPlaneSize}
              gridTexture={gridTexture}
              isStaticMap={Boolean(staticMapTexture && isStaticMapReady)}
              mapPlaneSize={mapPlaneSize}
              mapTexture={staticMapTexture ?? fallbackMapTexture}
              showMapTexture={showMapTexture}
            />
            <EntitiesMesh
              entities={renderedEntities}
              maxFrustumDepth={maxFrustumDepth}
              selectedEntityIds={selectedEntityIds}
              onFocus={handleFeedFocus}
              onSelectEntity={handleFeedSelect}
              showCameraFrustums={false}
            />
          </View>
        )
      })}

      <OrbitControls
        enableDamping
        maxDistance={500}
        minDistance={5}
        ref={controlsRef}
        target={[0, 0, 0]}
        dampingFactor={0.08}
      />
      <FocusController request={focusRequest} controlsRef={controlsRef} />
    </>
  )
}
