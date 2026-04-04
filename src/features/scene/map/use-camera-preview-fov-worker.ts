import React from 'react'

import type {
  AreaEntity,
  GeoPoint,
  ShapeEntity,
  WallEntity,
} from '@/features/scene/types/types'
import type {
  CameraFovWorkerComputePreviewMessage,
  CameraFovWorkerResponse,
  CameraFovWorkerSetStaticMessage,
} from '@/features/scene/map/camera-fov-worker-types'

interface CameraPreviewFovResult {
  requestId: number
  ring: GeoPoint[]
  area: number
}

interface CameraPreviewFovRequest {
  requestId: number
  origin: GeoPoint
  direction: number
  fov: number
  depth: number
  cameraHeight: number
  areaId?: string
}

interface UseCameraPreviewFovWorkerParams {
  areas: AreaEntity[]
  walls: WallEntity[]
  shapes: ShapeEntity[]
  onPreviewResult: (result: CameraPreviewFovResult) => void
}

interface UseCameraPreviewFovWorkerResult {
  requestPreviewFov: (request: CameraPreviewFovRequest) => boolean
  workerReady: boolean
}

export const useCameraPreviewFovWorker = ({
  areas,
  walls,
  shapes,
  onPreviewResult,
}: UseCameraPreviewFovWorkerParams): UseCameraPreviewFovWorkerResult => {
  const [workerReady, setWorkerReady] = React.useState(false)
  const workerRef = React.useRef<Worker | null>(null)
  const lastStaticRefsRef = React.useRef<{
    areas: AreaEntity[]
    walls: WallEntity[]
    shapes: ShapeEntity[]
  } | null>(null)
  const onPreviewResultRef = React.useRef(onPreviewResult)

  React.useEffect(() => {
    onPreviewResultRef.current = onPreviewResult
  }, [onPreviewResult])

  React.useEffect(() => {
    if (typeof Worker === 'undefined') {
      setWorkerReady(false)
      return
    }

    const worker = new Worker(
      new URL('./camera-fov.worker.js', import.meta.url),
      {type: 'module'},
    )
    workerRef.current = worker
    lastStaticRefsRef.current = null
    setWorkerReady(true)

    worker.onmessage = (event: MessageEvent<CameraFovWorkerResponse>) => {
      const message = event.data
      if (message.type !== 'preview-result') {
        return
      }
      onPreviewResultRef.current({
        requestId: message.requestId,
        ring: message.ring,
        area: message.area,
      })
    }

    return () => {
      workerRef.current = null
      lastStaticRefsRef.current = null
      worker.terminate()
    }
  }, [])

  React.useEffect(() => {
    const worker = workerRef.current
    if (!worker || !workerReady) {
      return
    }

    const previousStaticRefs = lastStaticRefsRef.current
    const staticChanged =
      !previousStaticRefs ||
      previousStaticRefs.areas !== areas ||
      previousStaticRefs.walls !== walls ||
      previousStaticRefs.shapes !== shapes

    if (!staticChanged) {
      return
    }

    const staticMessage: CameraFovWorkerSetStaticMessage = {
      type: 'set-static',
      areas,
      walls,
      shapes,
    }
    worker.postMessage(staticMessage)
    lastStaticRefsRef.current = {areas, walls, shapes}
  }, [areas, shapes, walls, workerReady])

  const requestPreviewFov = React.useCallback(
    (request: CameraPreviewFovRequest) => {
      const worker = workerRef.current
      if (!worker || !workerReady) {
        return false
      }
      const previousStaticRefs = lastStaticRefsRef.current
      const staticChanged =
        !previousStaticRefs ||
        previousStaticRefs.areas !== areas ||
        previousStaticRefs.walls !== walls ||
        previousStaticRefs.shapes !== shapes
      if (staticChanged) {
        const staticMessage: CameraFovWorkerSetStaticMessage = {
          type: 'set-static',
          areas,
          walls,
          shapes,
        }
        worker.postMessage(staticMessage)
        lastStaticRefsRef.current = {areas, walls, shapes}
      }
      const computeMessage: CameraFovWorkerComputePreviewMessage = {
        type: 'compute-preview-fov',
        requestId: request.requestId,
        origin: request.origin,
        direction: request.direction,
        fov: request.fov,
        depth: request.depth,
        cameraHeight: request.cameraHeight,
        areaId: request.areaId,
      }
      worker.postMessage(computeMessage)
      return true
    },
    [areas, shapes, walls, workerReady],
  )

  return {requestPreviewFov, workerReady}
}
