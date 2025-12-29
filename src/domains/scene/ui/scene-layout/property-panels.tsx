import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React, {useMemo} from 'react'

import type {
  SceneBackground,
  SceneCamera,
  ScenePerson,
  SceneShape,
  SceneWall,
} from '../../core/scene-types'

import {
  ColorField,
  NumberField,
  SelectField,
  SliderField,
  SwitchField,
} from './property-controls'

const clamp = (value: number, min?: number, max?: number) => {
  if (typeof min === 'number' && value < min) return min
  if (typeof max === 'number' && value > max) return max
  return value
}

interface WallPanelProps {
  wall: SceneWall
  onChange: (patch: Partial<SceneWall>) => void
}

export const WallPanel: React.FC<WallPanelProps> = ({wall, onChange}) => {
  const updateCoordinates = useCallbackRef(
    (patch: Partial<SceneWall['coordinates']>) => {
      onChange({coordinates: {...wall.coordinates, ...patch}})
    },
  )

  const handleMaterialChange = useCallbackRef((value: string) => {
    onChange({material: value as SceneWall['material']})
  })

  const handleStartXChange = useCallbackRef((value: number) =>
    updateCoordinates({x1: value}),
  )
  const handleStartYChange = useCallbackRef((value: number) =>
    updateCoordinates({y1: value}),
  )
  const handleEndXChange = useCallbackRef((value: number) =>
    updateCoordinates({x2: value}),
  )
  const handleEndYChange = useCallbackRef((value: number) =>
    updateCoordinates({y2: value}),
  )

  const handleHeightChange = useCallbackRef((value: number) =>
    onChange({height: clamp(value, 0)}),
  )
  const handleThicknessChange = useCallbackRef((value: number) =>
    onChange({thickness: clamp(value, 0.01)}),
  )
  const handleColorChange = useCallbackRef((value: string) =>
    onChange({color: value}),
  )
  const handleOpacityChange = useCallbackRef((value: number) =>
    onChange({opacity: clamp(value, 0, 1)}),
  )

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-3'>
        <NumberField
          label='Start X'
          value={wall.coordinates.x1}
          onChange={handleStartXChange}
        />
        <NumberField
          label='Start Y'
          value={wall.coordinates.y1}
          onChange={handleStartYChange}
        />
        <NumberField
          label='End X'
          value={wall.coordinates.x2}
          onChange={handleEndXChange}
        />
        <NumberField
          label='End Y'
          value={wall.coordinates.y2}
          onChange={handleEndYChange}
        />
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <NumberField
          label='Height (m)'
          min={0}
          step={0.1}
          value={wall.height}
          onChange={handleHeightChange}
        />
        <NumberField
          label='Thickness (m)'
          min={0.01}
          step={0.05}
          value={wall.thickness}
          onChange={handleThicknessChange}
        />
      </div>
      <SelectField
        label='Material'
        value={wall.material ?? 'drywall'}
        onChange={handleMaterialChange}
        options={[
          {value: 'drywall', label: 'Drywall'},
          {value: 'concrete', label: 'Concrete'},
        ]}
      />
      <ColorField
        label='Color'
        value={wall.color}
        onChange={handleColorChange}
      />
      <SliderField
        label='Opacity'
        max={1}
        min={0}
        step={0.05}
        value={wall.opacity}
        onChange={handleOpacityChange}
      />
    </div>
  )
}

WallPanel.displayName = 'wall-panel'

interface ShapePanelProps {
  shape: SceneShape
  onChange: (patch: Partial<SceneShape>) => void
}

export const ShapePanel: React.FC<ShapePanelProps> = ({shape, onChange}) => {
  const handleRotationChange = useCallbackRef((value: number) =>
    onChange({rotation: (value * Math.PI) / 180}),
  )

  const handleXChange = useCallbackRef((value: number) => onChange({x: value}))
  const handleYChange = useCallbackRef((value: number) => onChange({y: value}))
  const handleWidthChange = useCallbackRef((value: number) =>
    onChange({width: clamp(value, 0.1)}),
  )
  const handleLengthChange = useCallbackRef((value: number) =>
    onChange({length: clamp(value, 0.1)}),
  )
  const handleHeightChange = useCallbackRef((value: number) =>
    onChange({height: clamp(value, 0)}),
  )
  const handleLineThicknessChange = useCallbackRef((value: number) =>
    onChange({lineThickness: clamp(value, 0)}),
  )
  const handleColorChange = useCallbackRef((value: string) =>
    onChange({color: value}),
  )
  const handleOpacityChange = useCallbackRef((value: number) =>
    onChange({opacity: clamp(value, 0, 1)}),
  )

  const rotationDegrees = useMemo(
    () => (shape.rotation * 180) / Math.PI,
    [shape.rotation],
  )

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-3'>
        <NumberField
          label='X'
          step={0.1}
          value={shape.x}
          onChange={handleXChange}
        />
        <NumberField
          label='Y'
          step={0.1}
          value={shape.y}
          onChange={handleYChange}
        />
        <NumberField
          label='Width'
          min={0.1}
          step={0.1}
          value={shape.width}
          onChange={handleWidthChange}
        />
        <NumberField
          label='Length'
          min={0.1}
          step={0.1}
          value={shape.length}
          onChange={handleLengthChange}
        />
        <NumberField
          label='Height'
          min={0}
          step={0.1}
          value={shape.height}
          onChange={handleHeightChange}
        />
        <NumberField
          label='Line thickness'
          min={0}
          step={0.01}
          value={shape.lineThickness}
          onChange={handleLineThicknessChange}
        />
      </div>
      <SliderField
        label='Rotation (°)'
        max={360}
        min={0}
        step={1}
        value={rotationDegrees}
        onChange={handleRotationChange}
      />
      <ColorField
        label='Color'
        value={shape.color}
        onChange={handleColorChange}
      />
      <SliderField
        label='Opacity'
        max={1}
        min={0}
        step={0.05}
        value={shape.opacity}
        onChange={handleOpacityChange}
      />
    </div>
  )
}

ShapePanel.displayName = 'shape-panel'

interface CameraPanelProps {
  camera: SceneCamera
  onChange: (patch: Partial<SceneCamera>) => void
}

export const CameraPanel: React.FC<CameraPanelProps> = ({camera, onChange}) => {
  const handlePresetChange = useCallbackRef((value: string) => {
    onChange({typePreset: value})
  })
  const handleXChange = useCallbackRef((value: number) => onChange({x: value}))
  const handleYChange = useCallbackRef((value: number) => onChange({y: value}))
  const handleHeightChange = useCallbackRef((value: number) =>
    onChange({height: clamp(value, 0)}),
  )
  const handleZoomChange = useCallbackRef((value: number) =>
    onChange({zoom: clamp(value, 0)}),
  )
  const handleDirectionChange = useCallbackRef((value: number) =>
    onChange({direction: value}),
  )
  const handleFovChange = useCallbackRef((value: number) =>
    onChange({fov: clamp(value, 1, 180)}),
  )
  const handleDepthChange = useCallbackRef((value: number) =>
    onChange({depth: clamp(value, 0)}),
  )
  const handleNearPlaneChange = useCallbackRef((value: number) =>
    onChange({nearPlane: clamp(value, 0)}),
  )
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-3'>
        <NumberField
          label='X'
          step={0.1}
          value={camera.x}
          onChange={handleXChange}
        />
        <NumberField
          label='Y'
          step={0.1}
          value={camera.y}
          onChange={handleYChange}
        />
        <NumberField
          label='Height'
          min={0}
          step={0.1}
          value={camera.height}
          onChange={handleHeightChange}
        />
        <NumberField
          label='Zoom'
          min={0}
          step={0.1}
          value={camera.zoom}
          onChange={handleZoomChange}
        />
      </div>
      <SliderField
        label='Direction (°)'
        max={360}
        min={0}
        step={1}
        value={camera.direction}
        onChange={handleDirectionChange}
      />
      <SliderField
        label='FOV (°)'
        max={180}
        min={1}
        step={1}
        value={camera.fov}
        onChange={handleFovChange}
      />
      <SliderField
        label='Depth (m)'
        max={100}
        min={0}
        step={1}
        value={camera.depth}
        onChange={handleDepthChange}
      />
      <SliderField
        label='Near plane (m)'
        max={5}
        min={0}
        step={0.1}
        value={camera.nearPlane}
        onChange={handleNearPlaneChange}
      />
      <SelectField
        label='Preset'
        value={camera.typePreset}
        onChange={handlePresetChange}
        options={[
          {value: 'fixed', label: 'Fixed'},
          {value: 'ptz', label: 'PTZ'},
          {value: 'wide', label: 'Wide'},
        ]}
      />
    </div>
  )
}

CameraPanel.displayName = 'camera-panel'

interface PersonPanelProps {
  person: ScenePerson
  onChange: (patch: Partial<ScenePerson>) => void
}

export const PersonPanel: React.FC<PersonPanelProps> = ({person, onChange}) => {
  const handleBehaviorChange = useCallbackRef((value: string) => {
    onChange({behavior: value})
  })
  const handleXChange = useCallbackRef((value: number) => onChange({x: value}))
  const handleYChange = useCallbackRef((value: number) => onChange({y: value}))
  const handleRadiusChange = useCallbackRef((value: number) =>
    onChange({radius: clamp(value, 0)}),
  )
  const handleHeightChange = useCallbackRef((value: number) =>
    onChange({height: clamp(value, 0)}),
  )
  const handleSpeedChange = useCallbackRef((value: number) =>
    onChange({speed: clamp(value, 0)}),
  )
  const handleTrailChange = useCallbackRef((checked: boolean) =>
    onChange({trailEnabled: checked}),
  )
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-3'>
        <NumberField
          label='X'
          step={0.1}
          value={person.x}
          onChange={handleXChange}
        />
        <NumberField
          label='Y'
          step={0.1}
          value={person.y}
          onChange={handleYChange}
        />
        <NumberField
          label='Radius'
          min={0}
          step={0.05}
          value={person.radius}
          onChange={handleRadiusChange}
        />
        <NumberField
          label='Height'
          min={0}
          step={0.1}
          value={person.height}
          onChange={handleHeightChange}
        />
        <NumberField
          label='Speed'
          min={0}
          step={0.1}
          value={person.speed}
          onChange={handleSpeedChange}
        />
      </div>
      <SelectField
        label='Movement'
        value={person.behavior}
        onChange={handleBehaviorChange}
        options={[
          {value: 'idle', label: 'Idle'},
          {value: 'random', label: 'Random roam'},
          {value: 'loop', label: 'Loop path'},
        ]}
      />
      <SwitchField
        checked={person.trailEnabled}
        label='Trail enabled'
        onCheckedChange={handleTrailChange}
      />
    </div>
  )
}

PersonPanel.displayName = 'person-panel'

interface BackgroundPanelProps {
  background: SceneBackground
  onChange: (next: SceneBackground) => void
}

export const BackgroundPanel: React.FC<BackgroundPanelProps> = ({
  background,
  onChange,
}) => {
  const position = background.position ?? {x: 0, y: 0}

  const handleOpacity = useCallbackRef((value: number) =>
    onChange({...background, opacity: clamp(value, 0, 1)}),
  )

  const handleScale = useCallbackRef((value: number) =>
    onChange({...background, scale: clamp(value, 0.01)}),
  )

  const handleRotation = useCallbackRef((value: number) =>
    onChange({...background, rotation: value}),
  )

  const handleX = useCallbackRef((value: number) =>
    onChange({...background, position: {...position, x: value}}),
  )
  const handleY = useCallbackRef((value: number) =>
    onChange({...background, position: {...position, y: value}}),
  )

  const handleLocked = useCallbackRef((locked: boolean) =>
    onChange({...background, locked}),
  )

  return (
    <div className='space-y-4'>
      <SliderField
        label='Opacity'
        max={1}
        min={0}
        step={0.05}
        value={background.opacity ?? 1}
        onChange={handleOpacity}
      />
      <NumberField
        label='Scale (m per px)'
        min={0.01}
        step={0.01}
        value={background.scale ?? 1}
        onChange={handleScale}
      />
      <NumberField
        label='Rotation (°)'
        step={1}
        value={background.rotation ?? 0}
        onChange={handleRotation}
      />
      <div className='grid grid-cols-2 gap-3'>
        <NumberField
          label='Position X'
          step={0.1}
          value={position.x}
          onChange={handleX}
        />
        <NumberField
          label='Position Y'
          step={0.1}
          value={position.y}
          onChange={handleY}
        />
      </div>
      <SwitchField
        checked={background.locked ?? false}
        label='Lock background'
        onCheckedChange={handleLocked}
      />
    </div>
  )
}

BackgroundPanel.displayName = 'background-panel'
