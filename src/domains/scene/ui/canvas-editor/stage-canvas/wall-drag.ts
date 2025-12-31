import type {Dispatch, MutableRefObject, SetStateAction} from 'react'

import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import {useRef} from 'react'

import type {Scene, SceneWall} from '../../../core/scene-types'
import type {CanvasPoint} from '../types'

interface WallDragSession {
  ids: string[]
  initial: Record<string, SceneWall['coordinates']>
  start: CanvasPoint
}

interface UseWallDragParams {
  scene: Scene
  snapValue: (value: number) => number
  getPointerScenePoint: () => CanvasPoint | null
  onUpdateWall: (id: string, patch: Partial<SceneWall>) => void
  onCaptureSnapshot: (scene: Scene) => void
  setIsManipulating: Dispatch<SetStateAction<boolean>>
  interactionCapturedRef: MutableRefObject<boolean>
}

export const useWallDrag = ({
  scene,
  snapValue,
  getPointerScenePoint,
  onUpdateWall,
  onCaptureSnapshot,
  setIsManipulating,
  interactionCapturedRef,
}: UseWallDragParams) => {
  const wallDragSession = useRef<WallDragSession | null>(null)

  const wallSharesEndpoint = useCallbackRef(
    (a: SceneWall, b: SceneWall): boolean => {
      const aPoints = [
        {x: a.coordinates.x1, y: a.coordinates.y1},
        {x: a.coordinates.x2, y: a.coordinates.y2},
      ]
      const bPoints = [
        {x: b.coordinates.x1, y: b.coordinates.y1},
        {x: b.coordinates.x2, y: b.coordinates.y2},
      ]
      return aPoints.some((aPt) =>
        bPoints.some(
          (bPt) =>
            Math.abs(aPt.x - bPt.x) < 0.001 && Math.abs(aPt.y - bPt.y) < 0.001,
        ),
      )
    },
  )

  const findConnectedWallIds = useCallbackRef(
    (startId: string, walls: SceneWall[]): string[] => {
      const startWall = walls.find((wall) => wall.id === startId)
      if (!startWall) {
        return [startId]
      }
      const visited = new Set<string>([startId])
      const queue: SceneWall[] = [startWall]

      while (queue.length) {
        const current = queue.shift()
        if (!current) {
          continue
        }
        walls.forEach((wall) => {
          if (visited.has(wall.id)) {
            return
          }
          if (wallSharesEndpoint(current, wall)) {
            visited.add(wall.id)
            queue.push(wall)
          }
        })
      }

      return Array.from(visited)
    },
  )

  const computeWallSession = useCallbackRef(
    (wallId: string, start: CanvasPoint): WallDragSession => {
      const ids = findConnectedWallIds(wallId, scene.walls)
      const initial = ids.reduce<Record<string, SceneWall['coordinates']>>(
        (acc, id) => {
          const target = scene.walls.find((w) => w.id === id)
          if (target) {
            acc[id] = target.coordinates
          }
          return acc
        },
        {},
      )
      return {ids, initial, start}
    },
  )

  const applyWallDelta = useCallbackRef((delta: CanvasPoint) => {
    const session = wallDragSession.current
    if (!session) {
      return
    }
    session.ids.forEach((id) => {
      const coords = session.initial[id]
      if (!coords) {
        return
      }
      const next = {
        x1: snapValue(coords.x1 + delta.x),
        y1: snapValue(coords.y1 + delta.y),
        x2: snapValue(coords.x2 + delta.x),
        y2: snapValue(coords.y2 + delta.y),
      }
      onUpdateWall(id, {coordinates: next})
    })
  })

  const beginWallDrag = useCallbackRef((wallId: string) => {
    const pointer = getPointerScenePoint()
    if (!pointer) {
      return
    }
    if (!interactionCapturedRef.current) {
      onCaptureSnapshot(scene)
      interactionCapturedRef.current = true
    }
    wallDragSession.current = computeWallSession(wallId, pointer)
    setIsManipulating(true)
  })

  const updateWallDrag = useCallbackRef((wallId: string) => {
    const pointer = getPointerScenePoint()
    if (!pointer) {
      return
    }
    const session =
      wallDragSession.current ?? computeWallSession(wallId, pointer)
    const deltaFromStart = {
      x: pointer.x - session.start.x,
      y: pointer.y - session.start.y,
    }
    wallDragSession.current = session
    applyWallDelta(deltaFromStart)
  })

  const finishWallDrag = useCallbackRef((wallId: string) => {
    const pointer = getPointerScenePoint()
    if (!pointer) {
      wallDragSession.current = null
      interactionCapturedRef.current = false
      setIsManipulating(false)
      return
    }
    const session =
      wallDragSession.current ?? computeWallSession(wallId, pointer)
    const deltaFromStart = {
      x: pointer.x - session.start.x,
      y: pointer.y - session.start.y,
    }
    applyWallDelta(deltaFromStart)
    wallDragSession.current = null
    interactionCapturedRef.current = false
    setIsManipulating(false)
  })

  return {beginWallDrag, updateWallDrag, finishWallDrag}
}
