import type {StyleSpecification} from 'mapbox-gl'

export const getCanvasGridStyle = (): StyleSpecification => ({
  version: 8,
  name: 'canvas-grid',
  glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
  sources: {},
  layers: [
    {
      id: 'canvas-grid-background',
      type: 'background',
      paint: {
        'background-color': '#f8fafc',
        'background-pattern': ['step', ['zoom'], 'grid-32', 12, 'grid-16'],
      },
    },
  ],
})
