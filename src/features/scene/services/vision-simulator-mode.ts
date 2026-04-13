import type {
  PreviewViewMode,
  SimulationViewMode,
  ViewMode,
} from '@/features/scene/types/types'

export type VisionSimulatorMode = 'editor' | 'preview'

interface VisionSimulatorModePolicy {
  initialViewMode: ViewMode
  lockViewMode: boolean
  showSimulationTopBar: boolean
  showSimulationAuxiliaryPanels: boolean
  allowSimulationBackToEditor: boolean
  defaultPreviewViewMode: PreviewViewMode
  allowPreviewViewSwitch: boolean
  defaultSimulationViewMode: SimulationViewMode
  allowSimulationCameraGrid: boolean
}

const VISION_SIMULATOR_MODE_POLICIES: Record<
  VisionSimulatorMode,
  VisionSimulatorModePolicy
> = {
  editor: {
    initialViewMode: 'editor',
    lockViewMode: false,
    showSimulationTopBar: true,
    showSimulationAuxiliaryPanels: true,
    allowSimulationBackToEditor: true,
    defaultPreviewViewMode: '3d',
    allowPreviewViewSwitch: true,
    defaultSimulationViewMode: 'scene',
    allowSimulationCameraGrid: true,
  },
  preview: {
    initialViewMode: 'preview',
    lockViewMode: true,
    showSimulationTopBar: false,
    showSimulationAuxiliaryPanels: false,
    allowSimulationBackToEditor: false,
    defaultPreviewViewMode: '3d',
    allowPreviewViewSwitch: true,
    defaultSimulationViewMode: 'scene',
    allowSimulationCameraGrid: true,
  },
}

export const DEFAULT_VISION_SIMULATOR_MODE: VisionSimulatorMode = 'editor'

export const resolveVisionSimulatorMode = (
  mode?: VisionSimulatorMode,
): VisionSimulatorMode => mode ?? DEFAULT_VISION_SIMULATOR_MODE

export const getVisionSimulatorModePolicy = (
  mode: VisionSimulatorMode,
): VisionSimulatorModePolicy => VISION_SIMULATOR_MODE_POLICIES[mode]
