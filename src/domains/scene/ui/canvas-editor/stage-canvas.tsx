import type Konva from 'konva'
import type {KonvaEventObject} from 'konva/lib/Node'

import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import {useEffect, useMemo, useRef, useState} from 'react'
import {Layer, Stage} from 'react-konva'

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
  onUpdateCamera: (id: string, patch: Partial<SceneCamera>) => void
  onUpdatePerson: (id: string, patch: Partial<ScenePerson>) => void
  onAddCamera: (camera: SceneCamera) => void
  onAddPerson: (person: ScenePerson) => void
  onSelectEntity: (payload: {id: string; kind: SceneEntityKind} | null) => void
  onCloseOverlays: () => void
}

// eslint-disable-next-line max-lines-per-function
export function CanvasStage({
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
  onUpdateCamera,
  onUpdatePerson,
  onAddCamera,
  onAddPerson,
  onSelectEntity,
  onCloseOverlays,
}: CanvasStageProps) {
  const stageRef = useRef<Konva.Stage | null>(null)
  const [drawingWall, setDrawingWall] = useState<DrawingWallState | null>(null)
  const [drawingShape, setDrawingShape] = useState<DrawingShapeState | null>(
    null,
  )
  const [measurement, setMeasurement] = useState<CanvasMeasurement | null>(null)
  const [isPanning, setIsPanning] = useState(false)

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
    return 'default'
  }, [activeTool, editMode])

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
      if (!editMode) {
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
    if (isPanning) {
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
  })

  const handleStageDoubleClick = useCallbackRef(() => {
    if (drawingWall) {
      finishWall(drawingWall.anchors)
    }
  })

  return (
    <div
      className='relative flex flex-1 overflow-hidden bg-white shadow-sm'
      style={{cursor}}
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
        draggable={isPanning && !drawingWall && !drawingShape}
        ref={stageRef}
        scaleX={scale}
        scaleY={scale}
        x={offset.x}
        y={offset.y}
        onDblClick={handleStageDoubleClick}
        onDragMove={handleDragMove}
        onMouseDown={handleStagePointerDown}
        onMouseMove={handleStagePointerMove}
        onMouseUp={handleStagePointerUp}
        onWheel={handleZoom}
      >
        <CanvasGrid size={size} scale={scale} offset={offset} />
        <Layer>
          {scene.walls.map((wall) => (
            <WallSegment
              key={wall.id}
              scale={scale}
              wall={wall}
              onSelect={() => onSelectEntity({id: wall.id, kind: 'wall'})}
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
              onSelect={() => onSelectEntity({id: shape.id, kind: 'shape'})}
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
              onMove={(point) =>
                onUpdateCamera(camera.id, {x: point.x, y: point.y})
              }
              onSelect={() => onSelectEntity({id: camera.id, kind: 'camera'})}
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
              onMove={(point) =>
                onUpdatePerson(person.id, {x: point.x, y: point.y})
              }
              onSelect={() => onSelectEntity({id: person.id, kind: 'person'})}
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
