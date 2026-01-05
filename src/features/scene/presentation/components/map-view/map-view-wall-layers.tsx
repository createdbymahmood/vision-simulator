import type {FeatureCollection} from 'geojson'

import React from 'react'
import {Layer, Source} from 'react-map-gl/mapbox'

import {
  DEFAULT_WALL_COLOR,
  DEFAULT_WALL_THICKNESS,
} from '@/features/scene/domain/constants/wall-style'

interface MapViewWallLayersProps {
  wallFeatures: FeatureCollection
  wallVertexFeatures: FeatureCollection
  wallPreviewFeature: FeatureCollection | null
}

export const MapViewWallLayers: React.FC<MapViewWallLayersProps> = ({
  wallFeatures,
  wallVertexFeatures,
  wallPreviewFeature,
}) => {
  const hasWalls = wallFeatures.features.length > 0

  return (
    <>
      {hasWalls ? (
        <Source data={wallFeatures} id='walls' type='geojson'>
          <Layer
            id='wall-lines'
            type='line'
            layout={{
              'line-cap': 'round',
              'line-join': 'round',
            }}
            paint={{
              'line-color': ['coalesce', ['get', 'color'], DEFAULT_WALL_COLOR],
              'line-width': [
                '*',
                ['coalesce', ['get', 'thickness'], DEFAULT_WALL_THICKNESS],
                8,
              ],
              'line-opacity': 1,
            }}
          />
        </Source>
      ) : null}

      {wallVertexFeatures.features.length > 0 ? (
        <Source data={wallVertexFeatures} id='wall-vertices' type='geojson'>
          <Layer
            id='wall-vertices'
            type='circle'
            paint={{
              'circle-radius': 4,
              'circle-color': '#ffffff',
              'circle-stroke-color': [
                'coalesce',
                ['get', 'color'],
                DEFAULT_WALL_COLOR,
              ],
              'circle-stroke-width': 2,
            }}
          />
        </Source>
      ) : null}

      {wallPreviewFeature ? (
        <Source data={wallPreviewFeature} id='wall-preview' type='geojson'>
          <Layer
            id='wall-preview-line'
            type='line'
            layout={{
              'line-cap': 'round',
              'line-join': 'round',
            }}
            paint={{
              'line-color': DEFAULT_WALL_COLOR,
              'line-width': [
                '*',
                ['coalesce', ['get', 'thickness'], DEFAULT_WALL_THICKNESS],
                8,
              ],
              'line-opacity': 0.6,
            }}
          />
        </Source>
      ) : null}
    </>
  )
}
