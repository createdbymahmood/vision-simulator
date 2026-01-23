import type {ShapeEntity} from '../types'

export const SHAPE_STROKE_COLOR = '#1A9FFF'
export const SHAPE_FILL_COLOR = 'rgba(26,159,255,0.15)'

export const createDefaultShape = (
  id: string,
  areaId: string,
  mode: ShapeEntity['shapeType'],
  geometry: ShapeEntity['geometry'],
): ShapeEntity => {
  const base = {
    id,
    type: 'shape' as const,
    areaId,
    geometry,
    height: 0,
    color: SHAPE_STROKE_COLOR,
  }

  if (mode === 'rectangle') {
    return {...base, shapeType: 'rectangle'}
  }

  if (mode === 'circle') {
    return {...base, shapeType: 'circle'}
  }

  if (mode === 'triangle') {
    return {
      ...base,
      shapeType: 'triangle',
      points: geometry as [
        (typeof geometry)[number],
        (typeof geometry)[number],
        (typeof geometry)[number],
      ],
    }
  }

  return {
    ...base,
    shapeType: 'line',
    points: geometry as [(typeof geometry)[number], (typeof geometry)[number]],
  }
}
