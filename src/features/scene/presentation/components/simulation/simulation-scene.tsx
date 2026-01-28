import type {OrbitControls as OrbitControlsImpl} from 'three-stdlib'

import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import {OrbitControls} from '@react-three/drei'
import {useFrame, useThree} from '@react-three/fiber'
import React from 'react'
import * as THREE from 'three'

import type {SceneMode, SceneRoot} from '@/features/scene/domain/types'

import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'

import type {CameraFeedTarget} from './camera-feed-types'
import type {SimulationCaptureApi} from './simulation-capture'
import type {WorldEntity} from './simulation-helpers'

import {computeBounds} from '../map-view/selection-geometry'
import {CameraCollisionSurfaces} from './camera-collision-surfaces'
import {CameraFovFootprints} from './camera-fov-footprints'
import {
  buildObstacleSegmentsByArea,
  computeCameraVisionState,
} from './camera-vision'
import {EntitiesMesh} from './entity-meshes'
import {GroundPlane} from './ground-plane'
import {PersonTrail} from './person-trail'
import {
  computeSceneOrigin,
  createCoordinateTransformer,
  transformFeatureCollectionsToThreeJSShapes,
} from './simulation-helpers'
import {DEBUG_LAYER} from './simulation-layers'
import {createGridTexture, createMapTexture} from './simulation-textures'
import {useCameraFeedRenderers} from './use-camera-feed-renderers'
import {useSimulatedPeople} from './use-simulated-people'

interface FocusRequest {
  point: THREE.Vector3
  distance: number
}

export interface SimulationSceneProps {
  scene: SceneRoot
  sceneMode: SceneMode
  showMapTexture: boolean
  focusAreaId?: string
  onSelectEntity: (id?: string) => void
  selectedEntityIds: string[]
  cameraFeedTargets?: CameraFeedTarget[]
  onCaptureReady?: (api: SimulationCaptureApi) => void
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

// eslint-disable-next-line max-lines-per-function
export const SimulationScene: React.FC<SimulationSceneProps> = ({
  scene,
  sceneMode: _sceneMode,
  showMapTexture,
  focusAreaId,
  onSelectEntity,
  selectedEntityIds,
  cameraFeedTargets,
  onCaptureReady,
}) => {
  const {camera, gl, scene: threeScene, size} = useThree()
  const setVisionState = useUiStore((state) => state.setVisionState)
  const controlsRef = React.useRef<OrbitControlsImpl | null>(null)
  const originPoint = React.useMemo(() => computeSceneOrigin(scene), [scene])
  const transformer = React.useMemo(
    () => createCoordinateTransformer(originPoint),
    [originPoint],
  )
  const notifyCaptureReady = useCallbackRef(onCaptureReady ?? (() => {}))

  React.useEffect(() => {
    if (!onCaptureReady) {
      return
    }

    const captureFrame = (scale = 2) => {
      if (!gl?.domElement) {
        return null
      }
      const safeScale = Math.max(scale, 1)
      const previousSize = new THREE.Vector2()
      gl.getSize(previousSize)
      const previousPixelRatio = gl.getPixelRatio()
      const targetWidth = Math.max(1, Math.round(previousSize.x * safeScale))
      const targetHeight = Math.max(1, Math.round(previousSize.y * safeScale))
      const previousAspect =
        camera instanceof THREE.PerspectiveCamera ? camera.aspect : null

      try {
        gl.setPixelRatio(1)
        gl.setSize(targetWidth, targetHeight, false)
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.aspect = targetWidth / Math.max(targetHeight, 1)
          camera.updateProjectionMatrix()
        }
        gl.render(threeScene, camera)
        return gl.domElement.toDataURL('image/png')
      } finally {
        gl.setPixelRatio(previousPixelRatio)
        gl.setSize(previousSize.x, previousSize.y, false)
        if (
          camera instanceof THREE.PerspectiveCamera &&
          previousAspect !== null
        ) {
          camera.aspect = previousAspect
          camera.updateProjectionMatrix()
        }
      }
    }

    const api: SimulationCaptureApi = {
      getCanvas: () => gl.domElement ?? null,
      captureFrame,
    }

    notifyCaptureReady(api)
  }, [camera, gl, notifyCaptureReady, onCaptureReady, threeScene])

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

  const requestFocus = useCallbackRef((point: THREE.Vector3, distance = 10) => {
    setFocusRequest({point, distance})
  })

  React.useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const safeHeight = Math.max(size.height, 1)
      camera.aspect = size.width / safeHeight
      camera.updateProjectionMatrix()
    }
  }, [camera, size.height, size.width])

  React.useEffect(() => {
    if (camera instanceof THREE.Camera) {
      camera.layers.enable(DEBUG_LAYER)
    }
  }, [camera])

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

  useFrame((state) => {
    state.gl.setViewport(0, 0, state.size.width, state.size.height)
    state.gl.setScissorTest(false)
    state.gl.render(state.scene, state.camera)
  }, 1)

  useCameraFeedRenderers({
    cameraFeedTargets,
    cameras: scene.cameras,
    transformer,
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
        positions={simulatedPeoplePositions}
        selectedPersonId={selectedPersonId}
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
