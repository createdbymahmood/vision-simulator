import {useFrame, useThree} from '@react-three/fiber'
import React from 'react'
import * as THREE from 'three'

import type {CameraEntity} from '@/features/scene/types/types'

import type {CameraFeedTarget} from './camera-feed-types'
import type {CoordinateTransformer} from './simulation-helpers'

import {computeFeedRenderConfig, getFeedFps} from './camera-feed-helpers'
import {
  createFeedRenderer,
  updateFeedCamera,
} from './camera-feed-renderer-utils'
import {WORLD_LAYER} from './simulation-layers'

interface FeedRendererState {
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  lastRender: number
  renderSize: {width: number; height: number}
  aspect: number
}

type RendererMapRef = React.MutableRefObject<Map<string, FeedRendererState>>
type SizeMapRef = React.MutableRefObject<
  Map<string, {width: number; height: number}>
>
type ObserverMapRef = React.MutableRefObject<
  Map<string, {observer: ResizeObserver; element: Element}>
>

const disposeRendererForTarget = (rendererMap: RendererMapRef, id: string) => {
  const state = rendererMap.current.get(id)
  if (!state) {
    return
  }
  state.renderer.dispose()
  rendererMap.current.delete(id)
}

const disconnectObserverForTarget = (
  observerMap: ObserverMapRef,
  sizeMap: SizeMapRef,
  id: string,
) => {
  const entry = observerMap.current.get(id)
  if (entry) {
    entry.observer.disconnect()
    observerMap.current.delete(id)
  }
  sizeMap.current.delete(id)
}

const clearTargetResources = (
  rendererMap: RendererMapRef,
  observerMap: ObserverMapRef,
  sizeMap: SizeMapRef,
  id: string,
) => {
  disposeRendererForTarget(rendererMap, id)
  disconnectObserverForTarget(observerMap, sizeMap, id)
}

const ensureContainerObserver = (
  target: CameraFeedTarget,
  observerMap: ObserverMapRef,
  sizeMap: SizeMapRef,
) => {
  const container = target.containerRef.current
  if (!container) {
    return
  }

  const existing = observerMap.current.get(target.id)
  if (existing && existing.element === container) {
    return
  }
  if (existing) {
    existing.observer.disconnect()
    observerMap.current.delete(target.id)
  }

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) {
      return
    }
    const {width, height} = entry.contentRect
    sizeMap.current.set(target.id, {width, height})
  })
  observer.observe(container)
  observerMap.current.set(target.id, {observer, element: container})
  const rect = container.getBoundingClientRect()
  sizeMap.current.set(target.id, {
    width: rect.width,
    height: rect.height,
  })
}

const ensureFeedRendererState = (
  rendererMap: RendererMapRef,
  targetId: string,
  canvas: HTMLCanvasElement,
) => {
  const existingState = rendererMap.current.get(targetId)
  if (existingState) {
    if (existingState.renderer.domElement !== canvas) {
      existingState.renderer.dispose()
      rendererMap.current.delete(targetId)
    } else {
      return existingState
    }
  }

  const renderer = createFeedRenderer(canvas)
  const camera = new THREE.PerspectiveCamera()
  camera.layers.set(WORLD_LAYER)
  const nextState: FeedRendererState = {
    renderer,
    camera,
    lastRender: 0,
    renderSize: {width: 0, height: 0},
    aspect: 1,
  }
  rendererMap.current.set(targetId, nextState)
  return nextState
}

export const useCameraFeedRenderers = ({
  cameraFeedTargets,
  cameras,
  transformer,
}: {
  cameraFeedTargets?: CameraFeedTarget[]
  cameras: CameraEntity[]
  transformer: CoordinateTransformer
}) => {
  const {scene: threeScene} = useThree()
  const camerasById = React.useMemo(
    () => new Map(cameras.map((camera) => [camera.id, camera])),
    [cameras],
  )
  const rendererMap = React.useRef(new Map<string, FeedRendererState>())
  const sizeMap = React.useRef(
    new Map<string, {width: number; height: number}>(),
  )
  const observerMap = React.useRef(new Map<string, ResizeObserver>())

  React.useEffect(() => {
    const targets = cameraFeedTargets ?? []
    const activeIds = new Set(targets.map((target) => target.id))

    rendererMap.current.forEach((state, id) => {
      if (!activeIds.has(id)) {
        state.renderer.dispose()
        rendererMap.current.delete(id)
      }
    })

    observerMap.current.forEach((entry, id) => {
      if (!activeIds.has(id)) {
        entry.observer.disconnect()
        observerMap.current.delete(id)
        sizeMap.current.delete(id)
      }
    })
  }, [cameraFeedTargets])

  React.useEffect(
    () => () => {
      rendererMap.current.forEach((state) => {
        state.renderer.dispose()
      })
      rendererMap.current.clear()
      observerMap.current.forEach((entry) => {
        entry.observer.disconnect()
      })
      observerMap.current.clear()
      sizeMap.current.clear()
    },
    [],
  )

  useFrame(({clock}) => {
    const targets = cameraFeedTargets ?? []
    if (targets.length === 0) {
      return
    }

    const feedCount = targets.length
    const devicePixelRatio =
      typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
    const aspectFallback = 16 / 9
    const minInterval = 1 / getFeedFps(feedCount)

    targets.forEach((target) => {
      const cameraEntity = camerasById.get(target.id)
      if (!cameraEntity || cameraEntity.sourceDeviceKind === 'real') {
        clearTargetResources(rendererMap, observerMap, sizeMap, target.id)
        return
      }

      ensureContainerObserver(target, observerMap, sizeMap)

      const canvas = target.canvasRef.current
      if (!canvas) {
        disposeRendererForTarget(rendererMap, target.id)
        return
      }

      const state = ensureFeedRendererState(rendererMap, target.id, canvas)

      if (clock.elapsedTime - state.lastRender < minInterval) {
        return
      }

      const containerSize = sizeMap.current.get(target.id)
      const aspect = containerSize
        ? containerSize.width / Math.max(containerSize.height, 1)
        : aspectFallback
      if (aspect !== state.aspect) {
        state.aspect = aspect
      }

      const config = containerSize
        ? computeFeedRenderConfig({
            feedCount,
            containerWidth: containerSize.width,
            containerHeight: containerSize.height,
            devicePixelRatio,
          })
        : null

      if (!config) {
        return
      }

      if (
        state.renderSize.width !== config.renderWidth ||
        state.renderSize.height !== config.renderHeight
      ) {
        state.renderSize = {
          width: config.renderWidth,
          height: config.renderHeight,
        }
        state.renderer.setSize(config.renderWidth, config.renderHeight, false)
      }

      updateFeedCamera({
        camera: state.camera,
        cameraEntity,
        transformer,
        aspect,
      })

      state.renderer.render(threeScene, state.camera)
      state.lastRender = clock.elapsedTime
    })
  })
}
