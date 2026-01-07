import React from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Plus,
  RotateCcw,
} from 'lucide-react'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Slider} from '@/components/ui/slider'
import {Switch} from '@/components/ui/switch'

import {CAMERA_PRESETS} from '@/features/scene/domain/constants/camera-presets'
import type {PtzPreset} from '@/features/scene/domain/types'
import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'
import {formatMeters} from '@/features/scene/presentation/components/map-view/map-view-helpers'

import {PropertiesSection, PropertiesShell} from './properties-shell'

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const normalizePan = (value: number) => {
  const normalized = ((value % 360) + 360) % 360
  return normalized
}

export const CameraPropertiesSheet: React.FC = () => {
  const openPanels = useUiStore((state) => state.openPanels)
  const openPanel = useUiStore((state) => state.openPanel)
  const closePanel = useUiStore((state) => state.closePanel)

  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)
  const cameras = useSceneStore((state) => state.scene.cameras)
  const updateCamera = useSceneStore((state) => state.updateCamera)

  const isOpen = openPanels['camera-properties'] ?? false
  const selectedCamera = React.useMemo(() => {
    const cameraId = selectedEntityIds.find((id) => id.startsWith('camera-'))
    if (!cameraId) return null
    return cameras.find((camera) => camera.id === cameraId) ?? null
  }, [cameras, selectedEntityIds])

  const [presetName, setPresetName] = React.useState('')
  const [selectedPresetName, setSelectedPresetName] = React.useState<string | null>(
    null,
  )

  const updateSelectedCamera = React.useCallback(
    (updater: (camera: (typeof cameras)[number]) => void) => {
      if (!selectedCamera) return
      updateCamera(selectedCamera.id, updater)
    },
    [selectedCamera, updateCamera],
  )

  const handleColorChange = (value: string) => {
    updateSelectedCamera((camera) => {
      camera.color = value
    })
  }

  const handleDirectionChange = (values: number[]) => {
    const [direction] = values
    updateSelectedCamera((camera) => {
      camera.direction = normalizePan(direction)
      camera.ptz.pan = normalizePan(direction)
    })
  }

  const handleFovChange = (values: number[]) => {
    const [fov] = values
    updateSelectedCamera((camera) => {
      camera.fov = fov
    })
  }

  const handleDepthChange = (values: number[]) => {
    const [depth] = values
    updateSelectedCamera((camera) => {
      camera.depth = depth
    })
  }

  const handleNearClipChange = (values: number[]) => {
    const [nearClipping] = values
    updateSelectedCamera((camera) => {
      camera.nearClipping = nearClipping
    })
  }

  const handleHeightChange = (values: number[]) => {
    const [height] = values
    updateSelectedCamera((camera) => {
      camera.height = height
    })
  }

  const handleResolutionChange = (key: 'width' | 'height', value: string) => {
    const next = Number.parseInt(value, 10)
    if (!Number.isFinite(next) || next <= 0) {
      return
    }
    updateSelectedCamera((camera) => {
      camera.resolution = {...camera.resolution, [key]: next}
    })
  }

  const applyPtz = (next: Partial<{pan: number; tilt: number; zoom: number}>) => {
    updateSelectedCamera((camera) => {
      const limits = camera.ptz.limits
      const pan = normalizePan(next.pan ?? camera.ptz.pan)
      const tilt = clamp(next.tilt ?? camera.ptz.tilt, limits.tiltMin, limits.tiltMax)
      const zoom = clamp(
        next.zoom ?? camera.ptz.zoom,
        limits.zoomMin,
        limits.zoomMax,
      )
      camera.ptz = {...camera.ptz, pan, tilt, zoom}
      camera.direction = pan
      camera.zoom = zoom
    })
  }

  const handleSavePreset = () => {
    if (!selectedCamera) return
    if (!presetName.trim()) return
    if (selectedCamera.ptzPresets.length >= 5) return
    const trimmed = presetName.trim()
    applyPtz({})
    updateSelectedCamera((camera) => {
      const exists = camera.ptzPresets.find((preset) => preset.name === trimmed)
      const nextPreset: PtzPreset = {
        name: trimmed,
        pan: camera.ptz.pan,
        tilt: camera.ptz.tilt,
        zoom: camera.ptz.zoom,
      }
      camera.ptzPresets = exists
        ? camera.ptzPresets.map((preset) =>
            preset.name === trimmed ? nextPreset : preset,
          )
        : [...camera.ptzPresets, nextPreset]
    })
    setPresetName('')
  }

  const handleApplyPreset = (name: string) => {
    if (!selectedCamera) return
    const preset = selectedCamera.ptzPresets.find((item) => item.name === name)
    if (!preset) return
    applyPtz({pan: preset.pan, tilt: preset.tilt, zoom: preset.zoom})
    setSelectedPresetName(name)
  }

  const handleResetPtz = () => {
    applyPtz({pan: 0, tilt: 0, zoom: 1})
  }

  const handleKeyboard = React.useCallback(
    (event: KeyboardEvent) => {
      if (!selectedCamera) return
      if (
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' ||
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight' ||
        event.key === '+' ||
        event.key === '-' ||
        event.key === '=' ||
        event.key === '0'
      ) {
        event.preventDefault()
      }
      if (event.key === 'ArrowUp') {
        applyPtz({tilt: selectedCamera.ptz.tilt + 5})
      }
      if (event.key === 'ArrowDown') {
        applyPtz({tilt: selectedCamera.ptz.tilt - 5})
      }
      if (event.key === 'ArrowLeft') {
        applyPtz({pan: selectedCamera.ptz.pan - 5})
      }
      if (event.key === 'ArrowRight') {
        applyPtz({pan: selectedCamera.ptz.pan + 5})
      }
      if (event.key === '+' || event.key === '=') {
        applyPtz({zoom: selectedCamera.ptz.zoom + 0.1})
      }
      if (event.key === '-') {
        applyPtz({zoom: selectedCamera.ptz.zoom - 0.1})
      }
      if (event.key === '0') {
        handleResetPtz()
      }
    },
    [applyPtz, handleResetPtz, selectedCamera],
  )

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [handleKeyboard])

  const panDegrees = selectedCamera ? normalizePan(selectedCamera.ptz.pan) : 0

  const cameraName =
    (selectedCamera?.name ?? selectedCamera?.id ?? '').toString()

  return (
    <PropertiesShell
      open={isOpen}
      onOpenChange={(open) =>
        open ? openPanel('camera-properties') : closePanel('camera-properties')
      }
      title='Camera Properties'
      entityId={selectedCamera?.id}
      entityName={selectedCamera?.name}
      accentColor={selectedCamera?.color}
    >
      {selectedCamera ? (
        <div className='space-y-6'>
          <PropertiesSection title='General'>
            <div className='space-y-2'>
              <Label htmlFor='camera-name'>Name</Label>
              <Input
                id='camera-name'
                value={cameraName}
                onChange={(event) =>
                  updateSelectedCamera((camera) => {
                    camera.name = event.target.value
                  })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='camera-preset'>Type Preset</Label>
              <Select
                value={selectedCamera.typePreset}
                onValueChange={(value) => {
                  const preset = CAMERA_PRESETS.find((item) => item.id === value)
                  if (!preset) return
                  updateSelectedCamera((camera) => {
                    camera.typePreset = value
                    camera.fov = preset.fov
                    camera.depth = preset.depth
                    camera.nearClipping = preset.nearClipping
                    camera.resolution = preset.resolution
                    camera.height = preset.height
                    camera.zoom = preset.zoom
                    camera.ptz = {...camera.ptz, zoom: preset.zoom}
                  })
                }}
              >
                <SelectTrigger id='camera-preset'>
                  <SelectValue placeholder='Select preset' />
                </SelectTrigger>
                <SelectContent>
                  {CAMERA_PRESETS.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='camera-color'>Color</Label>
              <Input
                id='camera-color'
                type='color'
                value={selectedCamera.color}
                onChange={(event) => handleColorChange(event.target.value)}
              />
            </div>
          </PropertiesSection>

          <PropertiesSection title='Position'>
            <div className='space-y-2'>
              <Label>Height ({selectedCamera.height.toFixed(2)} m)</Label>
              <Slider
                max={20}
                min={0.5}
                step={0.1}
                value={[selectedCamera.height]}
                onValueChange={handleHeightChange}
              />
            </div>
            <div className='space-y-2'>
              <Label>Direction ({selectedCamera.direction.toFixed(0)}°)</Label>
              <Slider
                max={360}
                min={0}
                step={1}
                value={[selectedCamera.direction]}
                onValueChange={handleDirectionChange}
              />
            </div>
          </PropertiesSection>

          <PropertiesSection title='Optics'>
            <div className='space-y-2'>
              <Label>Field of View ({selectedCamera.fov.toFixed(0)}°)</Label>
              <Slider
                max={180}
                min={10}
                step={1}
                value={[selectedCamera.fov]}
                onValueChange={handleFovChange}
              />
            </div>
            <div className='space-y-2'>
              <Label>Depth ({formatMeters(selectedCamera.depth)})</Label>
              <Slider
                max={200}
                min={1}
                step={1}
                value={[selectedCamera.depth]}
                onValueChange={handleDepthChange}
              />
            </div>
            <div className='space-y-2'>
              <Label>
                Near Clipping ({selectedCamera.nearClipping.toFixed(2)} m)
              </Label>
              <Slider
                max={5}
                min={0.1}
                step={0.1}
                value={[selectedCamera.nearClipping]}
                onValueChange={handleNearClipChange}
              />
            </div>
            <div className='space-y-2'>
              <Label>Resolution</Label>
              <div className='flex items-center gap-2'>
                <Input
                  type='number'
                  min={1}
                  value={selectedCamera.resolution.width}
                  onChange={(event) =>
                    handleResolutionChange('width', event.target.value)
                  }
                  aria-label='Resolution width'
                />
                <div className='px-2 text-sm text-muted-foreground'>×</div>
                <Input
                  type='number'
                  min={1}
                  value={selectedCamera.resolution.height}
                  onChange={(event) =>
                    handleResolutionChange('height', event.target.value)
                  }
                  aria-label='Resolution height'
                />
              </div>
            </div>
          </PropertiesSection>

          <PropertiesSection title='PTZ Controls'>
            <PtzDpad
              color={selectedCamera.color}
              onPan={(delta) => applyPtz({pan: selectedCamera.ptz.pan + delta})}
              onTilt={(delta) => applyPtz({tilt: selectedCamera.ptz.tilt + delta})}
            />
            <div className='space-y-2'>
              <Label>Pan ({panDegrees.toFixed(0)}°)</Label>
              <Slider
                max={360}
                min={0}
                step={1}
                value={[panDegrees]}
                onValueChange={(values) => applyPtz({pan: values[0] ?? panDegrees})}
              />
            </div>
            <div className='space-y-2'>
              <Label>
                Tilt ({selectedCamera.ptz.tilt.toFixed(0)}°)
              </Label>
              <Slider
                max={selectedCamera.ptz.limits.tiltMax}
                min={selectedCamera.ptz.limits.tiltMin}
                step={1}
                value={[selectedCamera.ptz.tilt]}
                onValueChange={(values) => applyPtz({tilt: values[0] ?? 0})}
              />
            </div>
            <div className='space-y-2'>
              <Label>Zoom ({selectedCamera.ptz.zoom.toFixed(1)}x)</Label>
              <Slider
                max={selectedCamera.ptz.limits.zoomMax}
                min={selectedCamera.ptz.limits.zoomMin}
                step={0.1}
                value={[selectedCamera.ptz.zoom]}
                onValueChange={(values) => applyPtz({zoom: values[0] ?? 1})}
              />
            </div>
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='sm' onClick={handleResetPtz}>
                <RotateCcw className='mr-2 size-4' />
                Reset
              </Button>
              <Select
                value={selectedPresetName ?? undefined}
                onValueChange={(value) => handleApplyPreset(value)}
              >
                <SelectTrigger className='w-40'>
                  <SelectValue placeholder='Preset' />
                </SelectTrigger>
                <SelectContent>
                  {selectedCamera.ptzPresets.map((preset) => (
                    <SelectItem key={preset.name} value={preset.name}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center gap-2'>
              <Input
                placeholder='Save preset name'
                value={presetName}
                onChange={(event) => setPresetName(event.target.value)}
              />
              <Button
                variant='secondary'
                size='icon'
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
              >
                <Plus className='size-4' />
              </Button>
            </div>
          </PropertiesSection>

          <PropertiesSection title='Advanced'>
            <div className='flex items-center justify-between rounded-md border p-3'>
              <div className='space-y-1'>
                <p className='text-sm font-medium'>Show Collisions</p>
                <p className='text-xs text-muted-foreground'>
                  Toggle collision visualization for this camera.
                </p>
              </div>
              <Switch
                checked={selectedCamera.showCollisions}
                onCheckedChange={(checked) =>
                  updateSelectedCamera((camera) => {
                    camera.showCollisions = checked
                  })
                }
              />
            </div>
          </PropertiesSection>
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>
          Select a camera to edit its properties.
        </p>
      )}
    </PropertiesShell>
  )
}

interface PtzDpadProps {
  onPan: (delta: number) => void
  onTilt: (delta: number) => void
  color: string
}

const PtzDpad: React.FC<PtzDpadProps> = ({onPan, onTilt, color}) => (
  <div className='grid grid-cols-3 gap-2 rounded-md border p-3'>
    <div />
    <Button variant='secondary' size='icon' onClick={() => onTilt(5)}>
      <ArrowUp className='size-4' />
    </Button>
    <div />

    <Button variant='secondary' size='icon' onClick={() => onPan(-5)}>
      <ArrowLeft className='size-4' />
    </Button>
    <div className='flex items-center justify-center'>
      <span
        className='block size-4 rounded-full'
        style={{backgroundColor: color}}
      />
    </div>
    <Button variant='secondary' size='icon' onClick={() => onPan(5)}>
      <ArrowRight className='size-4' />
    </Button>

    <div />
    <Button variant='secondary' size='icon' onClick={() => onTilt(-5)}>
      <ArrowDown className='size-4' />
    </Button>
    <div />
  </div>
)
