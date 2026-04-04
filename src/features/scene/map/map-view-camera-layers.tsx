import React from 'react'
import {Layer, Source} from 'react-map-gl/mapbox'

import type {CameraLayerData} from './map-view-helpers'

interface MapViewCameraLayersProps {
  data: CameraLayerData
  hideFov?: boolean
}

const MapViewCameraLayersComponent: React.FC<MapViewCameraLayersProps> = ({
  data,
  hideFov = false,
}) => {
  const hasCameras = data.points.features.length > 0

  if (!hasCameras) {
    return null
  }

  return (
    <>
      <Source data={data.fovs} id='camera-fovs' type='geojson' promoteId='id'>
        <Layer
          id='camera-fov-fill'
          type='fill'
          layout={{visibility: hideFov ? 'none' : 'visible'}}
          paint={{
            'fill-color': ['coalesce', ['get', 'color'], '#2563EB'],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.25,
              ['boolean', ['feature-state', 'selected'], false],
              0.2,
              0.15,
            ],
          }}
        />
        <Layer
          id='camera-fov-outline'
          type='line'
          layout={{
            visibility: hideFov ? 'none' : 'visible',
            'line-cap': 'round',
            'line-join': 'round',
          }}
          paint={{
            'line-color': ['coalesce', ['get', 'color'], '#2563EB'],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              2.4,
              2,
            ],
            'line-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              1,
              0.6,
            ],
            'line-dasharray': [2, 2],
          }}
        />
      </Source>

      <Source data={data.points} id='cameras' type='geojson' promoteId='id'>
        <Layer
          id='camera-outline'
          type='circle'
          paint={{
            'circle-radius': 9,
            'circle-color': '#FFFFFF',
            'circle-stroke-color': '#111827',
            'circle-stroke-width': 2,
            'circle-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.95,
              0.85,
            ],
          }}
        />
        <Layer
          id='camera-icon'
          type='circle'
          paint={{
            'circle-radius': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              7.5,
              6,
            ],
            'circle-color': ['coalesce', ['get', 'color'], '#111827'],
            'circle-opacity': 0.9,
          }}
        />
      </Source>
    </>
  )
}

MapViewCameraLayersComponent.displayName = 'MapViewCameraLayers'

export const MapViewCameraLayers = React.memo(MapViewCameraLayersComponent)
