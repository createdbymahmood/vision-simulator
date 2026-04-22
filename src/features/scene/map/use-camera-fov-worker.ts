import type {FeatureCollection, LineString, Polygon} from 'geojson'

import React from 'react'

import type {
  AreaEntity,
  CameraEntity,
  ShapeEntity,
  WallEntity,
} from '@/features/scene/types/types'
import {
  buildCameraLayerData,
  createCameraLayerDataCache,
} from '@/features/scene/map/map-view-helpers'

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

export const useCameraFovWorker = ({
  cameras,
  areas,
  walls,
  shapes,
}: UseCameraFovWorkerParams): CameraFovLayerData => {
  const layerDataCacheRef = React.useRef(createCameraLayerDataCache())
  const deferredCameras = React.useDeferredValue(cameras)
  const deferredAreas = React.useDeferredValue(areas)
  const deferredWalls = React.useDeferredValue(walls)
  const deferredShapes = React.useDeferredValue(shapes)

  return React.useMemo(() => {
    if (
      deferredCameras.length === 0 &&
      deferredAreas.length === 0 &&
      deferredWalls.length === 0 &&
      deferredShapes.length === 0
    ) {
      return EMPTY_CAMERA_FOV_LAYER_DATA
    }

    const result = buildCameraLayerData(
      deferredCameras,
      deferredAreas,
      deferredWalls,
      deferredShapes,
      layerDataCacheRef.current,
    )
    return {
      fovs: result.fovs,
      directions: result.directions,
    }
  }, [deferredAreas, deferredCameras, deferredShapes, deferredWalls])
}
