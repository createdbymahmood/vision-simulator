import type {Dispatch, MutableRefObject, SetStateAction} from 'react'

import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import {useRef} from 'react'

import type {
  Scene,
  SceneArea,
  SceneCamera,
  SceneEntityKind,
  ScenePerson,
  SceneShape,
  SceneWall,
} from '../../../core/scene-types'
import type {CanvasPoint} from '../types'

type MultiDragItem =
  | {id: string; kind: 'area'; initial: {lat: number; lng: number}[]}
  | {id: string; kind: 'camera' | 'person' | 'shape'; initial: CanvasPoint}
  | {id: string; kind: 'wall'; initial: SceneWall['coordinates']}

interface MultiDragSession {
  start: CanvasPoint
  items: MultiDragItem[]
}

interface UseMultiDragParams {
  scene: Scene
  selection: {
    selectedEntities: {id: string; kind: SceneEntityKind}[]
    selectedEntityId: string | null
    selectedEntityKind: SceneEntityKind | null
  }
  snapValue: (value: number) => number
  onUpdateWall: (id: string, patch: Partial<SceneWall>) => void
  onUpdateShape: (id: string, patch: Partial<SceneShape>) => void
  onUpdateCamera: (id: string, patch: Partial<SceneCamera>) => void
  onUpdatePerson: (id: string, patch: Partial<ScenePerson>) => void
  onUpdateArea: (id: string, patch: Partial<SceneArea>) => void
  onCaptureSnapshot: (scene: Scene) => void
  interactionCapturedRef: MutableRefObject<boolean>
  setIsManipulating: Dispatch<SetStateAction<boolean>>
}

// eslint-disable-next-line max-lines-per-function
export const useMultiDrag = ({
  scene,
  selection,
  snapValue,
  onUpdateWall,
  onUpdateShape,
  onUpdateCamera,
  onUpdatePerson,
  onUpdateArea,
  onCaptureSnapshot,
  interactionCapturedRef,
  setIsManipulating,
}: UseMultiDragParams) => {
  const multiDragSession = useRef<MultiDragSession | null>(null)

  const applyMultiDragDelta = useCallbackRef((delta: CanvasPoint) => {
    const session = multiDragSession.current
    if (!session) return

    session.items.forEach((item) => {
      switch (item.kind) {
        case 'wall': {
          const nextCoords = {
            x1: snapValue(item.initial.x1 + delta.x),
            y1: snapValue(item.initial.y1 + delta.y),
            x2: snapValue(item.initial.x2 + delta.x),
            y2: snapValue(item.initial.y2 + delta.y),
          }
          onUpdateWall(item.id, {coordinates: nextCoords})
          break
        }
        case 'shape': {
          onUpdateShape(item.id, {
            x: snapValue(item.initial.x + delta.x),
            y: snapValue(item.initial.y + delta.y),
          })
          break
        }
        case 'camera': {
          onUpdateCamera(item.id, {
            x: snapValue(item.initial.x + delta.x),
            y: snapValue(item.initial.y + delta.y),
          })
          break
        }
        case 'person': {
          onUpdatePerson(item.id, {
            x: snapValue(item.initial.x + delta.x),
            y: snapValue(item.initial.y + delta.y),
          })
          break
        }
        case 'area': {
          const geometry = item.initial.map((point) => ({
            lat: snapValue(point.lat + delta.y),
            lng: snapValue(point.lng + delta.x),
          }))
          onUpdateArea(item.id, {geometry})
          break
        }
        default:
          break
      }
    })
  })

  const beginMultiDrag = useCallbackRef((start: CanvasPoint) => {
    const selected = selection.selectedEntities.length
      ? selection.selectedEntities
      : selection.selectedEntityId && selection.selectedEntityKind
        ? [{id: selection.selectedEntityId, kind: selection.selectedEntityKind}]
        : []
    if (!selected.length) {
      return false
    }
    if (!interactionCapturedRef.current) {
      onCaptureSnapshot(scene)
      interactionCapturedRef.current = true
    }
    const items = selected
      .map((entry) => {
        switch (entry.kind) {
          case 'wall': {
            const wall = scene.walls.find((w) => w.id === entry.id)
            if (!wall) return null
            return {id: entry.id, kind: 'wall', initial: wall.coordinates}
          }
          case 'shape': {
            const shape = scene.shapes.find((s) => s.id === entry.id)
            if (!shape) return null
            return {
              id: entry.id,
              kind: 'shape',
              initial: {x: shape.x, y: shape.y},
            }
          }
          case 'camera': {
            const camera = scene.cameras.find((c) => c.id === entry.id)
            if (!camera) return null
            return {
              id: entry.id,
              kind: 'camera',
              initial: {x: camera.x, y: camera.y},
            }
          }
          case 'person': {
            const person = scene.people.find((p) => p.id === entry.id)
            if (!person) return null
            return {
              id: entry.id,
              kind: 'person',
              initial: {x: person.x, y: person.y},
            }
          }
          case 'area': {
            const area = scene.areas.find((a) => a.id === entry.id)
            if (!area) return null
            return {id: entry.id, kind: 'area', initial: area.geometry}
          }
          default:
            return null
        }
      })
      .filter(Boolean) as MultiDragItem[]

    if (!items.length) {
      return false
    }

    multiDragSession.current = {start, items}
    setIsManipulating(true)
    return true
  })

  const updateMultiDragFromPointer = useCallbackRef(
    (pointer: CanvasPoint | null) => {
      if (!multiDragSession.current || !pointer) {
        return false
      }
      const delta = {
        x: pointer.x - multiDragSession.current.start.x,
        y: pointer.y - multiDragSession.current.start.y,
      }
      applyMultiDragDelta(delta)
      return true
    },
  )

  const finishMultiDrag = useCallbackRef(() => {
    if (!multiDragSession.current) {
      return false
    }
    multiDragSession.current = null
    interactionCapturedRef.current = false
    setIsManipulating(false)
    return true
  })

  return {
    beginMultiDrag,
    finishMultiDrag,
    isMultiDragging: Boolean(multiDragSession.current),
    updateMultiDragFromPointer,
  }
}
