import type {FeatureCollection, Point, Polygon} from 'geojson'

import React from 'react'
import {Layer, Source} from 'react-map-gl/mapbox'

interface MapViewPersonPreviewLayerProps {
  circle: FeatureCollection<Polygon>
  point: FeatureCollection<Point>
  isValid: boolean
}

export const MapViewPersonPreviewLayer: React.FC<
  MapViewPersonPreviewLayerProps
> = ({circle, point, isValid}) => {
  const color = isValid ? '#4ECDC4' : '#EF4444'

  return (
    <>
      <Source data={circle} id='person-preview-circle' type='geojson'>
        <Layer
          id='person-preview-fill'
          type='fill'
          paint={{
            'fill-color': ['coalesce', ['get', 'color'], color],
            'fill-opacity': 0.3,
          }}
        />
        <Layer
          id='person-preview-outline'
          type='line'
          paint={{
            'line-color': ['coalesce', ['get', 'color'], color],
            'line-width': 2,
            'line-opacity': 0.6,
            'line-dasharray': isValid ? [1, 0] : [2, 2],
          }}
        />
      </Source>

      <Source data={point} id='person-preview-point' type='geojson'>
        <Layer
          id='person-preview-point-outline'
          type='circle'
          paint={{
            'circle-radius': 8,
            'circle-color': '#FFFFFF',
            'circle-stroke-color': ['coalesce', ['get', 'color'], color],
            'circle-stroke-width': 2,
            'circle-opacity': 0.85,
          }}
        />
        <Layer
          id='person-preview-point-fill'
          type='circle'
          paint={{
            'circle-radius': 5,
            'circle-color': ['coalesce', ['get', 'color'], color],
            'circle-opacity': 0.9,
          }}
        />
      </Source>
    </>
  )
}
