import React, {useEffect} from 'react'

import type {VisionSimulatorMode} from '@/features/scene/services/vision-simulator-mode'
import type {EditorUiOverrides} from '@/features/scene/types/editor-ui-overrides'
import type {UnsavedChangesOptions} from '@/features/scene/types/leave-guard/types'

import {Toaster} from '@/components/ui/sonner'
import {TooltipProvider} from '@/components/ui/tooltip'
import {EditorLayout} from '@/features/scene/components/editor-layout'
import {
  getVisionSimulatorModePolicy,
  resolveVisionSimulatorMode,
} from '@/features/scene/services/vision-simulator-mode'
import {HistoryStoreProvider} from '@/features/scene/state/history.store'
import {SceneStoreProvider} from '@/features/scene/state/scene.store'
import {UiStoreProvider} from '@/features/scene/state/ui.store'
import {
  applyBrandRootClassName,
  clearBrandRootClassName,
  getBrandRootClassName,
} from '@/lib/brand'
import {PortalContainerProvider} from '@/lib/portal-container'

const APP_SURFACE_CLASSNAME =
  'vs:block vs:size-full vs:min-h-0 vs:min-w-0 vs:overflow-hidden'

export interface AppProps {
  children?: React.ReactNode
  visionSimulatorId: string
  mapboxToken?: string
  mode?: VisionSimulatorMode
  unsavedChanges?: UnsavedChangesOptions
  uiOverrides?: EditorUiOverrides
}

interface VisionSimulatorProvidersProps {
  visionSimulatorId: string
  mapboxToken?: string
  mode: VisionSimulatorMode
  unsavedChanges?: UnsavedChangesOptions
  uiOverrides?: EditorUiOverrides
}

const buildPersistKey = (scope: string, store: 'scene' | 'ui' | 'history') =>
  `vision-simulator:${scope}:${store}`

const VisionSimulatorProviders: React.FC<VisionSimulatorProvidersProps> = ({
  visionSimulatorId,
  mapboxToken,
  mode,
  unsavedChanges,
  uiOverrides,
}) => {
  const modePolicy = React.useMemo(
    () => getVisionSimulatorModePolicy(mode),
    [mode],
  )

  return (
    <SceneStoreProvider
      initialState={{
        persistKey: buildPersistKey(visionSimulatorId, 'scene'),
      }}
    >
      <HistoryStoreProvider
        initialState={{
          persistKey: buildPersistKey(visionSimulatorId, 'history'),
        }}
      >
        <UiStoreProvider
          initialState={{
            persistKey: buildPersistKey(visionSimulatorId, 'ui'),
            mapboxToken,
            viewMode: modePolicy.initialViewMode,
            previewViewMode: modePolicy.defaultPreviewViewMode,
            simulationViewMode: modePolicy.defaultSimulationViewMode,
          }}
        >
          <TooltipProvider delayDuration={0}>
            <EditorLayout
              uiOverrides={uiOverrides}
              unsavedChanges={unsavedChanges}
              mode={mode}
              visionSimulatorId={visionSimulatorId}
            />
            <Toaster />
          </TooltipProvider>
        </UiStoreProvider>
      </HistoryStoreProvider>
    </SceneStoreProvider>
  )
}

export const App: React.FC<AppProps> = ({
  mapboxToken,
  mode,
  visionSimulatorId,
  unsavedChanges,
  uiOverrides,
}) => {
  useEffect(() => {
    applyBrandRootClassName()
    return () => clearBrandRootClassName()
  }, [])

  const effectiveMode = resolveVisionSimulatorMode(mode)
  const brandRootClassName = getBrandRootClassName()

  return (
    <PortalContainerProvider container={null}>
      <div className={`${APP_SURFACE_CLASSNAME} ${brandRootClassName}`}>
        <VisionSimulatorProviders
          uiOverrides={uiOverrides}
          unsavedChanges={unsavedChanges}
          mapboxToken={mapboxToken}
          mode={effectiveMode}
          visionSimulatorId={visionSimulatorId}
        />
      </div>
    </PortalContainerProvider>
  )
}
