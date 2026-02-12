import {debounce} from '@lodash-es'
import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Plus,
  RotateCcw,
} from 'lucide-react'
import React from 'react'

import type {CameraEntity, PtzPreset} from '@/features/scene/domain/types'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {Slider} from '@/components/ui/slider'
import {useUpdateDevice} from '@/data-provider/api/services/v2/device'
import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'
import {formatMeters} from '@/features/scene/presentation/components/map-view/map-view-helpers'
import {useHistoryRecorder} from '@/features/scene/presentation/hooks/use-history-recorder'
import {mergeCameraFeaturesWithCamera} from '@/features/scene/presentation/utils/camera-device-features'

import {PropertiesSection, PropertiesShell} from './properties-shell'

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const normalizePan = (value: number) => {
  const normalized = ((value % 360) + 360) % 360
  return normalized
}

interface PtzDpadProps {
  onPan: (delta: number) => void
  onTilt: (delta: number) => void
  color: string
}

const PtzDpad: React.FC<PtzDpadProps> = ({onPan, onTilt, color}) => (
  <div className='grid grid-cols-3 gap-2 rounded-md border p-3 '>
    <div />
    <div className='flex items-center justify-center'>
      <Button size='icon' variant='secondary' onClick={() => onTilt(5)}>
        <ArrowUp className='size-4' />
      </Button>
    </div>
    <div />

    <div className='flex items-center justify-center'>
      <Button size='icon' variant='secondary' onClick={() => onPan(-5)}>
        <ArrowLeft className='size-4' />
      </Button>
    </div>

    <div className='flex items-center justify-center '>
      <span
        className='block size-4 rounded-full'
        style={{backgroundColor: color}}
      />
    </div>

    <div className='flex items-center justify-center'>
      <Button size='icon' variant='secondary' onClick={() => onPan(5)}>
        <ArrowRight className='size-4' />
      </Button>
    </div>

    <div />

    <div className='flex items-center justify-center'>
      <Button size='icon' variant='secondary' onClick={() => onTilt(-5)}>
        <ArrowDown className='size-4' />
      </Button>
    </div>
    <div />
  </div>
)

// eslint-disable-next-line max-lines-per-function, max-statements
export const CameraPropertiesSheet: React.FC = () => {
  const {recordActionDebounced} = useHistoryRecorder()
  const {mutate: updateDevice} = useUpdateDevice()
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
  const [selectedPresetName, setSelectedPresetName] = React.useState<
    string | null
  >(null)
  const liveUpdateFrameRef = React.useRef<number | null>(null)
  const pendingLiveCameraUpdaterRef = React.useRef<
    ((camera: CameraEntity) => void) | null
  >(null)

  const updateSelectedCamera = React.useCallback(
    (updater: (camera: CameraEntity) => void) => {
      if (!selectedCamera) return
      return updateCamera(selectedCamera.id, updater)
    },
    [selectedCamera, updateCamera],
  )

  const recordCameraUpdate = useCallbackRef(
    (updated?: ReturnType<typeof updateCamera>) => {
      if (!updated || !selectedCamera) {
        return
      }
      recordActionDebounced(
        `camera-${selectedCamera.id}`,
        {type: 'update', entity: 'camera'},
        updated,
      )
    },
  )

  const syncDeviceFeatures = useCallbackRef((camera: CameraEntity) => {
    if (
      !camera.sourceDeviceId ||
      camera.sourceDeviceId.startsWith('virtual-')
    ) {
      return
    }

    updateDevice({
      deviceId: camera.sourceDeviceId,
      data: {
        features: mergeCameraFeaturesWithCamera(camera),
      },
    })
  })

  const debouncedSyncDeviceFeatures = React.useMemo(
    () => debounce((camera: CameraEntity) => syncDeviceFeatures(camera), 800),
    [syncDeviceFeatures],
  )

  React.useEffect(
    () => () => {
      debouncedSyncDeviceFeatures.cancel()
    },
    [debouncedSyncDeviceFeatures],
  )

  const queueDeviceSync = useCallbackRef(
    (updated?: ReturnType<typeof updateCamera>) => {
      if (!updated || !selectedCamera) {
        return
      }

      const nextCamera = updated.cameras.find(
        (camera) => camera.id === selectedCamera.id,
      )
      if (!nextCamera) {
        return
      }

      debouncedSyncDeviceFeatures(nextCamera)
    },
  )

  const applyCameraUpdateLive = useCallbackRef(
    (updater: (camera: CameraEntity) => void) => {
      pendingLiveCameraUpdaterRef.current = updater

      if (liveUpdateFrameRef.current !== null) {
        return
      }

      if (typeof window === 'undefined') {
        const nextUpdater = pendingLiveCameraUpdaterRef.current
        pendingLiveCameraUpdaterRef.current = null
        if (!nextUpdater) {
          return
        }
        updateSelectedCamera(nextUpdater)
        return
      }

      liveUpdateFrameRef.current = window.requestAnimationFrame(() => {
        liveUpdateFrameRef.current = null
        const nextUpdater = pendingLiveCameraUpdaterRef.current
        pendingLiveCameraUpdaterRef.current = null
        if (!nextUpdater) {
          return
        }
        updateSelectedCamera(nextUpdater)
      })
    },
  )

  React.useEffect(
    () => () => {
      if (
        typeof window !== 'undefined' &&
        liveUpdateFrameRef.current !== null
      ) {
        window.cancelAnimationFrame(liveUpdateFrameRef.current)
      }
      pendingLiveCameraUpdaterRef.current = null
    },
    [],
  )

  const commitCameraUpdate = useCallbackRef(
    (updater: (camera: CameraEntity) => void) => {
      const updated = updateSelectedCamera((camera) => {
        updater(camera)
      })
      recordCameraUpdate(updated)
      queueDeviceSync(updated)
      return updated
    },
  )

  const handleColorChange = (value: string) => {
    commitCameraUpdate((camera) => {
      camera.color = value
    })
  }

  const handleDirectionLiveChange = (values: number[]) => {
    const [direction] = values
    if (!Number.isFinite(direction)) {
      return
    }
    applyCameraUpdateLive((camera) => {
      camera.direction = normalizePan(direction)
      camera.ptz.pan = normalizePan(direction)
    })
  }

  const handleDirectionChange = (values: number[]) => {
    const [direction] = values
    if (!Number.isFinite(direction)) {
      return
    }
    commitCameraUpdate((camera) => {
      camera.direction = normalizePan(direction)
      camera.ptz.pan = normalizePan(direction)
    })
  }

  const handleHorizontalFovLiveChange = (values: number[]) => {
    const [fovHorizontal] = values
    if (!Number.isFinite(fovHorizontal)) {
      return
    }
    applyCameraUpdateLive((camera) => {
      camera.fovHorizontal = fovHorizontal
    })
  }

  const handleHorizontalFovChange = (values: number[]) => {
    const [fovHorizontal] = values
    if (!Number.isFinite(fovHorizontal)) {
      return
    }
    commitCameraUpdate((camera) => {
      camera.fovHorizontal = fovHorizontal
    })
  }

  const handleVerticalFovLiveChange = (values: number[]) => {
    const [fovVertical] = values
    if (!Number.isFinite(fovVertical)) {
      return
    }
    applyCameraUpdateLive((camera) => {
      camera.fovVertical = fovVertical
    })
  }

  const handleVerticalFovChange = (values: number[]) => {
    const [fovVertical] = values
    if (!Number.isFinite(fovVertical)) {
      return
    }
    commitCameraUpdate((camera) => {
      camera.fovVertical = fovVertical
    })
  }

  const handleDepthLiveChange = (values: number[]) => {
    const [depth] = values
    if (!Number.isFinite(depth)) {
      return
    }
    applyCameraUpdateLive((camera) => {
      camera.depth = depth
    })
  }

  const handleDepthChange = (values: number[]) => {
    const [depth] = values
    if (!Number.isFinite(depth)) {
      return
    }
    commitCameraUpdate((camera) => {
      camera.depth = depth
    })
  }

  const handleHeightLiveChange = (values: number[]) => {
    const [height] = values
    if (!Number.isFinite(height)) {
      return
    }
    applyCameraUpdateLive((camera) => {
      camera.height = height
    })
  }

  const handleHeightChange = (values: number[]) => {
    const [height] = values
    if (!Number.isFinite(height)) {
      return
    }
    commitCameraUpdate((camera) => {
      camera.height = height
    })
  }

  const handleResolutionChange = (key: 'height' | 'width', value: string) => {
    const next = Number.parseInt(value, 10)
    if (!Number.isFinite(next) || next <= 0) {
      return
    }

    commitCameraUpdate((camera) => {
      camera.resolution = {...camera.resolution, [key]: next}
    })
  }

  const applyPtz = (
    next: Partial<{pan: number; tilt: number; zoom: number}>,
  ) => {
    commitCameraUpdate((camera) => {
      const limits = camera.ptz.limits
      const pan = normalizePan(next.pan ?? camera.ptz.pan)
      const tilt = clamp(
        next.tilt ?? camera.ptz.tilt,
        limits.tiltMin,
        limits.tiltMax,
      )
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

  const applyPtzLive = (
    next: Partial<{pan: number; tilt: number; zoom: number}>,
  ) => {
    applyCameraUpdateLive((camera) => {
      const limits = camera.ptz.limits
      const pan = normalizePan(next.pan ?? camera.ptz.pan)
      const tilt = clamp(
        next.tilt ?? camera.ptz.tilt,
        limits.tiltMin,
        limits.tiltMax,
      )
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

    commitCameraUpdate((camera) => {
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

  // NOTE: PTZ keyboard shortcuts are intentionally disabled for now.
  // Do not re-enable this without an explicit product request.
  const ptzKeyboardShortcutsEnabled = false

  // eslint-disable-next-line complexity
  const handleKeyboard = useCallbackRef((event: KeyboardEvent) => {
    if (!ptzKeyboardShortcutsEnabled) return
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
  })

  React.useEffect(() => {
    if (!ptzKeyboardShortcutsEnabled) {
      return
    }
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [handleKeyboard, ptzKeyboardShortcutsEnabled])

  const panDegrees = selectedCamera ? normalizePan(selectedCamera.ptz.pan) : 0

  const cameraName = (
    selectedCamera?.name ??
    selectedCamera?.id ??
    ''
  ).toString()

  return (
    <PropertiesShell
      entityId={selectedCamera?.id}
      entityName={selectedCamera?.name}
      title='Camera Properties'
      accentColor={selectedCamera?.color}
      onOpenChange={(open) =>
        open ? openPanel('camera-properties') : closePanel('camera-properties')
      }
      open={isOpen}
    >
      {selectedCamera ? (
        <div className='space-y-6'>
          <PropertiesSection title='General'>
            <div className='space-y-2'>
              <Label htmlFor='camera-name'>Name</Label>
              <Input
                id='camera-name'
                value={cameraName}
                onChange={(event) => {
                  commitCameraUpdate((camera) => {
                    camera.name = event.target.value
                  })
                }}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='camera-source-device'>Source Device</Label>
              <Input
                readOnly
                id='camera-source-device'
                value={
                  selectedCamera.sourceDeviceName ||
                  selectedCamera.sourceDeviceId
                }
              />
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
                onValueChange={handleHeightLiveChange}
                onValueCommit={handleHeightChange}
              />
            </div>
            <div className='space-y-2'>
              <Label>Direction ({selectedCamera.direction.toFixed(0)}°)</Label>
              <Slider
                max={360}
                min={0}
                step={1}
                value={[selectedCamera.direction]}
                onValueChange={handleDirectionLiveChange}
                onValueCommit={handleDirectionChange}
              />
            </div>
          </PropertiesSection>

          <PropertiesSection title='Optics'>
            <div className='space-y-2'>
              <Label>
                Horizontal FOV ({selectedCamera.fovHorizontal.toFixed(0)}°)
              </Label>
              <Slider
                max={180}
                min={1}
                step={1}
                value={[selectedCamera.fovHorizontal]}
                onValueChange={handleHorizontalFovLiveChange}
                onValueCommit={handleHorizontalFovChange}
              />
            </div>
            <div className='space-y-2'>
              <Label>
                Vertical FOV ({selectedCamera.fovVertical.toFixed(0)}°)
              </Label>
              <Slider
                max={180}
                min={1}
                step={1}
                value={[selectedCamera.fovVertical]}
                onValueChange={handleVerticalFovLiveChange}
                onValueCommit={handleVerticalFovChange}
              />
            </div>
            <div className='space-y-2'>
              <Label>Depth ({formatMeters(selectedCamera.depth)})</Label>
              <Slider
                max={200}
                min={1}
                step={1}
                value={[selectedCamera.depth]}
                onValueChange={handleDepthLiveChange}
                onValueCommit={handleDepthChange}
              />
            </div>
            <div className='space-y-2'>
              <Label>Resolution</Label>
              <div className='flex items-center gap-2'>
                <Input
                  aria-label='Resolution width'
                  min={1}
                  type='number'
                  value={selectedCamera.resolution.width}
                  onChange={(event) =>
                    handleResolutionChange('width', event.target.value)
                  }
                />
                <div className='px-2 text-sm text-muted-foreground'>×</div>
                <Input
                  aria-label='Resolution height'
                  min={1}
                  type='number'
                  value={selectedCamera.resolution.height}
                  onChange={(event) =>
                    handleResolutionChange('height', event.target.value)
                  }
                />
              </div>
            </div>
          </PropertiesSection>

          <PropertiesSection title='PTZ Controls'>
            <PtzDpad
              color={selectedCamera.color}
              onPan={(delta) => applyPtz({pan: selectedCamera.ptz.pan + delta})}
              onTilt={(delta) =>
                applyPtz({tilt: selectedCamera.ptz.tilt + delta})
              }
            />
            <div className='space-y-2'>
              <Label>Pan ({panDegrees.toFixed(0)}°)</Label>
              <Slider
                max={360}
                min={0}
                step={1}
                value={[panDegrees]}
                onValueChange={(values) =>
                  applyPtzLive({pan: values[0] ?? panDegrees})
                }
                onValueCommit={(values) =>
                  applyPtz({pan: values[0] ?? panDegrees})
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Tilt ({selectedCamera.ptz.tilt.toFixed(0)}°)</Label>
              <Slider
                max={selectedCamera.ptz.limits.tiltMax}
                min={selectedCamera.ptz.limits.tiltMin}
                step={1}
                value={[selectedCamera.ptz.tilt]}
                onValueChange={(values) => applyPtzLive({tilt: values[0] ?? 0})}
                onValueCommit={(values) => applyPtz({tilt: values[0] ?? 0})}
              />
            </div>
            <div className='space-y-2'>
              <Label>Zoom ({selectedCamera.ptz.zoom.toFixed(1)}x)</Label>
              <Slider
                max={selectedCamera.ptz.limits.zoomMax}
                min={selectedCamera.ptz.limits.zoomMin}
                step={0.1}
                value={[selectedCamera.ptz.zoom]}
                onValueChange={(values) => applyPtzLive({zoom: values[0] ?? 1})}
                onValueCommit={(values) => applyPtz({zoom: values[0] ?? 1})}
              />
            </div>
            <div className='flex items-center gap-2'>
              <Button size='sm' variant='outline' onClick={handleResetPtz}>
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
                value={presetName}
                onChange={(event) => setPresetName(event.target.value)}
                placeholder='Save preset name'
              />
              <Button
                size='icon'
                disabled={!presetName.trim()}
                variant='secondary'
                onClick={handleSavePreset}
              >
                <Plus className='size-4' />
              </Button>
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
