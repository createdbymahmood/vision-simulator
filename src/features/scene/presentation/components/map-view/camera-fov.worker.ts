/// <reference lib="WebWorker" />

import type {
  AreaEntity,
  ShapeEntity,
  WallEntity,
} from '@/features/scene/domain/types'
import type {
  CameraFovWorkerComputeMessage,
  CameraFovWorkerRequest,
  CameraFovWorkerResponse,
} from '@/features/scene/presentation/components/map-view/camera-fov-worker-types'

import {
  buildCameraLayerData,
  createCameraLayerDataCache,
} from '@/features/scene/presentation/components/map-view/map-view-helpers'

declare const self: DedicatedWorkerGlobalScope

interface StaticSnapshot {
  areas: AreaEntity[]
  walls: WallEntity[]
  shapes: ShapeEntity[]
}

let staticSnapshot: StaticSnapshot = {
  areas: [],
  walls: [],
  shapes: [],
}
let layerDataCache = createCameraLayerDataCache()
let activeCompute: CameraFovWorkerComputeMessage | null = null
let queuedCompute: CameraFovWorkerComputeMessage | null = null
let isWorkerBooted = false

const postResponse = (message: CameraFovWorkerResponse) => {
  self.postMessage(message)
}

const processCompute = (message: CameraFovWorkerComputeMessage) => {
  let nextMessage: CameraFovWorkerComputeMessage | null = message
  while (nextMessage) {
    activeCompute = nextMessage
    try {
      const data = buildCameraLayerData(
        nextMessage.cameras,
        staticSnapshot.areas,
        staticSnapshot.walls,
        staticSnapshot.shapes,
        layerDataCache,
      )
      postResponse({
        type: 'result',
        requestId: nextMessage.requestId,
        fovs: data.fovs,
        directions: data.directions,
      })
    } catch (error) {
      const description =
        error instanceof Error ? error.message : 'Unknown worker error'
      postResponse({
        type: 'error',
        requestId: nextMessage.requestId,
        message: description,
      })
    }
    nextMessage = queuedCompute
    queuedCompute = null
  }
  activeCompute = null
}

export const bootCameraFovWorker = () => {
  if (isWorkerBooted) {
    return
  }
  isWorkerBooted = true

  self.onmessage = (event: MessageEvent<CameraFovWorkerRequest>) => {
    const message = event.data
    if (message.type === 'set-static') {
      staticSnapshot = {
        areas: message.areas,
        walls: message.walls,
        shapes: message.shapes,
      }
      layerDataCache = createCameraLayerDataCache()
      return
    }

    if (activeCompute) {
      queuedCompute = message
      return
    }
    processCompute(message)
  }
}
