import type {OrbitControls as OrbitControlsImpl} from 'three-stdlib'

import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import {OrbitControls} from '@react-three/drei'
import {useFrame, useThree} from '@react-three/fiber'
import React from 'react'
import * as THREE from 'three'

import type {
  EditorMode,
  PreviewViewMode,
  SceneRoot,
} from '@/features/scene/domain/types'

import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'

import type {CameraFeedTarget} from './camera-feed-types'
import type {SimulationCaptureApi} from './simulation-capture'
import type {WorldEntity} from './simulation-helpers'

import {computeBounds} from '../map-view/selection-geometry'
import {CameraFovFootprints} from './camera-fov-footprints'
import {
  buildObstacleSegmentsByArea,
  computeCameraVisionState,
  createCameraVisionFovCache,
} from './camera-vision'
import {EntitiesMesh} from './entity-meshes'
import {GroundPlane} from './ground-plane'
import {LiveRadarDetectionsMesh} from './live-radar-detections-mesh'
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

const getFramedScene = (scene: SceneRoot, focusAreaId?: string): SceneRoot => {
  if (!focusAreaId) {
    return scene
  }
  return {
    ...scene,
    areas: scene.areas.filter((area) => area.id === focusAreaId),
    walls: scene.walls.filter((wall) => wall.areaId === focusAreaId),
    shapes: scene.shapes.filter((shape) => shape.areaId === focusAreaId),
    cameras: scene.cameras.filter(
      (sceneCamera) => sceneCamera.areaId === focusAreaId,
    ),
    people: scene.people.filter((person) => person.areaId === focusAreaId),
  }
}

const getSceneGeoPoints = (scene: SceneRoot): [number, number][] => {
  const points: [number, number][] = []
  scene.areas.forEach((area) => points.push(...area.geometry.coordinates))
  scene.shapes.forEach((shape) => points.push(...shape.geometry))
  scene.walls.forEach((wall) => points.push(...wall.points))
  scene.people.forEach((person) => points.push([person.x, person.y]))
  scene.cameras.forEach((sceneCamera) =>
    points.push([sceneCamera.x, sceneCamera.y]),
  )
  return points
}

export interface SimulationSceneProps {
  scene: SceneRoot
  editorMode: EditorMode
  previewViewMode: PreviewViewMode
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
      shadow-mapSize-height={1024}
      shadow-mapSize-width={1024}
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
  editorMode: _editorMode,
  previewViewMode,
  showMapTexture,
  focusAreaId,
  onSelectEntity,
  selectedEntityIds,
  cameraFeedTargets,
  onCaptureReady,
}) => {
  const {camera, gl, scene: threeScene, size} = useThree()
  const setVisionState = useUiStore((state) => state.setVisionState)
  const mapboxToken = useUiStore((state) => state.mapboxToken)
  const controlsRef = React.useRef<OrbitControlsImpl | null>(null)
  const originPoint = React.useMemo(() => {
    const nextScene = getFramedScene(scene, focusAreaId)
    return computeSceneOrigin(nextScene)
  }, [focusAreaId, scene])
  const transformer = React.useMemo(
    () => createCoordinateTransformer(originPoint),
    [originPoint],
  )
  const notifyCaptureReady = useCallbackRef(onCaptureReady ?? (() => undefined))

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
    const nextScene = getFramedScene(scene, focusAreaId)
    return getSceneGeoPoints(nextScene)
  }, [focusAreaId, scene])

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
    const squareSide = Math.max(
      width * paddingMultiplier,
      width + paddingAbsolute,
      height * paddingMultiplier,
      height + paddingAbsolute,
      200,
    )
    return {
      width: squareSide,
      height: squareSide,
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
    if (!showMapTexture || !geoBounds || !mapboxToken) {
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

    const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/[${geoBounds.minLng},${geoBounds.minLat},${geoBounds.maxLng},${geoBounds.maxLat}]/${reqWidth}x${reqHeight}@2x?attribution=false&logo=false&access_token=${mapboxToken}`
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
  }, [
    geoBounds,
    mapPlaneSize.height,
    mapPlaneSize.width,
    mapboxToken,
    showMapTexture,
  ])

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
  const visionFovCacheRef = React.useRef(createCameraVisionFovCache())
  const visionTickInterval = React.useMemo(() => {
    const complexity = Math.max(scene.cameras.length, 1) * scene.people.length
    if (complexity >= 200) {
      return 1 / 10
    }
    if (complexity >= 80) {
      return 1 / 15
    }
    if (complexity >= 30) {
      return 1 / 20
    }
    return 1 / 24
  }, [scene.cameras.length, scene.people.length])
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
      const nextPosition = override.clone()
      nextPosition.y = entity.position.y
      return {...entity, position: nextPosition}
    })
  }, [entities, simulatedPeoplePositions])
  const visibleAreaEntities = React.useMemo(
    () =>
      entities.filter(
        (entity) =>
          entity.type === 'area' &&
          (!focusAreaId || entity.entity.id === focusAreaId),
      ) as Extract<WorldEntity, {type: 'area'}>[],
    [entities, focusAreaId],
  )
  const visibleEntities = React.useMemo(() => {
    if (!focusAreaId) {
      return renderedEntities
    }
    return renderedEntities.filter((entity) => {
      if (entity.type === 'area') {
        return entity.entity.id === focusAreaId
      }
      return entity.entity.areaId === focusAreaId
    })
  }, [focusAreaId, renderedEntities])
  const visibleSimulatedPeoplePositions = React.useMemo(() => {
    if (!focusAreaId) {
      return simulatedPeoplePositions
    }
    const visiblePersonIds = new Set(
      scene.people
        .filter((person) => person.areaId === focusAreaId)
        .map((person) => person.id),
    )
    return new Map(
      [...simulatedPeoplePositions].filter(([personId]) =>
        visiblePersonIds.has(personId),
      ),
    )
  }, [focusAreaId, scene.people, simulatedPeoplePositions])

  const selectedPersonId = React.useMemo(
    () => selectedEntityIds.find((id) => id.startsWith('person-')),
    [selectedEntityIds],
  )

  const collisionCameras = React.useMemo(
    () =>
      scene.cameras.filter(
        (sceneCamera) => !focusAreaId || sceneCamera.areaId === focusAreaId,
      ),
    [focusAreaId, scene.cameras],
  )

  const bounds = React.useMemo(() => {
    const points = visibleAreaEntities.flatMap((entity) => entity.points)
    if (!points.length) {
      return null
    }
    return new THREE.Box3().setFromPoints(points)
  }, [visibleAreaEntities])

  const [focusRequest, setFocusRequest] = React.useState<FocusRequest | null>(
    null,
  )

  const areaFocus = React.useMemo(() => {
    const points = visibleAreaEntities.flatMap((area) => area.points)
    if (!points.length) {
      return null
    }
    const box = new THREE.Box3().setFromPoints(points)
    const center = new THREE.Vector3()
    box.getCenter(center)
    const focusBoundsSize = new THREE.Vector3()
    box.getSize(focusBoundsSize)
    const distance = Math.max(focusBoundsSize.x, focusBoundsSize.z, 10) * 1.2
    return {point: center, distance}
  }, [visibleAreaEntities])

  React.useEffect(() => {
    if (areaFocus) {
      setFocusRequest(areaFocus)
    } else {
      setFocusRequest(null)
    }
  }, [areaFocus])

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
    const controlsCamera = controlsRef.current.object
    const target = new THREE.Vector3()
    if (bounds) {
      bounds.getCenter(target)
      const boundsSize = new THREE.Vector3()
      bounds.getSize(boundsSize)
      const distance = Math.max(boundsSize.x, boundsSize.z, 40)
      controlsCamera.position.set(
        target.x + distance * 0.8,
        distance * 0.5,
        target.z + distance * 0.8,
      )
      controlsRef.current.target.copy(target)
    } else {
      controlsCamera.position.set(40, 30, 40)
      controlsRef.current.target.set(0, 0, 0)
    }
    controlsCamera.updateProjectionMatrix()
    controlsRef.current.update()
  }, [bounds])

  useFrame(({clock}) => {
    if (clock.elapsedTime - lastVisionTick.current < visionTickInterval) {
      return
    }
    lastVisionTick.current = clock.elapsedTime
    setVisionState(
      computeCameraVisionState({
        scene,
        transformer,
        simulatedPeoplePositions,
        obstaclesByArea,
        fovCache: visionFovCacheRef.current,
      }),
    )
  })

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
        entities={visibleEntities}
        selectedEntityIds={selectedEntityIds}
        onFocus={requestFocus}
        onSelectEntity={onSelectEntity}
        showCameraFrustums={false}
      />
      {previewViewMode === '3d' ? (
        <LiveRadarDetectionsMesh
          scene={scene}
          focusAreaId={focusAreaId}
          transformer={transformer}
        />
      ) : null}
      <PersonTrail
        positions={visibleSimulatedPeoplePositions}
        selectedPersonId={selectedPersonId}
      />
      {collisionCameras.length > 0 ? (
        <CameraFovFootprints
          cameras={collisionCameras}
          scene={scene}
          transformer={transformer}
        />
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
