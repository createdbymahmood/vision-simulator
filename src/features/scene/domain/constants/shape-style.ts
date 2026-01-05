import type {ShapeDrawMode} from '@/features/scene/presentation/types'

import type {ShapeEntity} from '../types'

export const SHAPE_STROKE_COLOR = '#1A9FFF'
export const SHAPE_FILL_COLOR = 'rgba(26,159,255,0.15)'

export const createDefaultShape = (
  id: string,
  areaId: string,
  mode: ShapeDrawMode,
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

  switch (mode) {
    case 'rectangle':
      return {...base, shapeType: 'rectangle'}
    case 'circle':
      return {...base, shapeType: 'circle'}
    case 'triangle':
      return {...base, shapeType: 'triangle', points: geometry as any}
    case 'line':
    default:
      return {...base, shapeType: 'line', points: geometry as any}
  }
}
