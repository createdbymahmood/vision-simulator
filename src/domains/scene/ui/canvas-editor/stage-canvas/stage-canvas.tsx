import type Konva from 'konva'
import type {KonvaEventObject} from 'konva/lib/Node'
import type React from 'react'
import type {MutableRefObject} from 'react'

import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import {useEffect, useMemo, useRef, useState} from 'react'

import type {
  Scene,
  SceneArea,
  SceneCamera,
  SceneEntityKind,
  ScenePerson,
  SceneShape,
  SceneShapeKind,
  SceneTool,
  SceneWall,
} from '../../../core/scene-types'
import type {
  CanvasMeasurement,
  CanvasPoint,
  CanvasSize,
  DrawingShapeState,
  DrawingWallState,
} from '../types'

import {findValidPersonPosition} from '../collision'
import {DEFAULT_WALL_COLOR, GRID_SIZE, MAX_SCALE, MIN_SCALE} from '../constants'
import {
  angleBetween,
  lengthBetween,
  pointFromStage,
  snapPoint,
  toCanvas,
} from '../utils'
import {computeVisionPolygon} from '../vision'
import {buildCamera, buildPerson, buildShape} from './entity-factories'
import {useMultiDrag} from './multi-drag'
import {computeSceneBounds} from './scene-bounds'
import {
  buildSelectionCandidates,
  computeSelectionBounds,
  rectIntersects,
} from './selection-helpers'
import {StageView} from './stage-view'
import {
  computeCursor,
  resolveSelectedEntities,
  selectionBoxToPixels,
  withinSelectionBounds,
} from './view-utils'
import {useWallDrag} from './wall-drag'
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
    selectedEntities: {id: string; kind: SceneEntityKind}[]
  }
  activeTool: SceneTool
  stageRef?: MutableRefObject<Konva.Stage | null>
  onOffsetChange: (point: CanvasPoint) => void
  onScaleChange: (scale: number) => void
  onCaptureSnapshot: (scene: Scene, pngData?: string) => void
  onAddWall: (wall: SceneWall) => void
  onAddShape: (shape: SceneShape) => void
  onUpdateShape: (id: string, patch: Partial<SceneShape>) => void
  onUpdateWall: (id: string, patch: Partial<SceneWall>) => void
  onUpdateCamera: (id: string, patch: Partial<SceneCamera>) => void
  onUpdatePerson: (id: string, patch: Partial<ScenePerson>) => void
  onUpdateArea: (id: string, patch: Partial<SceneArea>) => void
  onAddCamera: (camera: SceneCamera) => void
  onAddPerson: (person: ScenePerson) => void
  onSelectEntity: (payload: {id: string; kind: SceneEntityKind} | null) => void
  onSelectEntities: (
    payload: {id: string; kind: SceneEntityKind}[] | null,
  ) => void
  onCloseOverlays: () => void
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
  onAddWall,
  onAddShape,
  onUpdateShape,
  onUpdateWall,
  onUpdateCamera,
  onUpdatePerson,
  onUpdateArea,
  onAddCamera,
  onAddPerson,
  onSelectEntity,
  onSelectEntities,
  onCloseOverlays,
  onCaptureSnapshot,
  stageRef: stageRefProp,
}: CanvasStageProps) => {
  const canEdit = editMode
  const localStageRef = useRef<Konva.Stage | null>(null)
  const stageRef = stageRefProp ?? localStageRef
  const gridLayerRef = useRef<Konva.Layer | null>(null)
  const [drawingWall, setDrawingWall] = useState<DrawingWallState | null>(null)
  const [drawingShape, setDrawingShape] = useState<DrawingShapeState | null>(
    null,
  )
  const [measurement, setMeasurement] = useState<CanvasMeasurement | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [isManipulating, setIsManipulating] = useState(false)
  const interactionCapturedRef = useRef(false)
  const hasCenteredRef = useRef(false)
  const [selectionBox, setSelectionBox] = useState<{
    start: CanvasPoint
    end: CanvasPoint
  } | null>(null)
  const isPanTool = activeTool === 'pan'
  const cameraVisions = scene.cameras.map((camera) => ({
    id: camera.id,
    points: computeVisionPolygon(camera, scene),
  }))
  const selectionCandidates = useMemo(
    () => buildSelectionCandidates(scene),
    [scene],
  )
  const selectionBounds = useMemo(
    () => computeSelectionBounds(selection, selectionCandidates),
    [selection, selectionCandidates],
  )

  useEffect(() => {
    if (!size.width || !size.height || hasCenteredRef.current) {
      return
    }
    const bounds = computeSceneBounds(scene)
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2
    onOffsetChange({
      x: size.width / 2 - centerX * GRID_SIZE * scale,
      y: size.height / 2 - centerY * GRID_SIZE * scale,
    })
    hasCenteredRef.current = true
  }, [onOffsetChange, scale, scene, size.height, size.width])

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

  useEffect(() => {
    const handlePointerRelease = () => {
      interactionCapturedRef.current = false
      setIsManipulating(false)
    }
    window.addEventListener('pointerup', handlePointerRelease)
    window.addEventListener('pointercancel', handlePointerRelease)
    return () => {
      window.removeEventListener('pointerup', handlePointerRelease)
      window.removeEventListener('pointercancel', handlePointerRelease)
    }
  }, [])

  const cursor = useMemo(
    () => computeCursor(editMode, activeTool, isPanning, isPanTool),
    [activeTool, editMode, isPanTool, isPanning],
  )

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

  const selectionBoxPixels = useMemo(
    () => selectionBoxToPixels(selectionBox, offset, scale),
    [offset, scale, selectionBox],
  )

  const isEntitySelected = useCallbackRef(
    (id: string, kind: SceneEntityKind) =>
      selection.selectedEntityId === id ||
      (selection.selectedEntityKind === kind &&
        selection.selectedEntityId === id) ||
      selection.selectedEntities.some(
        (entity) => entity.id === id && entity.kind === kind,
      ),
  )

  const allowIndividualDrag = selection.selectedEntities.length <= 1

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
        material: 'drywall',
      })
    }
    setDrawingWall(null)
    setMeasurement(null)
  })

  const finishShape = useCallbackRef(
    (start: CanvasPoint, current: CanvasPoint, kind: SceneShapeKind) => {
      const dx = current.x - start.x
      const dy = current.y - start.y

      if (kind === 'line') {
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < 0.05) {
          setDrawingShape(null)
          setMeasurement(null)
          return
        }
      }

      onCaptureSnapshot(scene)
      const shape = buildShape(kind, start, current)
      onAddShape(shape)
      onSelectEntity({id: shape.id, kind: 'shape'})
      setDrawingShape(null)
      setMeasurement(null)
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
        onSelectEntities(null)
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
        if (event.target !== stage) {
          return
        }
        const camera = buildCamera(snapped)
        onCaptureSnapshot(scene)
        onAddCamera(camera)
        onSelectEntity({id: camera.id, kind: 'camera'})
        return
      }

      if (activeTool === 'person') {
        if (event.target !== stage) {
          return
        }
        const targetPoint = findValidPersonPosition(snapped, scene, 0.3)
        if (!targetPoint) {
          return
        }
        onCaptureSnapshot(scene)
        const person = buildPerson(targetPoint)
        onAddPerson(person)
        onSelectEntity({id: person.id, kind: 'person'})
        return
      }

      if (activeTool === 'select') {
        const selectedEntities = resolveSelectedEntities(selection)
        const hasMultiSelection = selectedEntities.length > 1
        const hasSingleSelection = selectedEntities.length === 1
        const withinSelection = withinSelectionBounds(selectionBounds, point)

        if (withinSelection && (hasMultiSelection || hasSingleSelection)) {
          if (beginMultiDrag(point)) {
            return
          }
        }
        if (event.target === stage) {
          setSelectionBox({start: point, end: point})
          onSelectEntities(null)
          onCloseOverlays()
          return
        }
      }

      if (event.target === stage) {
        if (scene.background && !scene.background.locked) {
          onSelectEntity({id: 'background', kind: 'background'})
        } else {
          onSelectEntity(null)
        }
        onSelectEntities(null)
        onCloseOverlays()
      }
    },
  )

  const handleStagePointerMove = useCallbackRef(() => {
    const pointer = getPointerScenePoint()
    if (updateMultiDragFromPointer(pointer)) {
      return
    }
    if (selectionBox) {
      if (pointer) {
        setSelectionBox({...selectionBox, end: pointer})
      }
      return
    }
    if (isPanning || activeTool === 'pan') {
      return
    }
    if (!drawingWall && !drawingShape) {
      return
    }
    if (!pointer) {
      return
    }
    const snapped = snapPoint(pointer, snapEnabled)
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
      if (shapeTool === 'line') {
        setMeasurement({
          length: lengthBetween(drawingShape.start, snapped),
          angle: angleBetween(drawingShape.start, snapped),
          screen: toCanvas(snapped, offset, scale),
        })
      }
    }
  })

  const handleStagePointerUp = useCallbackRef(() => {
    if (finishMultiDrag()) {
      return
    }
    if (selectionBox) {
      const rect = {
        minX: Math.min(selectionBox.start.x, selectionBox.end.x),
        maxX: Math.max(selectionBox.start.x, selectionBox.end.x),
        minY: Math.min(selectionBox.start.y, selectionBox.end.y),
        maxY: Math.max(selectionBox.start.y, selectionBox.end.y),
      }
      const selected = selectionCandidates
        .filter((candidate) => rectIntersects(rect, candidate.bounds))
        .map((candidate) => ({id: candidate.id, kind: candidate.kind}))
      onSelectEntities(selected.length ? selected : null)
      setSelectionBox(null)
      return
    }
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

  const getPointerScenePoint = useCallbackRef(() => {
    return pointFromStage(stageRef.current, offset, scale)
  })

  const {beginWallDrag, finishWallDrag, updateWallDrag} = useWallDrag({
    scene,
    snapValue,
    getPointerScenePoint,
    onUpdateWall,
    onCaptureSnapshot,
    setIsManipulating,
    interactionCapturedRef,
  })
  const {beginMultiDrag, finishMultiDrag, updateMultiDragFromPointer} =
    useMultiDrag({
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

  const beginInteraction = useCallbackRef(() => {
    if (!interactionCapturedRef.current) {
      onCaptureSnapshot(scene)
      interactionCapturedRef.current = true
    }
    setIsManipulating(true)
  })

  const endInteraction = useCallbackRef(() => {
    interactionCapturedRef.current = false
    setIsManipulating(false)
  })

  const getSelectHandler = useCallbackRef(
    (id: string, kind: SceneEntityKind) => () => {
      if (isManipulating) return
      onSelectEntity({id, kind})
    },
  )

  const getWallDragStartHandler = useCallbackRef(
    (wallId: string) => () => beginWallDrag(wallId),
  )
  const getWallDragMoveHandler = useCallbackRef(
    (wallId: string) => (_delta?: CanvasPoint) => updateWallDrag(wallId),
  )
  const getWallDragEndHandler = useCallbackRef(
    (wallId: string) => (_delta?: CanvasPoint) => finishWallDrag(wallId),
  )

  const getShapeTransformHandler = useCallbackRef(
    (shapeId: string) => (next: Partial<SceneShape>) =>
      onUpdateShape(shapeId, next),
  )

  const getCameraMoveHandler = useCallbackRef(
    (cameraId: string) => (point: CanvasPoint) =>
      onUpdateCamera(cameraId, {x: point.x, y: point.y}),
  )

  const getPersonMoveHandler = useCallbackRef(
    (personId: string) => (point: CanvasPoint) =>
      onUpdatePerson(personId, {x: point.x, y: point.y}),
  )

  const noopSelect = useCallbackRef(() => {})
  const noopTransform = useCallbackRef((next?: Partial<SceneShape>) => {
    return next
  })

  return (
    <StageView
      size={size}
      canEdit={canEdit}
      drawingShape={drawingShape}
      drawingWall={drawingWall}
      getSelectHandler={getSelectHandler}
      getWallDragEndHandler={getWallDragEndHandler}
      getWallDragStartHandler={getWallDragStartHandler}
      gridLayerRef={gridLayerRef}
      isEntitySelected={isEntitySelected}
      isPanning={isPanning}
      measurement={measurement}
      scale={scale}
      scene={scene}
      snapEnabled={snapEnabled}
      stageRef={stageRef}
      activeTool={activeTool}
      allowIndividualDrag={allowIndividualDrag}
      cameraVisions={cameraVisions}
      cursor={cursor}
      getCameraMoveHandler={getCameraMoveHandler}
      getPersonMoveHandler={getPersonMoveHandler}
      getShapeTransformHandler={getShapeTransformHandler}
      getWallDragMoveHandler={getWallDragMoveHandler}
      noopSelect={noopSelect}
      noopTransform={noopTransform}
      offset={offset}
      onBeginInteraction={beginInteraction}
      onEndInteraction={endInteraction}
      onStageDoubleClick={handleStageDoubleClick}
      onStageDragEnd={handleStageDragEnd}
      onStageDragMove={handleDragMove}
      onStageDragStart={handleStageDragStart}
      onStagePointerDown={handleStagePointerDown}
      onStagePointerMove={handleStagePointerMove}
      onStagePointerUp={handleStagePointerUp}
      onStageWheel={handleZoom}
      selectionBounds={selectionBounds}
      selectionBoxPixels={selectionBoxPixels}
      shapeTool={shapeTool}
    />
  )
}
