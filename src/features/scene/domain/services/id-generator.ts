export type EntityPrefix = 'area' | 'camera' | 'person' | 'shape' | 'wall'

export interface IdGenerator {
  nextId: (prefix: EntityPrefix) => string
  peekNext: (prefix: EntityPrefix) => string
  syncWithExisting: (id: string) => void
}

const extractSuffix = (id: string) => {
  const [, suffix] = id.split('-')
  const parsed = Number.parseInt(suffix ?? '', 10)
  return Number.isFinite(parsed) ? parsed : null
}

export const createIdGenerator = (
  initial?: Partial<Record<EntityPrefix, number>>,
): IdGenerator => {
  const counters: Record<EntityPrefix, number> = {
    area: initial?.area ?? 0,
    camera: initial?.camera ?? 0,
    person: initial?.person ?? 0,
    wall: initial?.wall ?? 0,
    shape: initial?.shape ?? 0,
  }

  const nextId = (prefix: EntityPrefix) => {
    counters[prefix] += 1
    return `${prefix}-${counters[prefix]}`
  }

  const peekNext = (prefix: EntityPrefix) => `${prefix}-${counters[prefix] + 1}`

  const syncWithExisting = (id: string) => {
    const [prefix] = id.split('-') as [string | EntityPrefix, string]
    if (!['area', 'camera', 'person', 'shape', 'wall'].includes(prefix)) {
      return
    }

    const suffix = extractSuffix(id)
    if (suffix === null) {
      return
    }

    counters[prefix as EntityPrefix] = Math.max(
      counters[prefix as EntityPrefix],
      suffix,
    )
  }

  return {nextId, peekNext, syncWithExisting}
}
