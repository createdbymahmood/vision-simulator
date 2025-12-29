import type {KonvaEventObject} from 'konva/lib/Node'

import {useEffect, useRef} from 'react'
import {
  Circle,
  Group,
  Line,
  Rect,
  RegularPolygon,
  Transformer,
} from 'react-konva'

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

export function WallSegment({
  wall,
  scale,
  isSelected,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onInteractionStart,
  onInteractionEnd,
}: {
  wall: SceneWall
  scale: number
  isSelected?: boolean
  onSelect?: () => void
  onDragStart?: () => void
  onDragMove?: (delta: CanvasPoint) => void
  onDragEnd?: (delta: CanvasPoint) => void
  onInteractionStart?: () => void
  onInteractionEnd?: () => void
}) {
  return (
    <Line
      listening
      dash={isSelected ? [6, 4] : undefined}
      draggable={Boolean(onDragEnd)}
      lineCap='round'
      lineJoin='round'
      onClick={onSelect}
      onDragEnd={(event: KonvaEventObject<DragEvent>) => {
        if (!onDragEnd) {
          return
        }
        onDragEnd({
          x: event.target.x() / GRID_SIZE,
          y: event.target.y() / GRID_SIZE,
        })
        event.target.position({x: 0, y: 0})
        onInteractionEnd?.()
      }}
      onDragMove={(event: KonvaEventObject<DragEvent>) => {
        if (!onDragMove) {
          return
        }
        onInteractionStart?.()
        onDragMove({
          x: event.target.x() / GRID_SIZE,
          y: event.target.y() / GRID_SIZE,
        })
        event.target.position({x: 0, y: 0})
      }}
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

export function ShapeNode({
  shape,
  isSelected,
  scale,
  onSelect,
  onTransform,
  snapEnabled,
  onInteractionStart,
  onInteractionEnd,
}: {
  shape: SceneShape
  isSelected: boolean
  scale: number
  onSelect: () => void
  onTransform: (next: Partial<SceneShape>) => void
  snapEnabled: boolean
  onInteractionStart?: () => void
  onInteractionEnd?: () => void
}) {
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

  const strokeWidth = Math.max(1.5, shape.lineThickness * GRID_SIZE) / scale
  const fill = shape.color || DEFAULT_SHAPE_COLOR
  const snapValue = (value: number) => (snapEnabled ? Math.round(value) : value)

  const transformer = isSelected ? (
    <Transformer
      resizeEnabled
      ref={transformerRef}
      borderDash={[6, 4]}
      boundBoxFunc={(oldBox, newBox) => {
        if (newBox.width < GRID_SIZE * 0.2 || newBox.height < GRID_SIZE * 0.2) {
          return oldBox
        }
        return newBox
      }}
      rotateEnabled
    />
  ) : null

  if (shape.type === 'rectangle') {
    return (
      <>
        <Group
          x={shape.x * GRID_SIZE}
          y={shape.y * GRID_SIZE}
          rotation={(shape.rotation * 180) / Math.PI}
          {...commonProps}
          dragBoundFunc={(pos) => {
            if (!snapEnabled) return pos
            return {
              x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
              y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
            }
          }}
          onDragEnd={(event) => {
            onTransform({
              x: snapValue(event.target.x() / GRID_SIZE),
              y: snapValue(event.target.y() / GRID_SIZE),
            })
            onInteractionEnd?.()
          }}
          onDragStart={() => {
            onInteractionStart?.()
          }}
          onTransformEnd={(event) => {
            const node = event.target
            const scaleX = node.scaleX()
            const scaleY = node.scaleY()
            node.scaleX(1)
            node.scaleY(1)
            onTransform({
              width: snapValue(shape.width * scaleX),
              length: snapValue(shape.length * scaleY),
              rotation: (node.rotation() * Math.PI) / 180,
            })
            onInteractionEnd?.()
            transformerRef.current?.forceUpdate?.()
          }}
          onTransformStart={() => {
            onInteractionStart?.()
          }}
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
          {...commonProps}
          dragBoundFunc={(pos) => {
            if (!snapEnabled) return pos
            return {
              x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
              y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
            }
          }}
          onDragEnd={(event) => {
            onTransform({
              x: snapValue(event.target.x() / GRID_SIZE),
              y: snapValue(event.target.y() / GRID_SIZE),
            })
            onInteractionEnd?.()
          }}
          onDragStart={() => {
            onInteractionStart?.()
          }}
          onTransformEnd={(event) => {
            const node = event.target
            const scaleX = node.scaleX()
            node.scaleX(1)
            node.scaleY(1)
            onTransform({
              width: snapValue(shape.width * scaleX),
              length: snapValue(shape.length * scaleX),
              rotation: 0,
            })
            onInteractionEnd?.()
            transformerRef.current?.forceUpdate?.()
          }}
          onTransformStart={() => {
            onInteractionStart?.()
          }}
        >
          <Circle
            fill={fill}
            radius={(shape.width * GRID_SIZE) / 2}
            stroke={fill}
            strokeWidth={strokeWidth}
          />
          {isSelected && (
            <Circle
              dash={[6, 4]}
              radius={(shape.width * GRID_SIZE) / 2 + 4}
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
    return (
      <>
        <Group
          x={shape.x * GRID_SIZE}
          y={shape.y * GRID_SIZE}
          rotation={(shape.rotation * 180) / Math.PI}
          {...commonProps}
          dragBoundFunc={(pos) => {
            if (!snapEnabled) return pos
            return {
              x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
              y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
            }
          }}
          onDragEnd={(event) => {
            onTransform({
              x: snapValue(event.target.x() / GRID_SIZE),
              y: snapValue(event.target.y() / GRID_SIZE),
            })
            onInteractionEnd?.()
          }}
          onDragStart={() => {
            onInteractionStart?.()
          }}
          onTransformEnd={(event) => {
            const node = event.target
            const scaleX = node.scaleX()
            node.scaleX(1)
            node.scaleY(1)
            onTransform({
              width: snapValue(shape.width * scaleX),
              length: snapValue(shape.length * scaleX),
              rotation: (node.rotation() * Math.PI) / 180,
            })
            onInteractionEnd?.()
            transformerRef.current?.forceUpdate?.()
          }}
          onTransformStart={() => {
            onInteractionStart?.()
          }}
        >
          <RegularPolygon
            fill={fill}
            radius={(shape.width * GRID_SIZE) / 2}
            sides={3}
            stroke={fill}
            strokeWidth={strokeWidth}
          />
          {isSelected && (
            <RegularPolygon
              dash={[6, 4]}
              radius={(shape.width * GRID_SIZE) / 2 + 6}
              sides={3}
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
        dragBoundFunc={(pos) => {
          if (!snapEnabled) return pos
          return {
            x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
            y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
          }
        }}
        onClick={onSelect}
        onDragEnd={(event) => {
          const target = event.target as any
          onTransform({
            x: snapEnabled
              ? Math.round(target.points()[0] / GRID_SIZE)
              : target.points()[0] / GRID_SIZE,
            y: snapEnabled
              ? Math.round(target.points()[1] / GRID_SIZE)
              : target.points()[1] / GRID_SIZE,
          })
          onInteractionEnd?.()
        }}
        onDragStart={() => {
          onInteractionStart?.()
        }}
        onTap={onSelect}
        onTransformEnd={(event) => {
          const node = event.target as any
          const scaleX = node.scaleX()
          const scaleY = node.scaleY()
          node.scaleX(1)
          node.scaleY(1)
          onTransform({
            width: snapValue(shape.width * scaleX),
            length: snapValue(shape.length * scaleY),
            rotation: (node.rotation() * Math.PI) / 180,
          })
          transformerRef.current?.forceUpdate?.()
        }}
        opacity={shape.opacity}
        points={[
          shape.x * GRID_SIZE,
          shape.y * GRID_SIZE,
          (shape.x + shape.width) * GRID_SIZE,
          (shape.y + shape.length) * GRID_SIZE,
        ]}
        stroke={fill}
        strokeWidth={strokeWidth}
      />
      {transformer}
    </>
  )
}

export function CameraNode({
  camera,
  scale,
  isSelected,
  onSelect,
  onMove,
  snapEnabled,
  onInteractionStart,
  onInteractionEnd,
}: {
  camera: SceneCamera
  scale: number
  isSelected: boolean
  onSelect: () => void
  onMove: (point: CanvasPoint) => void
  snapEnabled: boolean
  onInteractionStart?: () => void
  onInteractionEnd?: () => void
}) {
  return (
    <>
      <RegularPolygon
        draggable
        fill={DEFAULT_SHAPE_COLOR}
        radius={12}
        sides={3}
        x={camera.x * GRID_SIZE}
        y={camera.y * GRID_SIZE}
        dragBoundFunc={(pos) => {
          if (!snapEnabled) return pos
          return {
            x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
            y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
          }
        }}
        onClick={onSelect}
        onDragEnd={(event) => {
          onInteractionEnd?.()
          onMove({
            x: snapEnabled
              ? Math.round(event.target.x() / GRID_SIZE)
              : event.target.x() / GRID_SIZE,
            y: snapEnabled
              ? Math.round(event.target.y() / GRID_SIZE)
              : event.target.y() / GRID_SIZE,
          })
        }}
        onDragStart={onInteractionStart}
        onTap={onSelect}
        opacity={0.8}
        rotation={camera.direction}
      />
      {isSelected && (
        <RegularPolygon
          radius={16}
          sides={3}
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

export function PersonNode({
  person,
  scale,
  isSelected,
  onSelect,
  onMove,
  snapEnabled,
  onInteractionStart,
  onInteractionEnd,
}: {
  person: ScenePerson
  scale: number
  isSelected: boolean
  onSelect: () => void
  onMove: (point: CanvasPoint) => void
  snapEnabled: boolean
  onInteractionStart?: () => void
  onInteractionEnd?: () => void
}) {
  return (
    <>
      <Circle
        draggable
        fill='#22c55e'
        radius={person.radius * GRID_SIZE}
        x={person.x * GRID_SIZE}
        y={person.y * GRID_SIZE}
        dragBoundFunc={(pos) => {
          if (!snapEnabled) return pos
          return {
            x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
            y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
          }
        }}
        onClick={onSelect}
        onDragEnd={(event) => {
          onInteractionEnd?.()
          onMove({
            x: snapEnabled
              ? Math.round(event.target.x() / GRID_SIZE)
              : event.target.x() / GRID_SIZE,
            y: snapEnabled
              ? Math.round(event.target.y() / GRID_SIZE)
              : event.target.y() / GRID_SIZE,
          })
        }}
        onDragStart={onInteractionStart}
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

export function AreaNode({area}: {area: SceneArea}) {
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

export function DrawingPreviewLine({
  anchors,
  preview,
  scale,
}: {
  anchors: CanvasPoint[]
  preview: CanvasPoint | null
  scale: number
}) {
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
