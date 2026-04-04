import type {FeatureCollection, Point} from 'geojson'

import React from 'react'
import {Layer, Source} from 'react-map-gl/mapbox'

interface MapViewSelectionHandlesLayerProps {
  handleFeatures: FeatureCollection<Point> | null
  mapLoaded: boolean
}

export const MapViewSelectionHandlesLayer: React.FC<
  MapViewSelectionHandlesLayerProps
> = ({handleFeatures, mapLoaded}) => {
  if (!mapLoaded || !handleFeatures) {
    return null
  }

  return (
    <Source data={handleFeatures} id='selection-handles' type='geojson'>
      <Layer
        filter={['==', ['get', 'role'], 'corner']}
        id='selection-handles-corner'
        type='symbol'
        layout={{
          'icon-image': 'handle-square',
          'icon-size': 1,
          'icon-allow-overlap': true,
        }}
      />
      <Layer
        filter={['==', ['get', 'role'], 'edge']}
        id='selection-handles-edge'
        type='circle'
        paint={{
          'circle-radius': 6,
          'circle-color': '#FFFFFF',
          'circle-stroke-color': '#2563EB',
          'circle-stroke-width': 2,
        }}
      />
      <Layer
        filter={['==', ['get', 'handleType'], 'rotate']}
        id='selection-rotation-handle'
        type='circle'
        paint={{
          'circle-radius': 5,
          'circle-color': '#FFFFFF',
          'circle-stroke-color': '#2563EB',
          'circle-stroke-width': 2,
        }}
      />
    </Source>
  )
}
