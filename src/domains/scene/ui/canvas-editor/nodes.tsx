import type {KonvaEventObject} from 'konva/lib/Node'
import type {Vector2d} from 'konva/lib/types'

import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React, {useEffect, useMemo, useRef} from 'react'
import {Circle, Group, Line, Rect, Transformer} from 'react-konva'

import type {
  SceneArea,
  SceneCamera,
  ScenePerson,
  SceneShape,
  SceneWall,
} from '../../core/scene-types'
import type {CanvasPoint} from './types'

import {
  DEFAULT_PREVIEW_COLOR,
  DEFAULT_SHAPE_COLOR,
  GRID_SIZE,
} from './constants'
/* eslint-disable max-lines-per-function */

interface WallSegmentProps {
  wall: SceneWall
  scale: number
  isSelected?: boolean
  onSelect?: () => void
  onDragStart?: () => void
  onDragMove?: (delta: CanvasPoint) => void
  onDragEnd?: (delta: CanvasPoint) => void
  onInteractionStart?: () => void
  onInteractionEnd?: () => void
}

interface ShapeNodeProps {
  shape: SceneShape
  isSelected: boolean
  scale: number
  onSelect: () => void
  onTransform: (next: Partial<SceneShape>) => void
  snapEnabled: boolean
  onInteractionStart?: () => void
  onInteractionEnd?: () => void
}

interface CameraNodeProps {
  camera: SceneCamera
  scale: number
  isSelected: boolean
  onSelect: () => void
  onMove: (point: CanvasPoint) => void
  snapEnabled: boolean
  onInteractionStart?: () => void
  onInteractionEnd?: () => void
}

interface PersonNodeProps {
  person: ScenePerson
  scale: number
  isSelected: boolean
  onSelect: () => void
  onMove: (point: CanvasPoint) => void
  snapEnabled: boolean
  onInteractionStart?: () => void
  onInteractionEnd?: () => void
}

interface AreaNodeProps {
  area: SceneArea
}

interface DrawingPreviewLineProps {
  anchors: CanvasPoint[]
  preview: CanvasPoint | null
  scale: number
}

interface CameraVisionProps {
  points: CanvasPoint[]
  scale: number
}

export const WallSegment: React.FC<WallSegmentProps> = ({
  wall,
  scale,
  isSelected,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onInteractionStart,
  onInteractionEnd,
}) => {
  const handleDragEnd = useCallbackRef((event: KonvaEventObject<DragEvent>) => {
    if (!onDragEnd) {
      return
    }
    onDragEnd({
      x: event.target.x() / GRID_SIZE,
      y: event.target.y() / GRID_SIZE,
    })
    event.target.position({x: 0, y: 0})
    onInteractionEnd?.()
  })

  const handleDragMove = useCallbackRef(
    (event: KonvaEventObject<DragEvent>) => {
      if (!onDragMove) {
        return
      }
      onInteractionStart?.()
      onDragMove({
        x: event.target.x() / GRID_SIZE,
        y: event.target.y() / GRID_SIZE,
      })
      event.target.position({x: 0, y: 0})
    },
  )

  return (
    <Line
      listening
      dash={isSelected ? [6, 4] : undefined}
      draggable={Boolean(onDragEnd)}
      lineCap='round'
      lineJoin='round'
      onClick={onSelect}
      onDragEnd={handleDragEnd}
      onDragMove={handleDragMove}
      onDragStart={onDragStart}
      onTap={onSelect}
      opacity={wall.opacity}
      points={[
        wall.coordinates.x1 * GRID_SIZE,
        wall.coordinates.y1 * GRID_SIZE,
        wall.coordinates.x2 * GRID_SIZE,
        wall.coordinates.y2 * GRID_SIZE,
      ]}
      stroke={wall.color}
      strokeWidth={Math.max(2, wall.thickness * GRID_SIZE) / scale}
    />
  )
}

export const ShapeNode: React.FC<ShapeNodeProps> = ({
  shape,
  isSelected,
  scale,
  onSelect,
  onTransform,
  snapEnabled,
  onInteractionStart,
  onInteractionEnd,
}) => {
  const shapeRef = useRef<any>(null)
  const transformerRef = useRef<any>(null)

  useEffect(() => {
    if (!transformerRef.current) {
      return
    }
    if (isSelected && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current])
    } else {
      transformerRef.current.nodes([])
    }
    transformerRef.current.getLayer()?.batchDraw()
    transformerRef.current.forceUpdate?.()
  }, [
    isSelected,
    shape.x,
    shape.y,
    shape.width,
    shape.length,
    shape.rotation,
    shape.type,
  ])

  const commonProps = {
    draggable: true,
    onClick: onSelect,
    onTap: onSelect,
    opacity: shape.opacity,
    ref: shapeRef,
  }

  const strokeWidth =
    shape.type === 'line'
      ? Math.max(3, shape.lineThickness * GRID_SIZE) / scale
      : Math.max(1.5, shape.lineThickness * GRID_SIZE) / scale
  const fill = shape.color || DEFAULT_SHAPE_COLOR
  const snapValue = useCallbackRef((value: number) =>
    snapEnabled ? Math.round(value) : value,
  )

  const transformerBoundBox = useCallbackRef((oldBox: any, newBox: any) => {
    if (newBox.width < GRID_SIZE * 0.2 || newBox.height < GRID_SIZE * 0.2) {
      return oldBox
    }
    return newBox
  })

  const dragBoundPosition = useCallbackRef((pos: Vector2d) => {
    if (!snapEnabled) return pos
    return {
      x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
    }
  })

  const handleDragStart = useCallbackRef(() => {
    onInteractionStart?.()
  })

  const handleTransformStart = useCallbackRef(() => {
    onInteractionStart?.()
  })

  const handleDragEnd = useCallbackRef((event: KonvaEventObject<DragEvent>) => {
    onTransform({
      x: snapValue(event.target.x() / GRID_SIZE),
      y: snapValue(event.target.y() / GRID_SIZE),
    })
    onInteractionEnd?.()
  })

  const handleDragMove = useCallbackRef(
    (event: KonvaEventObject<DragEvent>) => {
      onTransform({
        x: snapValue(event.target.x() / GRID_SIZE),
        y: snapValue(event.target.y() / GRID_SIZE),
      })
    },
  )

  const applyRectangleTransform = useCallbackRef(
    (event: KonvaEventObject<Event>, finalize: boolean) => {
      const node = event.target as any
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()
      const next = {
        x: snapValue(node.x() / GRID_SIZE),
        y: snapValue(node.y() / GRID_SIZE),
        width: snapValue(shape.width * scaleX),
        length: snapValue(shape.length * scaleY),
        rotation: (node.rotation() * Math.PI) / 180,
      }
      node.scaleX(1)
      node.scaleY(1)
      onTransform(next)
      if (finalize) {
        onInteractionEnd?.()
        transformerRef.current?.forceUpdate?.()
      }
    },
  )

  const applyCircleTransform = useCallbackRef(
    (event: KonvaEventObject<Event>, finalize: boolean) => {
      const node = event.target as any
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()
      const next = {
        x: snapValue(node.x() / GRID_SIZE),
        y: snapValue(node.y() / GRID_SIZE),
        width: snapValue(shape.width * scaleX),
        length: snapValue(shape.length * scaleY),
        rotation: (node.rotation() * Math.PI) / 180,
      }
      node.scaleX(1)
      node.scaleY(1)
      onTransform(next)
      if (finalize) {
        onInteractionEnd?.()
        transformerRef.current?.forceUpdate?.()
      }
    },
  )

  const applyLineTransform = useCallbackRef(
    (event: KonvaEventObject<Event>, finalize: boolean) => {
      const node = event.target as any
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()
      const nextX = snapValue(node.x() / GRID_SIZE)
      const nextY = snapValue(node.y() / GRID_SIZE)
      const next = {
        x: nextX,
        y: nextY,
        width: snapValue(shape.width * scaleX),
        length: snapValue(shape.length * scaleY),
        rotation: (node.rotation() * Math.PI) / 180,
      }
      node.scaleX(1)
      node.scaleY(1)
      onTransform(next)
      if (finalize) {
        onInteractionEnd?.()
        transformerRef.current?.forceUpdate?.()
      }
    },
  )

  const handleRectangleTransform = useCallbackRef(
    (event: KonvaEventObject<Event>) => applyRectangleTransform(event, false),
  )

  const handleCircleTransform = useCallbackRef(
    (event: KonvaEventObject<Event>) => applyCircleTransform(event, false),
  )

  const handleLineTransform = useCallbackRef((event: KonvaEventObject<Event>) =>
    applyLineTransform(event, false),
  )

  const handleRectangleTransformEnd = useCallbackRef(
    (event: KonvaEventObject<Event>) => applyRectangleTransform(event, true),
  )

  const handleCircleTransformEnd = useCallbackRef(
    (event: KonvaEventObject<Event>) => applyCircleTransform(event, true),
  )

  const handleLineTransformEnd = useCallbackRef(
    (event: KonvaEventObject<Event>) => applyLineTransform(event, true),
  )

  const handleLineDragEnd = useCallbackRef(
    (event: KonvaEventObject<DragEvent>) => {
      const nextX = snapValue(event.target.x() / GRID_SIZE)
      const nextY = snapValue(event.target.y() / GRID_SIZE)
      onTransform({
        x: nextX,
        y: nextY,
      })
      onInteractionEnd?.()
    },
  )

  const handleLineDragMove = useCallbackRef(
    (event: KonvaEventObject<DragEvent>) => {
      const nextX = snapValue(event.target.x() / GRID_SIZE)
      const nextY = snapValue(event.target.y() / GRID_SIZE)
      onTransform({
        x: nextX,
        y: nextY,
      })
    },
  )

  const handleLineDragStart = useCallbackRef(() => {
    handleDragStart()
  })

  const transformer = useMemo(
    () =>
      isSelected ? (
        <Transformer
          resizeEnabled
          ref={transformerRef}
          borderDash={[6, 4]}
          boundBoxFunc={transformerBoundBox}
          rotateEnabled
        />
      ) : null,
    [isSelected, transformerBoundBox],
  )

  if (shape.type === 'rectangle') {
    return (
      <>
        <Group
          x={shape.x * GRID_SIZE}
          y={shape.y * GRID_SIZE}
          rotation={(shape.rotation * 180) / Math.PI}
          {...commonProps}
          dragBoundFunc={dragBoundPosition}
          onDragEnd={handleDragEnd}
          onDragMove={handleDragMove}
          onDragStart={handleDragStart}
          onTransform={handleRectangleTransform}
          onTransformEnd={handleRectangleTransformEnd}
          onTransformStart={handleTransformStart}
        >
          <Rect
            height={shape.length * GRID_SIZE}
            width={shape.width * GRID_SIZE}
            fill={fill}
            stroke={fill}
            strokeWidth={strokeWidth}
          />
          {isSelected && (
            <Rect
              height={shape.length * GRID_SIZE}
              width={shape.width * GRID_SIZE}
              dash={[6, 4]}
              stroke='#38bdf8'
              strokeWidth={1.5 / scale}
            />
          )}
        </Group>
        {transformer}
      </>
    )
  }

  if (shape.type === 'circle') {
    return (
      <>
        <Group
          x={shape.x * GRID_SIZE}
          y={shape.y * GRID_SIZE}
          rotation={(shape.rotation * 180) / Math.PI}
          {...commonProps}
          dragBoundFunc={dragBoundPosition}
          onDragEnd={handleDragEnd}
          onDragMove={handleDragMove}
          onDragStart={handleDragStart}
          onTransform={handleCircleTransform}
          onTransformEnd={handleCircleTransformEnd}
          onTransformStart={handleTransformStart}
        >
          <Circle
            fill={fill}
            radius={(shape.width * GRID_SIZE) / 2}
            x={(shape.width * GRID_SIZE) / 2}
            y={(shape.length * GRID_SIZE) / 2}
            stroke={fill}
            strokeWidth={strokeWidth}
          />
          {isSelected && (
            <Circle
              dash={[6, 4]}
              radius={(shape.width * GRID_SIZE) / 2 + 4}
              x={(shape.width * GRID_SIZE) / 2}
              y={(shape.length * GRID_SIZE) / 2}
              stroke='#38bdf8'
              strokeWidth={1.5 / scale}
            />
          )}
        </Group>
        {transformer}
      </>
    )
  }

  if (shape.type === 'triangle') {
    const triangleRadius = (Math.min(shape.width, shape.length) * GRID_SIZE) / 2
    return (
      <>
        <Group
          x={shape.x * GRID_SIZE}
          y={shape.y * GRID_SIZE}
          rotation={(shape.rotation * 180) / Math.PI}
          {...commonProps}
          dragBoundFunc={dragBoundPosition}
          onDragEnd={handleDragEnd}
          onDragMove={handleDragMove}
          onDragStart={handleDragStart}
          onTransform={handleRectangleTransform}
          onTransformEnd={handleRectangleTransformEnd}
          onTransformStart={handleTransformStart}
        >
          <RegularPolygon
            fill={fill}
            radius={triangleRadius}
            sides={3}
            x={(shape.width * GRID_SIZE) / 2}
            y={(shape.length * GRID_SIZE) / 2}
            stroke={fill}
            strokeWidth={strokeWidth}
          />
          {isSelected && (
            <RegularPolygon
              dash={[6, 4]}
              radius={triangleRadius + 6}
              sides={3}
              x={(shape.width * GRID_SIZE) / 2}
              y={(shape.length * GRID_SIZE) / 2}
              stroke='#38bdf8'
              strokeWidth={1.5 / scale}
            />
          )}
        </Group>
        {transformer}
      </>
    )
  }

  return (
    <>
      <Line
        draggable
        lineCap='round'
        ref={shapeRef}
        x={shape.x * GRID_SIZE}
        y={shape.y * GRID_SIZE}
        dragBoundFunc={dragBoundPosition}
        onClick={onSelect}
        onDragEnd={handleLineDragEnd}
        onDragMove={handleLineDragMove}
        onDragStart={handleLineDragStart}
        onTap={onSelect}
        onTransform={handleLineTransform}
        onTransformEnd={handleLineTransformEnd}
        onTransformStart={handleTransformStart}
        opacity={shape.opacity}
        points={[0, 0, shape.width * GRID_SIZE, shape.length * GRID_SIZE]}
        rotation={(shape.rotation * 180) / Math.PI}
        stroke={fill}
        strokeWidth={strokeWidth}
      />
      {transformer}
    </>
  )
}

export const CameraNode: React.FC<CameraNodeProps> = ({
  camera,
  scale,
  isSelected,
  onSelect,
  onMove,
  snapEnabled,
  onInteractionStart,
  onInteractionEnd,
}) => {
  const handleDragBound = useCallbackRef((pos: Vector2d) => {
    if (!snapEnabled) return pos
    return {
      x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
    }
  })

  const handleDragEnd = useCallbackRef((event: KonvaEventObject<DragEvent>) => {
    onInteractionEnd?.()
    onMove({
      x: snapEnabled
        ? Math.round(event.target.x() / GRID_SIZE)
        : event.target.x() / GRID_SIZE,
      y: snapEnabled
        ? Math.round(event.target.y() / GRID_SIZE)
        : event.target.y() / GRID_SIZE,
    })
  })

  const handleDragMove = useCallbackRef(
    (event: KonvaEventObject<DragEvent>) => {
      onMove({
        x: snapEnabled
          ? Math.round(event.target.x() / GRID_SIZE)
          : event.target.x() / GRID_SIZE,
        y: snapEnabled
          ? Math.round(event.target.y() / GRID_SIZE)
          : event.target.y() / GRID_SIZE,
      })
    },
  )

  const handleDragStart = useCallbackRef(() => {
    onInteractionStart?.()
  })

  return (
    <>
      <Circle
        draggable
        fill={DEFAULT_SHAPE_COLOR}
        radius={12}
        x={camera.x * GRID_SIZE}
        y={camera.y * GRID_SIZE}
        dragBoundFunc={handleDragBound}
        onClick={onSelect}
        onDragEnd={handleDragEnd}
        onDragMove={handleDragMove}
        onDragStart={handleDragStart}
        onTap={onSelect}
        opacity={0.8}
      />
      {isSelected && (
        <Circle
          radius={16}
          x={camera.x * GRID_SIZE}
          y={camera.y * GRID_SIZE}
          opacity={0.7}
          stroke={DEFAULT_PREVIEW_COLOR}
          strokeWidth={1.5 / scale}
        />
      )}
    </>
  )
}

export const PersonNode: React.FC<PersonNodeProps> = ({
  person,
  scale,
  isSelected,
  onSelect,
  onMove,
  snapEnabled,
  onInteractionStart,
  onInteractionEnd,
}) => {
  const handleDragBound = useCallbackRef((pos: Vector2d) => {
    if (!snapEnabled) return pos
    return {
      x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
    }
  })

  const handleDragEnd = useCallbackRef((event: KonvaEventObject<DragEvent>) => {
    onInteractionEnd?.()
    onMove({
      x: snapEnabled
        ? Math.round(event.target.x() / GRID_SIZE)
        : event.target.x() / GRID_SIZE,
      y: snapEnabled
        ? Math.round(event.target.y() / GRID_SIZE)
        : event.target.y() / GRID_SIZE,
    })
  })

  const handleDragStart = useCallbackRef(() => {
    onInteractionStart?.()
  })

  return (
    <>
      <Circle
        draggable
        fill='#22c55e'
        radius={person.radius * GRID_SIZE}
        x={person.x * GRID_SIZE}
        y={person.y * GRID_SIZE}
        dragBoundFunc={handleDragBound}
        onClick={onSelect}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onTap={onSelect}
        opacity={0.85}
      />
      {isSelected && (
        <Circle
          radius={person.radius * GRID_SIZE + 4}
          x={person.x * GRID_SIZE}
          y={person.y * GRID_SIZE}
          opacity={0.7}
          stroke={DEFAULT_PREVIEW_COLOR}
          strokeWidth={1.5 / scale}
        />
      )}
    </>
  )
}

export const AreaNode: React.FC<AreaNodeProps> = ({area}) => {
  const first = area.geometry[0]
  if (!first) {
    return null
  }
  const points = area.geometry.flatMap((p) => [
    p.lng * GRID_SIZE,
    p.lat * GRID_SIZE,
  ])
  return (
    <Line
      dash={[6, 4]}
      closed
      opacity={0.8}
      points={points}
      stroke='#f59e0b'
      strokeWidth={2}
    />
  )
}

export const DrawingPreviewLine: React.FC<DrawingPreviewLineProps> = ({
  anchors,
  preview,
  scale,
}) => {
  const pointsArray = [...anchors]
  if (preview) {
    pointsArray.push(preview)
  }
  const points = pointsArray.flatMap((p) => [p.x * GRID_SIZE, p.y * GRID_SIZE])
  return (
    <Line
      dash={[6, 4]}
      points={points}
      stroke={DEFAULT_PREVIEW_COLOR}
      strokeWidth={2 / scale}
    />
  )
}

export const CameraVision: React.FC<CameraVisionProps> = ({points}) => {
  if (!points.length) {
    return null
  }
  const konvaPoints = points.flatMap((point) => [
    point.x * GRID_SIZE,
    point.y * GRID_SIZE,
  ])
  const origin = points[0]
  const farthest = points.reduce(
    (max, point) => {
      const dx = point.x - origin.x
      const dy = point.y - origin.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance > max.distance) {
        return {distance, point}
      }
      return max
    },
    {distance: 0, point: origin},
  ).point

  return (
    <Line
      fill={DEFAULT_PREVIEW_COLOR}
      fillRadialGradientStartRadius={0}
      listening={false}
      closed
      fillPriority='radial-gradient'
      fillRadialGradientColorStops={[
        0,
        DEFAULT_PREVIEW_COLOR,
        0.5,
        DEFAULT_PREVIEW_COLOR,
        1,
        'rgba(56,189,248,0)',
      ]}
      fillRadialGradientEndPoint={{
        x: origin.x * GRID_SIZE,
        y: origin.y * GRID_SIZE,
      }}
      fillRadialGradientStartPoint={{
        x: origin.x * GRID_SIZE,
        y: origin.y * GRID_SIZE,
      }}
      opacity={0.35}
      points={konvaPoints}
      strokeEnabled={false}
      fillRadialGradientEndRadius={
        Math.sqrt((farthest.x - origin.x) ** 2 + (farthest.y - origin.y) ** 2) *
        GRID_SIZE
      }
    />
  )
}
