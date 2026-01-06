import type {FeatureCollection, LineString} from 'geojson'

import React from 'react'
import {Layer, Source} from 'react-map-gl/mapbox'

interface MapViewRotationHandleLayerProps {
  rotationHandle: FeatureCollection<LineString> | null
}

export const MapViewRotationHandleLayer: React.FC<
  MapViewRotationHandleLayerProps
> = ({rotationHandle}) => {
  if (!rotationHandle) {
    return null
  }

  return (
    <Source data={rotationHandle} id='rotation-handle-line' type='geojson'>
      <Layer
        id='rotation-connector'
        type='line'
        paint={{
          'line-color': '#2563EB',
          'line-width': 1,
          'line-dasharray': [1, 1],
        }}
      />
    </Source>
  )
}
