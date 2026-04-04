export type HistoryEntity =
  | 'area'
  | 'camera'
  | 'map style'
  | 'person'
  | 'selection'
  | 'shape'
  | 'wall'

export type HistoryTransform = 'move' | 'resize' | 'rotate'

export type HistoryAction =
  | {type: 'add'; entity: HistoryEntity}
  | {type: 'clear'}
  | {type: 'delete'; entity: HistoryEntity; count?: number}
  | {type: 'map-visibility'; visible: boolean}
  | {
      type: 'transform'
      transform: HistoryTransform
      entity?: HistoryEntity
      count?: number
    }
  | {type: 'update'; entity: HistoryEntity}

const capitalize = (value: string) =>
  value.length === 0 ? value : `${value[0]?.toUpperCase()}${value.slice(1)}`

const formatEntityLabel = (entity: HistoryEntity, count?: number) => {
  if (entity === 'selection') {
    return 'Selection'
  }

  if (entity === 'map style') {
    return 'Map Style'
  }

  if (entity === 'person') {
    return count && count > 1 ? 'People' : 'Person'
  }

  const label = capitalize(entity)
  if (!count || count <= 1) {
    return label
  }
  return `${label}s`
}

const formatTransformLabel = (transform: HistoryTransform) =>
  capitalize(transform)

export const describeHistoryAction = (action: HistoryAction): string => {
  switch (action.type) {
    case 'add':
      return `Add ${formatEntityLabel(action.entity)}`
    case 'update':
      return `Update ${formatEntityLabel(action.entity)}`
    case 'delete':
      return `Delete ${formatEntityLabel(action.entity, action.count)}`
    case 'transform': {
      const label = action.entity
        ? formatEntityLabel(action.entity, action.count)
        : 'Selection'
      return `${formatTransformLabel(action.transform)} ${label}`
    }
    case 'map-visibility':
      return action.visible ? 'Show Map' : 'Hide Map'
    case 'clear':
      return 'Clear Board'
    default:
      return 'Update Scene'
  }
}
