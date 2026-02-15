/// <reference lib="WebWorker" />

import type {
  AreaEntity,
  ShapeEntity,
  WallEntity,
} from '@/features/scene/domain/types'
import type {
  CameraFovWorkerComputeMessage,
  CameraFovWorkerComputePreviewMessage,
  CameraFovWorkerRequest,
  CameraFovWorkerResponse,
} from '@/features/scene/presentation/components/map-view/camera-fov-worker-types'

import {
  buildCameraLayerData,
  buildFovOcclusionObstacles,
  buildOccludedFovRing,
  computeArea,
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
let areaById = new Map<string, AreaEntity>()
let obstaclesByArea = new Map<
  string,
  ReturnType<typeof buildFovOcclusionObstacles>
>()
let layerDataCache = createCameraLayerDataCache()
type ComputeMessage =
  | CameraFovWorkerComputeMessage
  | CameraFovWorkerComputePreviewMessage
let activeCompute: ComputeMessage | null = null
let queuedCompute: ComputeMessage | null = null
let isWorkerBooted = false

const postResponse = (message: CameraFovWorkerResponse) => {
  self.postMessage(message)
}

const rebuildStaticDerivedState = () => {
  areaById = new Map(staticSnapshot.areas.map((area) => [area.id, area]))

  const wallsByArea = new Map<string, WallEntity[]>()
  staticSnapshot.walls.forEach((wall) => {
    const group = wallsByArea.get(wall.areaId)
    if (group) {
      group.push(wall)
      return
    }
    wallsByArea.set(wall.areaId, [wall])
  })

  const shapesByArea = new Map<string, ShapeEntity[]>()
  staticSnapshot.shapes.forEach((shape) => {
    const group = shapesByArea.get(shape.areaId)
    if (group) {
      group.push(shape)
      return
    }
    shapesByArea.set(shape.areaId, [shape])
  })

  obstaclesByArea = new Map()
  staticSnapshot.areas.forEach((area) => {
    obstaclesByArea.set(
      area.id,
      buildFovOcclusionObstacles(
        wallsByArea.get(area.id) ?? [],
        shapesByArea.get(area.id) ?? [],
      ),
    )
  })
}

const processCompute = (message: ComputeMessage) => {
  let nextMessage: ComputeMessage | null = message
  while (nextMessage) {
    activeCompute = nextMessage
    try {
      if (nextMessage.type === 'compute-fov') {
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
      } else {
        const area = nextMessage.areaId
          ? areaById.get(nextMessage.areaId)
          : undefined
        const obstacles = nextMessage.areaId
          ? (obstaclesByArea.get(nextMessage.areaId) ?? [])
          : []
        const ring = buildOccludedFovRing({
          origin: nextMessage.origin,
          direction: nextMessage.direction,
          fov: nextMessage.fov,
          depth: nextMessage.depth,
          cameraHeight: nextMessage.cameraHeight,
          area,
          obstacles,
        })
        postResponse({
          type: 'preview-result',
          requestId: nextMessage.requestId,
          ring,
          area: computeArea(ring),
        })
      }
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
      rebuildStaticDerivedState()
      return
    }

    if (activeCompute) {
      queuedCompute = message
      return
    }
    processCompute(message)
  }
}
