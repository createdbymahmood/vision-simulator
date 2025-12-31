import type {Scene, SceneEntityKind} from '../../../core/scene-types'

export interface SelectionCandidate {
  id: string
  kind: SceneEntityKind
  bounds: {minX: number; maxX: number; minY: number; maxY: number}
}

export const buildSelectionCandidates = (
  scene: Scene,
): SelectionCandidate[] => {
  const candidates: SelectionCandidate[] = []

  scene.walls.forEach((wall) => {
    const minX = Math.min(wall.coordinates.x1, wall.coordinates.x2)
    const maxX = Math.max(wall.coordinates.x1, wall.coordinates.x2)
    const minY = Math.min(wall.coordinates.y1, wall.coordinates.y2)
    const maxY = Math.max(wall.coordinates.y1, wall.coordinates.y2)
    candidates.push({
      id: wall.id,
      kind: 'wall',
      bounds: {minX, maxX, minY, maxY},
    })
  })

  scene.shapes.forEach((shape) => {
    candidates.push({
      id: shape.id,
      kind: 'shape',
      bounds: {
        minX: shape.x,
        maxX: shape.x + shape.width,
        minY: shape.y,
        maxY: shape.y + shape.length,
      },
    })
  })

  scene.cameras.forEach((camera) => {
    const half = 0.45
    candidates.push({
      id: camera.id,
      kind: 'camera',
      bounds: {
        minX: camera.x - half,
        maxX: camera.x + half,
        minY: camera.y - half,
        maxY: camera.y + half,
      },
    })
  })

  scene.people.forEach((person) => {
    const r = Math.max(person.radius, 0.3)
    candidates.push({
      id: person.id,
      kind: 'person',
      bounds: {
        minX: person.x - r,
        maxX: person.x + r,
        minY: person.y - r,
        maxY: person.y + r,
      },
    })
  })

  scene.areas.forEach((area) => {
    if (!area.geometry.length) return
    const xs = area.geometry.map((p) => p.lng)
    const ys = area.geometry.map((p) => p.lat)
    candidates.push({
      id: area.id,
      kind: 'area',
      bounds: {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      },
    })
  })

  return candidates
}

export const rectIntersects = (
  a: {minX: number; maxX: number; minY: number; maxY: number},
  b: {minX: number; maxX: number; minY: number; maxY: number},
) =>
  a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY

export const computeSelectionBounds = (
  selection: {
    selectedEntities: {id: string; kind: SceneEntityKind}[]
    selectedEntityId: string | null
    selectedEntityKind: SceneEntityKind | null
  },
  candidates: SelectionCandidate[],
) => {
  const selected = selection.selectedEntities.length
    ? selection.selectedEntities
    : selection.selectedEntityId && selection.selectedEntityKind
      ? [{id: selection.selectedEntityId, kind: selection.selectedEntityKind}]
      : []
  if (!selected.length) {
    return null
  }
  const bounds = selected
    .map((entry) =>
      candidates.find(
        (candidate) =>
          candidate.id === entry.id && candidate.kind === entry.kind,
      ),
    )
    .filter(Boolean) as SelectionCandidate[]
  if (!bounds.length) {
    return null
  }
  const minX = Math.min(...bounds.map((b) => b.bounds.minX))
  const maxX = Math.max(...bounds.map((b) => b.bounds.maxX))
  const minY = Math.min(...bounds.map((b) => b.bounds.minY))
  const maxY = Math.max(...bounds.map((b) => b.bounds.maxY))
  return {minX, maxX, minY, maxY}
}
