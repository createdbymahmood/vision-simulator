import type {FeatureCollection} from 'geojson'

import React from 'react'
import {Layer, Source} from 'react-map-gl/mapbox'

import {
  SHAPE_FILL_COLOR,
  SHAPE_STROKE_COLOR,
} from '@/features/scene/constants/shape-style'

interface MapViewShapeLayersProps {
  shapeFeatures: FeatureCollection
  shapePreviewFeature: FeatureCollection | null
}

const DEFAULT_LINE_SHAPE_THICKNESS = 0.1
const LINE_WIDTH_SCALE = 8
const SELECTED_LINE_WIDTH_SCALE = 10

export const MapViewShapeLayers: React.FC<MapViewShapeLayersProps> = ({
  shapeFeatures,
  shapePreviewFeature,
}) => {
  const hasShapes = shapeFeatures.features.length > 0
  const baseLineThickness = [
    'coalesce',
    ['get', 'thickness'],
    DEFAULT_LINE_SHAPE_THICKNESS,
  ]

  return (
    <>
      {hasShapes ? (
        <Source data={shapeFeatures} id='shapes' type='geojson' promoteId='id'>
          <Layer
            filter={['==', ['geometry-type'], 'Polygon']}
            id='shape-fill'
            type='fill'
            paint={{
              'fill-color': [
                'case',
                ['boolean', ['feature-state', 'selected'], false],
                '#DDEEFF',
                ['coalesce', ['get', 'color'], SHAPE_FILL_COLOR],
              ],
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.3,
                ['boolean', ['feature-state', 'selected'], false],
                0.25,
                0.2,
              ],
            }}
          />
          <Layer
            filter={['==', ['geometry-type'], 'Polygon']}
            id='shape-outline'
            type='line'
            paint={{
              'line-color': [
                'case',
                ['boolean', ['feature-state', 'selected'], false],
                '#2563EB',
                ['coalesce', ['get', 'color'], SHAPE_STROKE_COLOR],
              ],
              'line-width': [
                'case',
                ['boolean', ['feature-state', 'selected'], false],
                3,
                2,
              ],
              'line-dasharray': [3, 2],
            }}
          />
          <Layer
            filter={['==', ['geometry-type'], 'LineString']}
            id='shape-line'
            type='line'
            paint={{
              'line-color': [
                'case',
                ['boolean', ['feature-state', 'selected'], false],
                '#2563EB',
                ['coalesce', ['get', 'color'], SHAPE_STROKE_COLOR],
              ],
              'line-width': [
                'case',
                ['boolean', ['feature-state', 'selected'], false],
                ['*', baseLineThickness, SELECTED_LINE_WIDTH_SCALE],
                ['*', baseLineThickness, LINE_WIDTH_SCALE],
              ],
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
