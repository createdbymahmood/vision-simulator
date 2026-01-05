import type {FeatureCollection} from 'geojson'

import React from 'react'
import {Layer, Source} from 'react-map-gl/mapbox'

import {
  SHAPE_FILL_COLOR,
  SHAPE_STROKE_COLOR,
} from '@/features/scene/domain/constants/shape-style'

interface MapViewShapeLayersProps {
  shapeFeatures: FeatureCollection
  shapePreviewFeature: FeatureCollection | null
}

export const MapViewShapeLayers: React.FC<MapViewShapeLayersProps> = ({
  shapeFeatures,
  shapePreviewFeature,
}) => {
  const hasShapes = shapeFeatures.features.length > 0

  return (
    <>
      {hasShapes ? (
        <Source data={shapeFeatures} id='shapes' type='geojson'>
          <Layer
            filter={['==', ['geometry-type'], 'Polygon']}
            id='shape-fill'
            type='fill'
            paint={{
              'fill-color': SHAPE_FILL_COLOR,
              'fill-opacity': 0.4,
            }}
          />
          <Layer
            filter={['==', ['geometry-type'], 'Polygon']}
            id='shape-outline'
            type='line'
            paint={{
              'line-color': ['coalesce', ['get', 'color'], SHAPE_STROKE_COLOR],
              'line-width': 2,
              'line-dasharray': [3, 2],
            }}
          />
          <Layer
            filter={['==', ['geometry-type'], 'LineString']}
            id='shape-line'
            type='line'
            paint={{
              'line-color': ['coalesce', ['get', 'color'], SHAPE_STROKE_COLOR],
              'line-width': 3,
            }}
          />
        </Source>
      ) : null}

      {shapePreviewFeature ? (
        <Source data={shapePreviewFeature} id='shape-preview' type='geojson'>
          <Layer
            filter={['==', ['geometry-type'], 'Polygon']}
            id='shape-preview-fill'
            type='fill'
            paint={{
              'fill-color': SHAPE_FILL_COLOR,
              'fill-opacity': 0.2,
            }}
          />
          <Layer
            filter={['==', ['geometry-type'], 'Polygon']}
            id='shape-preview-outline'
            type='line'
            paint={{
              'line-color': SHAPE_STROKE_COLOR,
              'line-dasharray': [2, 2],
              'line-width': 2,
            }}
          />
          <Layer
            filter={['==', ['geometry-type'], 'LineString']}
            id='shape-preview-line'
            type='line'
            paint={{
              'line-color': SHAPE_STROKE_COLOR,
              'line-dasharray': [2, 2],
              'line-width': 3,
            }}
          />
        </Source>
      ) : null}
    </>
  )
}
