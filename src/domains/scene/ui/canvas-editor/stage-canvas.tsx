import type Konva from 'konva'
import type {KonvaEventObject} from 'konva/lib/Node'
import type React from 'react'

import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import {useEffect, useMemo, useRef, useState} from 'react'
import {Layer, Stage} from 'react-konva'

import {cn} from '@/lib/utils'

import type {
  Scene,
  SceneCamera,
  SceneEntityKind,
  ScenePerson,
  SceneShape,
  SceneShapeKind,
  SceneTool,
  SceneWall,
} from '../../core/scene-types'
import type {
  CanvasMeasurement,
  CanvasPoint,
  CanvasSize,
  DrawingShapeState,
  DrawingWallState,
} from './types'

import {
  DEFAULT_PREVIEW_COLOR,
  DEFAULT_WALL_COLOR,
  MAX_SCALE,
  MIN_SCALE,
} from './constants'
import {CanvasGrid} from './grid'
import {MeasurementOverlay} from './measurement-overlay'
import {
  AreaNode,
  CameraNode,
  DrawingPreviewLine,
  PersonNode,
  ShapeNode,
  WallSegment,
} from './nodes'
import {
  angleBetween,
  lengthBetween,
  pointFromStage,
  snapPoint,
  toCanvas,
} from './utils'
/* eslint-disable max-statements, complexity, @typescript-eslint/no-empty-function */

interface CanvasStageProps {
  size: CanvasSize
  offset: CanvasPoint
  scale: number
  snapEnabled: boolean
  editMode: boolean
  shapeTool: SceneShapeKind
  scene: Scene
  selection: {
    selectedEntityId: string | null
    selectedEntityKind: SceneEntityKind | null
  }
  activeTool: SceneTool
  onOffsetChange: (point: CanvasPoint) => void
  onScaleChange: (scale: number) => void
  onCaptureSnapshot: (scene: Scene) => void
  onAddWall: (wall: SceneWall) => void
  onAddShape: (shape: SceneShape) => void
  onUpdateShape: (id: string, patch: Partial<SceneShape>) => void
  onUpdateWall: (id: string, patch: Partial<SceneWall>) => void
  onUpdateCamera: (id: string, patch: Partial<SceneCamera>) => void
  onUpdatePerson: (id: string, patch: Partial<ScenePerson>) => void
  onAddCamera: (camera: SceneCamera) => void
  onAddPerson: (person: ScenePerson) => void
  onSelectEntity: (payload: {id: string; kind: SceneEntityKind} | null) => void
  onCloseOverlays: () => void
}

interface WallDragSession {
  ids: string[]
  initial: Record<string, SceneWall['coordinates']>
  start: CanvasPoint
}

// eslint-disable-next-line max-lines-per-function
export const CanvasStage: React.FC<CanvasStageProps> = ({
  size,
  offset,
  scale,
  snapEnabled,
  editMode,
  shapeTool,
  scene,
  selection,
  activeTool,
  onOffsetChange,
  onScaleChange,
  onCaptureSnapshot,
  onAddWall,
  onAddShape,
  onUpdateShape,
  onUpdateWall,
  onUpdateCamera,
  onUpdatePerson,
  onAddCamera,
  onAddPerson,
  onSelectEntity,
  onCloseOverlays,
}: CanvasStageProps) => {
  const canEdit = editMode
  const stageRef = useRef<Konva.Stage | null>(null)
  const [drawingWall, setDrawingWall] = useState<DrawingWallState | null>(null)
  const [drawingShape, setDrawingShape] = useState<DrawingShapeState | null>(
    null,
  )
  const [measurement, setMeasurement] = useState<CanvasMeasurement | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const wallDragSession = useRef<WallDragSession | null>(null)
  const [isManipulating, setIsManipulating] = useState(false)
  const interactionCapturedRef = useRef(false)
  const isPanTool = activeTool === 'pan'

  useEffect(() => {
    if (size.width && size.height) {
      onOffsetChange({
        x: size.width / 2,
        y: size.height / 2,
      })
    }
  }, [onOffsetChange, size.height, size.width])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setIsPanning(true)
      }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setIsPanning(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const cursor = useMemo(() => {
    if (!editMode) {
      return 'not-allowed'
    }
    if (activeTool === 'wall' || activeTool === 'shape') {
      return 'crosshair'
    }
    if (isPanTool) {
      return isPanning ? 'grabbing' : 'grab'
    }
    return 'default'
  }, [activeTool, editMode, isPanning, isPanTool])

  const handleZoom = useCallbackRef((event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) {
      return
    }

    const direction = event.evt.deltaY > 0 ? -1 : 1
    const zoomAmount = 0.1 * direction
    const newScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, scale + zoomAmount),
    )

    const pointer = stage.getPointerPosition()
    if (!pointer) {
      onScaleChange(newScale)
      return
    }

    const mousePointTo = {
      x: (pointer.x - offset.x) / scale,
      y: (pointer.y - offset.y) / scale,
    }

    onScaleChange(newScale)
    onOffsetChange({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
  })

  const handleDragMove = useCallbackRef(
    (event: KonvaEventObject<DragEvent>) => {
      const stage = stageRef.current
      if (!stage || event.target !== stage) {
        return
      }
      onOffsetChange({
        x: event.target.x(),
        y: event.target.y(),
      })
    },
  )

  const finishWall = useCallbackRef((anchors: CanvasPoint[]) => {
    if (anchors.length < 2) {
      setDrawingWall(null)
      setMeasurement(null)
      return
    }
    onCaptureSnapshot(scene)
    for (let i = 0; i < anchors.length - 1; i += 1) {
      const start = anchors[i]
      const end = anchors[i + 1]
      if (lengthBetween(start, end) < 0.05) {
        continue
      }
      onAddWall({
        id: crypto.randomUUID(),
        type: 'wall',
        coordinates: {
          x1: start.x,
          y1: start.y,
          x2: end.x,
          y2: end.y,
        },
        height: 3,
        thickness: 0.2,
        color: DEFAULT_WALL_COLOR,
        opacity: 0.9,
      })
    }
    setDrawingWall(null)
    setMeasurement(null)
  })

  const finishShape = useCallbackRef(
    (start: CanvasPoint, current: CanvasPoint, kind: SceneShapeKind) => {
      const width = Math.abs(current.x - start.x) || 1
      const length = Math.abs(current.y - start.y) || 1
      const x = Math.min(start.x, current.x)
      const y = Math.min(start.y, current.y)

      onCaptureSnapshot(scene)
      const defaultShape: SceneShape = {
        id: crypto.randomUUID(),
        type: kind,
        x,
        y,
        rotation: 0,
        width: width || 1,
        length: length || 1,
        height: 0.1,
        color: DEFAULT_WALL_COLOR,
        opacity: 0.75,
        lineThickness: 0.05,
      }

      if (kind === 'line') {
        defaultShape.length = current.y - start.y
        defaultShape.width = current.x - start.x
      }

      onAddShape(defaultShape)
      onSelectEntity({id: defaultShape.id, kind: 'shape'})
      setDrawingShape(null)
    },
  )

  const handleStagePointerDown = useCallbackRef(
    (event: KonvaEventObject<PointerEvent>) => {
      if (isPanning) {
        return
      }
      if (isManipulating || !canEdit) {
        return
      }
      if (!editMode) {
        return
      }
      const stage = stageRef.current
      if (!stage) {
        return
      }
      if (isPanTool && event.target === stage) {
        setIsPanning(true)
        onSelectEntity(null)
        onCloseOverlays()
        return
      }
      const point = pointFromStage(stage, offset, scale)
      if (!point) {
        return
      }
      const snapped = snapPoint(point, snapEnabled)

      if (activeTool === 'wall') {
        if (!drawingWall) {
          setDrawingWall({anchors: [snapped], preview: snapped})
        } else {
          const lastAnchor = drawingWall.anchors[drawingWall.anchors.length - 1]
          if (lengthBetween(lastAnchor, snapped) < 0.05) {
            return
          }
          setDrawingWall({
            anchors: [...drawingWall.anchors, snapped],
            preview: snapped,
          })
        }
        return
      }

      if (activeTool === 'shape') {
        setDrawingShape({start: snapped, current: snapped})
        return
      }

      if (activeTool === 'camera') {
        onCaptureSnapshot(scene)
        const camera: SceneCamera = {
          id: crypto.randomUUID(),
          typePreset: 'fixed',
          x: snapped.x,
          y: snapped.y,
          height: 2.5,
          direction: 45,
          fov: 90,
          depth: 12,
          zoom: 1,
          resolution: '1080p',
          nearPlane: 0.2,
        }
        onAddCamera(camera)
        onSelectEntity({id: camera.id, kind: 'camera'})
        return
      }

      if (activeTool === 'person') {
        onCaptureSnapshot(scene)
        const person: ScenePerson = {
          id: crypto.randomUUID(),
          x: snapped.x,
          y: snapped.y,
          radius: 0.3,
          height: 1.75,
          speed: 1.2,
          behavior: 'idle',
          trailEnabled: false,
        }
        onAddPerson(person)
        onSelectEntity({id: person.id, kind: 'person'})
        return
      }

      if (event.target === stage) {
        onSelectEntity(null)
        onCloseOverlays()
      }
    },
  )

  const handleStagePointerMove = useCallbackRef(() => {
    if (isPanning || activeTool === 'pan') {
      return
    }
    if (!drawingWall && !drawingShape) {
      return
    }
    const stage = stageRef.current
    if (!stage) {
      return
    }
    const point = pointFromStage(stage, offset, scale)
    if (!point) {
      return
    }
    const snapped = snapPoint(point, snapEnabled)
    if (drawingWall) {
      setDrawingWall({
        anchors: drawingWall.anchors,
        preview: snapped,
      })
      if (drawingWall.anchors.length) {
        const last = drawingWall.anchors[drawingWall.anchors.length - 1]
        setMeasurement({
          length: lengthBetween(last, snapped),
          angle: angleBetween(last, snapped),
          screen: toCanvas(snapped, offset, scale),
        })
      }
    }
    if (drawingShape) {
      setDrawingShape({
        ...drawingShape,
        current: snapped,
      })
    }
  })

  const handleStagePointerUp = useCallbackRef(() => {
    if (drawingShape) {
      finishShape(drawingShape.start, drawingShape.current, shapeTool)
    }
    if (isPanTool) {
      setIsPanning(false)
    }
  })

  const handleStageDoubleClick = useCallbackRef(() => {
    if (drawingWall) {
      finishWall(drawingWall.anchors)
    }
  })

  const snapValue = useCallbackRef((value: number) => {
    return snapEnabled ? Math.round(value) : value
  })

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

  const getPointerScenePoint = useCallbackRef(() => {
    return pointFromStage(stageRef.current, offset, scale)
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

  const handleStageDragStart = useCallbackRef(() => {
    if (isPanTool) {
      setIsPanning(true)
    }
  })

  const handleStageDragEnd = useCallbackRef(() => {
    if (isPanTool) {
      setIsPanning(false)
    }
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

  return (
    <div
      data-canvas-surface
      style={{cursor}}
      className={cn('relative flex flex-1 overflow-hidden bg-white shadow-sm', {
        'pointer-events-none': !canEdit,
      })}
    >
      {scene.background?.type === 'image' && (
        <div
          className='absolute inset-0 bg-cover bg-center opacity-40'
          style={{backgroundImage: `url(${scene.background.value})`}}
        />
      )}
      <Stage
        height={size.height}
        width={size.width}
        ref={stageRef}
        scaleX={scale}
        scaleY={scale}
        x={offset.x}
        y={offset.y}
        onDblClick={handleStageDoubleClick}
        onDragEnd={handleStageDragEnd}
        onDragMove={handleDragMove}
        onDragStart={handleStageDragStart}
        onMouseDown={handleStagePointerDown}
        onMouseMove={handleStagePointerMove}
        onMouseUp={handleStagePointerUp}
        onWheel={handleZoom}
        draggable={
          (isPanning || activeTool === 'pan') && !drawingWall && !drawingShape
        }
      >
        <CanvasGrid size={size} scale={scale} offset={offset} />
        <Layer>
          {scene.walls.map((wall) => (
            <WallSegment
              key={wall.id}
              scale={scale}
              wall={wall}
              onDragEnd={() => finishWallDrag(wall.id)}
              onDragMove={() => updateWallDrag(wall.id)}
              onDragStart={() => beginWallDrag(wall.id)}
              onInteractionEnd={() => {
                interactionCapturedRef.current = false
                setIsManipulating(false)
              }}
              onInteractionStart={() => {
                if (!interactionCapturedRef.current) {
                  onCaptureSnapshot(scene)
                  interactionCapturedRef.current = true
                }
                setIsManipulating(true)
              }}
              onSelect={() => {
                if (isManipulating) return
                onSelectEntity({id: wall.id, kind: 'wall'})
              }}
              isSelected={
                selection.selectedEntityId === wall.id &&
                selection.selectedEntityKind === 'wall'
              }
            />
          ))}
          {drawingWall && (
            <DrawingPreviewLine
              preview={drawingWall.preview}
              scale={scale}
              anchors={drawingWall.anchors}
            />
          )}
          {scene.shapes.map((shape) => (
            <ShapeNode
              key={shape.id}
              scale={scale}
              shape={shape}
              snapEnabled={snapEnabled}
              onInteractionEnd={() => {
                interactionCapturedRef.current = false
                setIsManipulating(false)
              }}
              onInteractionStart={() => {
                if (!interactionCapturedRef.current) {
                  onCaptureSnapshot(scene)
                  interactionCapturedRef.current = true
                }
                setIsManipulating(true)
              }}
              onSelect={() => {
                if (isManipulating) return
                onSelectEntity({id: shape.id, kind: 'shape'})
              }}
              onTransform={(next) => onUpdateShape(shape.id, next)}
              isSelected={
                selection.selectedEntityId === shape.id &&
                selection.selectedEntityKind === 'shape'
              }
            />
          ))}
          {drawingShape && (
            <ShapeNode
              isSelected={false}
              scale={scale}
              snapEnabled={snapEnabled}
              onSelect={() => {}}
              onTransform={() => {}}
              shape={{
                id: 'preview',
                type: shapeTool,
                x: Math.min(drawingShape.start.x, drawingShape.current.x),
                y: Math.min(drawingShape.start.y, drawingShape.current.y),
                rotation: 0,
                width: Math.abs(drawingShape.current.x - drawingShape.start.x),
                length: Math.abs(drawingShape.current.y - drawingShape.start.y),
                height: 0.1,
                color: DEFAULT_PREVIEW_COLOR,
                opacity: 0.4,
                lineThickness: 0.05,
              }}
            />
          )}
          {scene.cameras.map((camera) => (
            <CameraNode
              camera={camera}
              key={camera.id}
              scale={scale}
              snapEnabled={snapEnabled}
              onInteractionEnd={() => {
                interactionCapturedRef.current = false
                setIsManipulating(false)
              }}
              onInteractionStart={() => {
                if (!interactionCapturedRef.current) {
                  onCaptureSnapshot(scene)
                  interactionCapturedRef.current = true
                }
                setIsManipulating(true)
              }}
              onMove={(point) =>
                onUpdateCamera(camera.id, {x: point.x, y: point.y})
              }
              onSelect={() => {
                if (isManipulating) return
                onSelectEntity({id: camera.id, kind: 'camera'})
              }}
              isSelected={
                selection.selectedEntityId === camera.id &&
                selection.selectedEntityKind === 'camera'
              }
            />
          ))}
          {scene.people.map((person) => (
            <PersonNode
              key={person.id}
              scale={scale}
              snapEnabled={snapEnabled}
              onInteractionEnd={() => {
                interactionCapturedRef.current = false
                setIsManipulating(false)
              }}
              onInteractionStart={() => {
                if (!interactionCapturedRef.current) {
                  onCaptureSnapshot(scene)
                  interactionCapturedRef.current = true
                }
                setIsManipulating(true)
              }}
              onMove={(point) =>
                onUpdatePerson(person.id, {x: point.x, y: point.y})
              }
              onSelect={() => {
                if (isManipulating) return
                onSelectEntity({id: person.id, kind: 'person'})
              }}
              person={person}
              isSelected={
                selection.selectedEntityId === person.id &&
                selection.selectedEntityKind === 'person'
              }
            />
          ))}
          {scene.areas.map((area) => (
            <AreaNode area={area} key={area.id} />
          ))}
        </Layer>
      </Stage>

      {measurement && <MeasurementOverlay measurement={measurement} />}
    </div>
  )
}
