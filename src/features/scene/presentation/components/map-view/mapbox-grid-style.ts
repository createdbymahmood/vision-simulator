import type {StyleSpecification} from 'mapbox-gl'

const getSpriteBaseUrl = () => {
  const baseUrl = import.meta.env.BASE_URL ?? '/'
  if (typeof window === 'undefined') {
    return `${baseUrl}mapbox/grid-sprite`
  }
  return new URL(
    `${baseUrl}mapbox/grid-sprite`,
    window.location.origin,
  ).toString()
}

export const getCanvasGridStyle = (): StyleSpecification => ({
  version: 8,
  name: 'canvas-grid',
  sprite: getSpriteBaseUrl(),
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
