import type {FeatureCollection, LineString, Polygon} from 'geojson'

import React from 'react'

import type {
  AreaEntity,
  CameraEntity,
  ShapeEntity,
  WallEntity,
} from '@/features/scene/domain/types'
import type {
  CameraFovWorkerComputeMessage,
  CameraFovWorkerResponse,
  CameraFovWorkerSetStaticMessage,
} from '@/features/scene/presentation/components/map-view/camera-fov-worker-types'

import {buildCameraLayerData} from '@/features/scene/presentation/components/map-view/map-view-helpers'

interface CameraFovLayerData {
  fovs: FeatureCollection<Polygon>
  directions: FeatureCollection<LineString>
}

interface UseCameraFovWorkerParams {
  cameras: CameraEntity[]
  areas: AreaEntity[]
  walls: WallEntity[]
  shapes: ShapeEntity[]
}

const EMPTY_CAMERA_FOV_LAYER_DATA: CameraFovLayerData = {
  fovs: {type: 'FeatureCollection', features: []},
  directions: {type: 'FeatureCollection', features: []},
}

const buildMainThreadFovData = ({
  cameras,
  areas,
  walls,
  shapes,
}: UseCameraFovWorkerParams): CameraFovLayerData => {
  const result = buildCameraLayerData(cameras, areas, walls, shapes)
  return {
    fovs: result.fovs,
    directions: result.directions,
  }
}

export const useCameraFovWorker = ({
  cameras,
  areas,
  walls,
  shapes,
}: UseCameraFovWorkerParams): CameraFovLayerData => {
  const [fovData, setFovData] = React.useState<CameraFovLayerData>(
    EMPTY_CAMERA_FOV_LAYER_DATA,
  )
  const [workerReady, setWorkerReady] = React.useState(false)
  const workerRef = React.useRef<Worker | null>(null)
  const latestRequestIdRef = React.useRef(0)
  const lastStaticRefsRef = React.useRef<{
    areas: AreaEntity[]
    walls: WallEntity[]
    shapes: ShapeEntity[]
  } | null>(null)

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
      if (message.requestId !== latestRequestIdRef.current) {
        return
      }
      if (message.type === 'error') {
        return
      }
      setFovData({
        fovs: message.fovs,
        directions: message.directions,
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
      setFovData(buildMainThreadFovData({cameras, areas, walls, shapes}))
      return
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

    const requestId = latestRequestIdRef.current + 1
    latestRequestIdRef.current = requestId

    const computeMessage: CameraFovWorkerComputeMessage = {
      type: 'compute-fov',
      requestId,
      cameras,
    }
    worker.postMessage(computeMessage)
  }, [areas, cameras, shapes, walls, workerReady])

  return fovData
}
