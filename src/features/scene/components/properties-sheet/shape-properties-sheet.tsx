import {lineString, length as turfLength} from '@turf/turf'
import React from 'react'

import type {SceneRoot, ShapeEntity} from '@/features/scene/types/types'

import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Slider} from '@/components/ui/slider'
import {useSceneStore} from '@/features/scene/state/scene.store'
import {useUiStore} from '@/features/scene/state/ui.store'
import {
  computeAngleDeg,
  computeSegmentLength,
  createCircleRing,
  formatMeters,
} from '@/features/scene/map/map-view-helpers'
import {
  computeBounds,
  getBoundsCenter,
  scalePoints,
} from '@/features/scene/map/selection-geometry'
import {useFrameSceneUpdate} from '@/features/scene/hooks/use-frame-scene-update'
import {useHistoryRecorder} from '@/features/scene/hooks/use-history-recorder'

import {
  PropertiesDeleteAction,
  PropertiesSection,
  PropertiesShell,
} from './properties-shell'

interface MetricProps {
  label: string
  value: string
}

const Metric: React.FC<MetricProps> = ({label, value}) => (
  <div className='vs:space-y-1 vs:rounded-md vs:border vs:p-3'>
    <p className='vs:text-xs vs:text-muted-foreground'>{label}</p>
    <p className='vs:text-sm vs:font-semibold'>{value}</p>
  </div>
)

// eslint-disable-next-line max-lines-per-function
export const ShapePropertiesSheet: React.FC = () => {
  const {recordAction, recordActionDebounced} = useHistoryRecorder()
  const openPanels = useUiStore((state) => state.openPanels)
  const openPanel = useUiStore((state) => state.openPanel)
  const closePanel = useUiStore((state) => state.closePanel)

  const clearSelection = useSceneStore((state) => state.clearSelection)
  const deleteEntities = useSceneStore((state) => state.deleteEntities)
  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)
  const shapes = useSceneStore((state) => state.scene.shapes)
  const updateScene = useSceneStore((state) => state.updateScene)
  const {scheduleSceneUpdate} = useFrameSceneUpdate({updateScene})

  const isPanelOpen = openPanels['shape-properties'] ?? false
  const selectedShape = React.useMemo(() => {
    const shapeId = selectedEntityIds.find((id) => id.startsWith('shape-'))
    if (!shapeId) return null
    return shapes.find((shape) => shape.id === shapeId) ?? null
  }, [selectedEntityIds, shapes])
  const isOpen = isPanelOpen && Boolean(selectedShape)

  const updateSelectedShape = React.useCallback(
    (
      updater: (shape: (typeof shapes)[number]) => void,
      onApplied?: (scene: SceneRoot) => void,
    ) => {
      if (!selectedShape) {
        return
      }
      scheduleSceneUpdate((scene) => {
        const target = scene.shapes.find(
          (shape) => shape.id === selectedShape.id,
        )
        if (target) {
          updater(target)
        }
      }, onApplied)
    },
    [scheduleSceneUpdate, selectedShape],
  )

  const getCenter = React.useCallback((shape: ShapeEntity) => {
    const bounds = computeBounds(shape.geometry)
    if (bounds) {
      return getBoundsCenter(bounds)
    }
    return shape.geometry[0] ?? [0, 0]
  }, [])

  const handleHeightChange = (values: number[]) => {
    if (!selectedShape) return
    const [height] = values
    const shapeId = selectedShape.id
    updateSelectedShape(
      (shape) => {
        shape.height = height
      },
      (updated) => {
        recordActionDebounced(
          `shape-${shapeId}`,
          {type: 'update', entity: 'shape'},
          updated,
        )
      },
    )
  }

  const handleColorChange = (value: string) => {
    if (!selectedShape) return
    const shapeId = selectedShape.id
    updateSelectedShape(
      (shape) => {
        shape.color = value
      },
      (updated) => {
        recordActionDebounced(
          `shape-${shapeId}`,
          {type: 'update', entity: 'shape'},
          updated,
        )
      },
    )
  }

  const handleScale = (scaleX: number, scaleY: number) => {
    if (!selectedShape) return
    const shapeId = selectedShape.id
    const center = getCenter(selectedShape)
    updateSelectedShape(
      (shape) => {
        shape.geometry = scalePoints(shape.geometry, center, scaleX, scaleY)
      },
      (updated) => {
        recordActionDebounced(
          `shape-${shapeId}`,
          {type: 'update', entity: 'shape'},
          updated,
        )
      },
    )
  }

  const handleThicknessChange = (values: number[]) => {
    if (!selectedShape) return
    const [thickness] = values
    const shapeId = selectedShape.id
    updateSelectedShape(
      (shape) => {
        if (shape.shapeType === 'line') {
          ;(shape as {thickness?: number}).thickness = thickness
        }
      },
      (updated) => {
        recordActionDebounced(
          `shape-${shapeId}`,
          {type: 'update', entity: 'shape'},
          updated,
        )
      },
    )
  }

  const bounds = selectedShape ? computeBounds(selectedShape.geometry) : null
  const center = selectedShape && bounds ? getBoundsCenter(bounds) : null

  const rectDimensions = React.useMemo(() => {
    if (!selectedShape || selectedShape.shapeType !== 'rectangle' || !bounds) {
      return {width: 0, height: 0}
    }
    const width = computeSegmentLength([
      [bounds.minLng, bounds.minLat],
      [bounds.maxLng, bounds.minLat],
    ])
    const height = computeSegmentLength([
      [bounds.minLng, bounds.minLat],
      [bounds.minLng, bounds.maxLat],
    ])
    return {width, height}
  }, [bounds, selectedShape])

  const circleRadius = React.useMemo(() => {
    if (!selectedShape || selectedShape.shapeType !== 'circle' || !bounds) {
      return 0
    }
    const diameter = computeSegmentLength([
      [bounds.minLng, bounds.minLat],
      [bounds.maxLng, bounds.minLat],
    ])
    return diameter / 2
  }, [bounds, selectedShape])

  const triangleBaseHeight = React.useMemo(() => {
    if (!selectedShape || selectedShape.shapeType !== 'triangle') {
      return {base: 0, height: 0}
    }
    const pts = selectedShape.geometry.slice(0, 3)
    if (pts.length < 3) {
      return {base: 0, height: 0}
    }
    const base = computeSegmentLength([pts[0], pts[1]])
    const third = pts[2]
    const midpoint: [number, number] = [
      (pts[0][0] + pts[1][0]) / 2,
      (pts[0][1] + pts[1][1]) / 2,
    ]
    const height = computeSegmentLength([midpoint, third])
    return {base, height}
  }, [selectedShape])

  const lineMetrics = React.useMemo(() => {
    if (!selectedShape || selectedShape.shapeType !== 'line') {
      return {length: 0, angle: 0, thickness: 0}
    }
    const pts = selectedShape.geometry.slice(0, 2)
    const length =
      pts.length === 2
        ? turfLength(lineString(pts), {units: 'kilometers'}) * 1000
        : 0
    const angle = pts.length === 2 ? computeAngleDeg(pts[0], pts[1]) : 0
    const thickness = (selectedShape as {thickness?: number}).thickness ?? 0.1
    return {length, angle, thickness}
  }, [selectedShape])

  const handleDeleteShape = () => {
    if (!selectedShape) {
      return
    }
    const updated = deleteEntities([selectedShape.id])
    recordAction({type: 'delete', entity: 'shape', count: 1}, updated)
    clearSelection()
    closePanel('shape-properties')
  }

  return (
    <PropertiesShell
      entityId={selectedShape?.id}
      title='Shape Properties'
      accentColor={selectedShape?.color}
      actions={
        selectedShape ? (
          <PropertiesDeleteAction
            confirmDescription='This shape will be permanently removed.'
            confirmTitle='Delete shape?'
            onConfirm={handleDeleteShape}
          />
        ) : null
      }
      onOpenChange={(open) =>
        open ? openPanel('shape-properties') : closePanel('shape-properties')
      }
      open={isOpen}
    >
      {selectedShape ? (
        <div className='vs:space-y-6'>
          <p className='vs:text-xs vs:text-muted-foreground'>
            Position and rotation adjustments are disabled here to prevent
            shapes from exceeding area bounds.
          </p>

          <PropertiesSection title='Appearance'>
            <div className='vs:space-y-2'>
              <Label htmlFor='shape-color'>Color</Label>
              <Input
                id='shape-color'
                type='color'
                value={selectedShape.color}
                onChange={(event) => handleColorChange(event.target.value)}
              />
            </div>
            <div className='vs:space-y-2'>
              <Label>Height ({selectedShape.height.toFixed(2)} m)</Label>
              <Slider
                max={10}
                min={0}
                step={0.1}
                value={[selectedShape.height]}
                onValueChange={handleHeightChange}
              />
            </div>
          </PropertiesSection>

          {selectedShape.shapeType === 'rectangle' ? (
            <PropertiesSection title='Rectangle'>
              <div className='vs:grid vs:grid-cols-2 vs:gap-3'>
                <Metric
                  label='Width'
                  value={formatMeters(rectDimensions.width)}
                />
                <Metric
                  label='Height'
                  value={formatMeters(rectDimensions.height)}
                />
              </div>
              <div className='vs:grid vs:grid-cols-2 vs:gap-3'>
                <div className='vs:space-y-2'>
                  <Label>Width (m)</Label>
                  <Input
                    type='number'
                    value={rectDimensions.width.toFixed(2)}
                    inputMode='decimal'
                    onChange={(event) => {
                      const next = Number.parseFloat(event.target.value)
                      if (!Number.isFinite(next) || rectDimensions.width === 0)
                        return
                      handleScale(next / rectDimensions.width, 1)
                    }}
                  />
                </div>
                <div className='vs:space-y-2'>
                  <Label>Height (m)</Label>
                  <Input
                    type='number'
                    value={rectDimensions.height.toFixed(2)}
                    inputMode='decimal'
                    onChange={(event) => {
                      const next = Number.parseFloat(event.target.value)
                      if (!Number.isFinite(next) || rectDimensions.height === 0)
                        return
                      handleScale(1, next / rectDimensions.height)
                    }}
                  />
                </div>
              </div>
            </PropertiesSection>
          ) : null}

          {selectedShape.shapeType === 'circle' ? (
            <PropertiesSection title='Circle'>
              <div className='vs:grid vs:grid-cols-2 vs:gap-3'>
                <Metric label='Radius' value={formatMeters(circleRadius)} />
                <Metric
                  label='Diameter'
                  value={formatMeters(circleRadius * 2)}
                />
              </div>
              <div className='vs:space-y-2'>
                <Label>Radius (m)</Label>
                <Input
                  type='number'
                  value={circleRadius.toFixed(2)}
                  inputMode='decimal'
                  onChange={(event) => {
                    const next = Number.parseFloat(event.target.value)
                    if (!Number.isFinite(next) || !center) return
                    const shapeId = selectedShape.id
                    updateSelectedShape(
                      (shape) => {
                        shape.geometry = createCircleRing(center, next)
                      },
                      (updated) => {
                        recordActionDebounced(
                          `shape-${shapeId}`,
                          {type: 'update', entity: 'shape'},
                          updated,
                        )
                      },
                    )
                  }}
                />
              </div>
            </PropertiesSection>
          ) : null}

          {selectedShape.shapeType === 'triangle' ? (
            <PropertiesSection title='Triangle'>
              <div className='vs:grid vs:grid-cols-2 vs:gap-3'>
                <Metric
                  label='Base'
                  value={formatMeters(triangleBaseHeight.base)}
                />
                <Metric
                  label='Height'
                  value={formatMeters(triangleBaseHeight.height)}
                />
              </div>
            </PropertiesSection>
          ) : null}

          {selectedShape.shapeType === 'line' ? (
            <PropertiesSection title='Line'>
              <div className='vs:grid vs:grid-cols-2 vs:gap-3'>
                <Metric
                  label='Length'
                  value={formatMeters(lineMetrics.length)}
                />
                <Metric
                  label='Angle'
                  value={`${lineMetrics.angle.toFixed(0)}°`}
                />
              </div>
              <div className='vs:space-y-2'>
                <Label>Thickness ({lineMetrics.thickness.toFixed(2)} m)</Label>
                <Slider
                  max={2}
                  min={0.01}
                  step={0.01}
                  value={[lineMetrics.thickness]}
                  onValueChange={handleThicknessChange}
                />
              </div>
            </PropertiesSection>
          ) : null}
        </div>
      ) : (
        <p className='vs:text-sm vs:text-muted-foreground'>
          Select a shape to edit its properties.
        </p>
      )}
    </PropertiesShell>
  )
}
