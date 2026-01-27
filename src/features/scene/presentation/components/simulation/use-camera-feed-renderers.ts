import React from 'react'
import {useFrame, useThree} from '@react-three/fiber'
import * as THREE from 'three'

import type {CameraEntity} from '@/features/scene/domain/types'

import {computeFeedRenderConfig, getFeedFps} from './camera-feed-helpers'
import {createFeedRenderer, updateFeedCamera} from './camera-feed-renderer-utils'
import type {CameraFeedTarget} from './camera-feed-types'
import type {CoordinateTransformer} from './simulation-helpers'
import {WORLD_LAYER} from './simulation-layers'

interface FeedRendererState {
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  lastRender: number
  renderSize: {width: number; height: number}
  aspect: number
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
  const sizeMap = React.useRef(new Map<string, {width: number; height: number}>())
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

    observerMap.current.forEach((observer, id) => {
      if (!activeIds.has(id)) {
        observer.disconnect()
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
      observerMap.current.forEach((observer) => {
        observer.disconnect()
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
      const container = target.containerRef.current
      if (container && !observerMap.current.has(target.id)) {
        const observer = new ResizeObserver((entries) => {
          const entry = entries[0]
          if (!entry) {
            return
          }
          const {width, height} = entry.contentRect
          sizeMap.current.set(target.id, {width, height})
        })
        observer.observe(container)
        observerMap.current.set(target.id, observer)
        const rect = container.getBoundingClientRect()
        sizeMap.current.set(target.id, {
          width: rect.width,
          height: rect.height,
        })
      }

      const cameraEntity = camerasById.get(target.id)
      const canvas = target.canvasRef.current
      if (!cameraEntity || !canvas) {
        return
      }

      let state = rendererMap.current.get(target.id)
      if (!state) {
        const renderer = createFeedRenderer(canvas)
        const camera = new THREE.PerspectiveCamera()
        camera.layers.set(WORLD_LAYER)
        state = {
          renderer,
          camera,
          lastRender: 0,
          renderSize: {width: 0, height: 0},
          aspect: 1,
        }
        rendererMap.current.set(target.id, state)
      }

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
