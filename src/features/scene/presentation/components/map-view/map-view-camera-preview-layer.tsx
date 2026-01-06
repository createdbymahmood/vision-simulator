import React from 'react'
import {Layer, Source} from 'react-map-gl/mapbox'

import type {FeatureCollection, LineString, Point, Polygon} from 'geojson'

interface MapViewCameraPreviewLayerProps {
  previewPoint: FeatureCollection<Point>
  previewFov: FeatureCollection<Polygon>
  previewDirection: FeatureCollection<LineString>
  previewRange: FeatureCollection<LineString>
  isValid: boolean
}

export const MapViewCameraPreviewLayer: React.FC<
  MapViewCameraPreviewLayerProps
> = ({
  previewPoint,
  previewFov,
  previewDirection,
  previewRange,
  isValid,
}) => {
  const hasPreview = previewPoint.features.length > 0
  if (!hasPreview) {
    return null
  }

  const color = previewPoint.features[0]?.properties?.color ?? '#2563EB'
  const invalidColor = isValid ? color : '#EF4444'

  return (
    <>
      <Source data={previewRange} id='camera-preview-range' type='geojson'>
        <Layer
          id='camera-preview-range-line'
          type='line'
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
          paint={{
            'line-color': invalidColor,
            'line-width': 1.5,
            'line-opacity': 0.3,
            'line-dasharray': [12, 6],
          }}
        />
      </Source>

      <Source data={previewFov} id='camera-preview-fov' type='geojson'>
        <Layer
          id='camera-preview-fov-fill'
          type='fill'
          paint={{
            'fill-color': invalidColor,
            'fill-opacity': 0.15,
          }}
        />
        <Layer
          id='camera-preview-fov-outline'
          type='line'
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
          paint={{
            'line-color': invalidColor,
            'line-width': 2,
            'line-opacity': 0.8,
            'line-dasharray': [2, 2],
          }}
        />
      </Source>

      <Source data={previewDirection} id='camera-preview-direction' type='geojson'>
        <Layer
          id='camera-preview-direction-line'
          type='line'
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
          paint={{
            'line-color': invalidColor,
            'line-width': 2,
            'line-opacity': 0.8,
          }}
        />
      </Source>

      <Source data={previewPoint} id='camera-preview-point' type='geojson'>
        <Layer
          id='camera-preview-outline'
          type='circle'
          paint={{
            'circle-radius': 9,
            'circle-color': '#FFFFFF',
            'circle-stroke-color': '#111827',
            'circle-stroke-width': 2,
            'circle-opacity': 0.8,
          }}
        />
        <Layer
          id='camera-preview-icon'
          type='circle'
          paint={{
            'circle-radius': 6,
            'circle-color': invalidColor,
            'circle-opacity': 0.9,
          }}
        />
      </Source>
    </>
  )
}
