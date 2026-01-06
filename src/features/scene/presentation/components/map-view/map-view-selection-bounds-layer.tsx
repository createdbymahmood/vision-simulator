import type {FeatureCollection} from 'geojson'

import React from 'react'
import {Layer, Source} from 'react-map-gl/mapbox'

interface MapViewSelectionBoundsLayerProps {
  selectionBoundsFeature: FeatureCollection | null
}

export const MapViewSelectionBoundsLayer: React.FC<
  MapViewSelectionBoundsLayerProps
> = ({selectionBoundsFeature}) => {
  if (!selectionBoundsFeature) {
    return null
  }

  return (
    <Source data={selectionBoundsFeature} id='selection-bounds' type='geojson'>
      <Layer
        id='selection-bounds-outline'
        type='line'
        paint={{
          'line-color': '#2563EB',
          'line-width': 1.5,
          'line-dasharray': [2, 2],
          'line-opacity': 0.8,
        }}
      />
    </Source>
  )
}
