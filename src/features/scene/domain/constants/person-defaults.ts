import type {GeoPoint, PersonEntity} from '../types'

export const DEFAULT_PERSON_RADIUS = 0.3
export const DEFAULT_PERSON_HEIGHT = 1.7
export const DEFAULT_PERSON_SPEED = 1.2

export const createDefaultPerson = (
  areaId: string,
  position: GeoPoint,
  id: string,
): PersonEntity => ({
  id,
  type: 'person',
  name: `Person ${id.split('-')[1] ?? id}`,
  areaId,
  x: position[0],
  y: position[1],
  height: DEFAULT_PERSON_HEIGHT,
  speed: DEFAULT_PERSON_SPEED,
})
