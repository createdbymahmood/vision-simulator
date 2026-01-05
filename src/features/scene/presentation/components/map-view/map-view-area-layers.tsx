import type {FeatureCollection} from 'geojson'

import React from 'react'
import {Layer, Source} from 'react-map-gl/mapbox'

interface MapViewAreaLayersProps {
  areaFeatures: FeatureCollection
  overlapFeatures: FeatureCollection | null
  drawingLine: FeatureCollection | null
  drawingPoints: FeatureCollection | null
  drawingColor: string
}

export const MapViewAreaLayers: React.FC<MapViewAreaLayersProps> = ({
  areaFeatures,
  overlapFeatures,
  drawingLine,
  drawingPoints,
  drawingColor,
}) => {
  return (
    <>
      <Source data={areaFeatures} id='areas' type='geojson' promoteId='id'>
        <Layer
          id='area-fill'
          type='fill'
          paint={{
            'fill-color': ['get', 'color'],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              ['+', ['get', 'opacity'], 0.14],
              ['boolean', ['feature-state', 'selected'], false],
              ['+', ['get', 'opacity'], 0.1],
              ['boolean', ['get', 'isActive'], false],
              ['+', ['get', 'opacity'], 0.12],
              ['get', 'opacity'],
            ],
          }}
        />
        <Layer
          id='area-outline'
          type='line'
          paint={{
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'constraint'], false],
              '#EF4444',
              ['boolean', ['feature-state', 'selected'], false],
              '#2563EB',
              ['get', 'borderColor'],
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              4,
              ['boolean', ['get', 'isActive'], false],
              4,
              2,
            ],
          }}
        />
        <Layer
          id='area-selection-glow'
          type='line'
          paint={{
            'line-color': '#2563EB',
            'line-width': 8,
            'line-opacity': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              0.25,
              0,
            ],
            'line-blur': 1.5,
          }}
        />
      </Source>

      {overlapFeatures && overlapFeatures.features.length > 0 ? (
        <Source data={overlapFeatures} id='area-overlaps' type='geojson'>
          <Layer
            id='overlap-fill'
            type='fill'
            paint={{
              'fill-color': '#000000',
              'fill-opacity': 0.08,
            }}
          />
          <Layer
            id='overlap-lines'
            type='line'
            paint={{
              'line-color': '#000000',
              'line-width': 1,
              'line-dasharray': [2, 2],
              'line-opacity': 0.4,
            }}
          />
        </Source>
      ) : null}

      {drawingLine ? (
        <Source data={drawingLine} id='drawing-line' type='geojson'>
          <Layer
            id='drawing-outline'
            type='line'
            paint={{
              'line-color': drawingColor,
              'line-width': 2,
              'line-opacity': 0.8,
            }}
          />
        </Source>
      ) : null}

      {drawingPoints ? (
        <Source data={drawingPoints} id='drawing-points' type='geojson'>
          <Layer
            id='drawing-point-layer'
            type='circle'
            paint={{
              'circle-radius': ['case', ['==', ['get', 'role'], 'first'], 6, 5],
              'circle-color': '#FFFFFF',
              'circle-stroke-color': drawingColor,
              'circle-stroke-width': 2,
              'circle-blur': 0.2,
            }}
          />
        </Source>
      ) : null}
    </>
  )
}
