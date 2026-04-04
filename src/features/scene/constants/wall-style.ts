import type {WallEntity} from '@/features/scene/types/types'

export const DEFAULT_WALL_COLOR = '#E63946'
export const DEFAULT_WALL_THICKNESS = 0.2

export const createDefaultWall = (
  areaId: string,
  points: WallEntity['points'],
  id: string,
): WallEntity => ({
  id,
  type: 'wall',
  areaId,
  points,
  thickness: DEFAULT_WALL_THICKNESS,
  height: 3,
  color: DEFAULT_WALL_COLOR,
})
