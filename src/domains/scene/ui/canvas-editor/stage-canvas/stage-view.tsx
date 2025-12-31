import type Konva from 'konva'
import type {MutableRefObject} from 'react'

import React from 'react'
import {Layer, Rect, Stage} from 'react-konva'

import type {
  Scene,
  SceneEntityKind,
  SceneShape,
  SceneShapeKind,
  SceneTool,
} from '../../../core/scene-types'
import type {
  CanvasMeasurement,
  CanvasPoint,
  CanvasSize,
  DrawingShapeState,
  DrawingWallState,
} from '../types'

import {BackgroundLayer} from '../background-layer'
import {DEFAULT_PREVIEW_COLOR, GRID_SIZE} from '../constants'
import {CanvasGrid} from '../grid'
import {MeasurementOverlay} from '../measurement-overlay'
import {
  AreaNode,
  CameraNode,
  CameraVision,
  DrawingPreviewLine,
  PersonNode,
  ShapeNode,
  WallSegment,
} from '../nodes'

interface StageViewProps {
  size: CanvasSize
  offset: CanvasPoint
  scale: number
  cursor: string
  canEdit: boolean
  activeTool: SceneTool
  isPanning: boolean
  shapeTool: SceneShapeKind
  scene: Scene
  cameraVisions: {id: string; points: CanvasPoint[]}[]
  selectionBounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  } | null
  selectionBoxPixels: {
    left: number
    top: number
    width: number
    height: number
  } | null
  measurement: CanvasMeasurement | null
  allowIndividualDrag: boolean
  snapEnabled: boolean
  isEntitySelected: (id: string, kind: SceneEntityKind) => boolean
  drawingWall: DrawingWallState | null
  drawingShape: DrawingShapeState | null
  stageRef: MutableRefObject<Konva.Stage | null>
  gridLayerRef?: MutableRefObject<Konva.Layer | null>
  onStageDoubleClick: () => void
  onStageDragEnd: () => void
  onStageDragMove: (event: any) => void
  onStageDragStart: () => void
  onStagePointerDown: (event: any) => void
  onStagePointerMove: () => void
  onStagePointerUp: () => void
  onStageWheel: (event: any) => void
  onBeginInteraction: () => void
  onEndInteraction: () => void
  getWallDragStartHandler: (id: string) => () => void
  getWallDragMoveHandler: (id: string) => (delta?: CanvasPoint) => void
  getWallDragEndHandler: (id: string) => (delta?: CanvasPoint) => void
  getShapeTransformHandler: (id: string) => (next: Partial<SceneShape>) => void
  getCameraMoveHandler: (id: string) => (point: CanvasPoint) => void
  getPersonMoveHandler: (id: string) => (point: CanvasPoint) => void
  getSelectHandler: (id: string, kind: SceneEntityKind) => () => void
  noopSelect: () => void
  noopTransform: (next?: Partial<SceneShape>) => Partial<SceneShape> | undefined
}

// eslint-disable-next-line max-lines-per-function
export const StageView: React.FC<StageViewProps> = ({
  size,
  offset,
  scale,
  cursor,
  canEdit,
  activeTool,
  isPanning,
  shapeTool,
  scene,
  cameraVisions,
  selectionBounds,
  selectionBoxPixels,
  measurement,
  allowIndividualDrag,
  snapEnabled,
  isEntitySelected,
  drawingWall,
  drawingShape,
  stageRef,
  gridLayerRef,
  onStageDoubleClick,
  onStageDragEnd,
  onStageDragMove,
  onStageDragStart,
  onStagePointerDown,
  onStagePointerMove,
  onStagePointerUp,
  onStageWheel,
  onBeginInteraction,
  onEndInteraction,
  getWallDragStartHandler,
  getWallDragMoveHandler,
  getWallDragEndHandler,
  getShapeTransformHandler,
  getCameraMoveHandler,
  getPersonMoveHandler,
  getSelectHandler,
  noopSelect,
  noopTransform,
}) => (
  <div
    data-canvas-surface
    style={{cursor}}
    className={`relative flex flex-1 overflow-hidden bg-white shadow-sm${
      canEdit ? '' : ' pointer-events-none'
    }`}
  >
    <Stage
      height={size.height}
      width={size.width}
      ref={stageRef}
      scaleX={scale}
      scaleY={scale}
      x={offset.x}
      y={offset.y}
      onDblClick={onStageDoubleClick}
      onDragEnd={onStageDragEnd}
      onDragMove={onStageDragMove}
      onDragStart={onStageDragStart}
      onMouseDown={onStagePointerDown}
      onMouseMove={onStagePointerMove}
      onMouseUp={onStagePointerUp}
      onWheel={onStageWheel}
      draggable={
        (isPanning || activeTool === 'pan') && !drawingWall && !drawingShape
      }
    >
      <BackgroundLayer background={scene.background} />
      <CanvasGrid
        size={size}
        scale={scale}
        offset={offset}
        innerRef={
          gridLayerRef as unknown as MutableRefObject<Konva.Layer | null>
        }
      />
      <Layer listening={false}>
        {cameraVisions.map((vision) => (
          <CameraVision
            key={`vision-${vision.id}`}
            scale={scale}
            points={vision.points}
          />
        ))}
      </Layer>
      <Layer>
        {scene.walls.map((wall) => (
          <WallSegment
            draggableEnabled={allowIndividualDrag}
            key={wall.id}
            scale={scale}
            wall={wall}
            onDragEnd={getWallDragEndHandler(wall.id)}
            onDragMove={getWallDragMoveHandler(wall.id)}
            onDragStart={getWallDragStartHandler(wall.id)}
            onInteractionEnd={onEndInteraction}
            onInteractionStart={onBeginInteraction}
            onSelect={getSelectHandler(wall.id, 'wall')}
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
            draggableEnabled={allowIndividualDrag}
            isSelected={isEntitySelected(shape.id, 'shape')}
            key={shape.id}
            scale={scale}
            shape={shape}
            snapEnabled={snapEnabled}
            onInteractionEnd={onEndInteraction}
            onInteractionStart={onBeginInteraction}
            onSelect={getSelectHandler(shape.id, 'shape')}
            onTransform={getShapeTransformHandler(shape.id)}
          />
        ))}
        {drawingShape &&
          (shapeTool === 'line' ? (
            <DrawingPreviewLine
              preview={drawingShape.current}
              scale={scale}
              anchors={[drawingShape.start]}
            />
          ) : (
            <ShapeNode
              isSelected={false}
              scale={scale}
              snapEnabled={snapEnabled}
              onSelect={noopSelect}
              onTransform={noopTransform}
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
          ))}
        {scene.cameras.map((camera) => (
          <CameraNode
            camera={camera}
            draggableEnabled={allowIndividualDrag}
            isSelected={isEntitySelected(camera.id, 'camera')}
            key={camera.id}
            scale={scale}
            snapEnabled={snapEnabled}
            onInteractionEnd={onEndInteraction}
            onInteractionStart={onBeginInteraction}
            onMove={getCameraMoveHandler(camera.id)}
            onSelect={getSelectHandler(camera.id, 'camera')}
          />
        ))}
        {scene.people.map((person) => (
          <PersonNode
            draggableEnabled={allowIndividualDrag}
            isSelected={isEntitySelected(person.id, 'person')}
            key={person.id}
            scale={scale}
            snapEnabled={snapEnabled}
            onInteractionEnd={onEndInteraction}
            onInteractionStart={onBeginInteraction}
            onMove={getPersonMoveHandler(person.id)}
            onSelect={getSelectHandler(person.id, 'person')}
            person={person}
          />
        ))}
        {scene.areas.map((area) => (
          <AreaNode area={area} key={area.id} />
        ))}
      </Layer>
      {selectionBounds ? (
        <Layer listening={false}>
          <Rect
            height={
              (selectionBounds.maxY - selectionBounds.minY) * GRID_SIZE + 20
            }
            width={
              (selectionBounds.maxX - selectionBounds.minX) * GRID_SIZE + 20
            }
            fill='rgba(59, 130, 246, 0.15)'
            listening={false}
            x={selectionBounds.minX * GRID_SIZE - 10}
            y={selectionBounds.minY * GRID_SIZE - 10}
            stroke='#3b82f6'
            strokeWidth={2}
          />
        </Layer>
      ) : null}
    </Stage>

    {selectionBoxPixels ? (
      <div className='pointer-events-none absolute inset-0'>
        <div
          className='border border-sky-400/70 bg-sky-200/30'
          style={{
            left: selectionBoxPixels.left,
            top: selectionBoxPixels.top,
            width: selectionBoxPixels.width,
            height: selectionBoxPixels.height,
            position: 'absolute',
          }}
        />
      </div>
    ) : null}

    {measurement && <MeasurementOverlay measurement={measurement} />}
  </div>
)

StageView.displayName = 'stage-view'
