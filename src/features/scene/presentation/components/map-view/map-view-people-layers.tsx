import type {FeatureCollection, Point} from 'geojson'

import React from 'react'
import {Layer, Source} from 'react-map-gl/mapbox'

interface MapViewPeopleLayersProps {
  personFeatures: FeatureCollection<Point>
}

export const MapViewPeopleLayers: React.FC<MapViewPeopleLayersProps> = ({
  personFeatures,
}) => {
  if (personFeatures.features.length === 0) {
    return null
  }

  return (
    <Source data={personFeatures} id='people' promoteId='id' type='geojson'>
      <Layer
        id='people-outline'
        type='circle'
        paint={{
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'pulse'], false],
            11,
            8,
          ],
          'circle-color': '#FFFFFF',
          'circle-stroke-color': '#0EA5E9',
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
        id='people-fill'
        type='circle'
        paint={{
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'pulse'], false],
            8,
            5,
          ],
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#2563EB',
            '#0EA5E9',
          ],
          'circle-opacity': 0.9,
        }}
      />
    </Source>
  )
}
