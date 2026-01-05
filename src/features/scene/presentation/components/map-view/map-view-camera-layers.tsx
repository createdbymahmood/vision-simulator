import type {FeatureCollection, Point} from 'geojson'

import React from 'react'
import {Layer, Source} from 'react-map-gl/mapbox'

interface MapViewCameraLayersProps {
  cameraFeatures: FeatureCollection<Point>
}

export const MapViewCameraLayers: React.FC<MapViewCameraLayersProps> = ({
  cameraFeatures,
}) => {
  if (cameraFeatures.features.length === 0) {
    return null
  }

  return (
    <Source data={cameraFeatures} id='cameras' promoteId='id' type='geojson'>
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
        id='camera-fill'
        type='circle'
        paint={{
          'circle-radius': 6,
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#2563EB',
            '#111827',
          ],
          'circle-opacity': 0.9,
        }}
      />
    </Source>
  )
}
