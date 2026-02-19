import {QueryClientProvider} from '@tanstack/react-query'
import React, {Suspense} from 'react'

import type {SceneStoreInitialState} from '@/features/scene/infrastructure/stores/scene.store'
import type {UnsavedChangesOptions} from '@/features/scene/presentation/leave-guard/types'
import type {VisionSimulatorMode} from '@/features/scene/presentation/modes/vision-simulator-mode'
import type {EditorUiOverrides} from '@/features/scene/presentation/types/editor-ui-overrides'

import {Pending} from '@/components/shared/pending'
import {Toaster} from '@/components/ui/sonner'
import {TooltipProvider} from '@/components/ui/tooltip'
import {useGetVisionByIDSuspense} from '@/data-provider/api/services/v2/vision-simulator'
import {
  applyAxiosApiBaseUrl,
  applyAxiosAuthorizationHeader,
} from '@/data-provider/axios/axios'
import {queryClient} from '@/data-provider/react-query'
import {HistoryStoreProvider} from '@/features/scene/infrastructure/stores/history.store'
import {SceneStoreProvider} from '@/features/scene/infrastructure/stores/scene.store'
import {UiStoreProvider} from '@/features/scene/infrastructure/stores/ui.store'
import {EditorLayout} from '@/features/scene/presentation/components/editor-layout'
import {
  getVisionSimulatorModePolicy,
  resolveVisionSimulatorMode,
} from '@/features/scene/presentation/modes/vision-simulator-mode'
import {get} from '@/lib/lodash-es'
import {PortalContainerProvider} from '@/lib/portal-container'

const STATIC_VISION_QUERY_OPTIONS = {
  gcTime: 0,
  staleTime: 0,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
} as const

const APP_SURFACE_CLASSNAME =
  'vs:block vs:size-full vs:min-h-0 vs:min-w-0 vs:overflow-hidden'

export interface AppProps {
  children?: React.ReactNode
  visionSimulatorId: string
  accessToken: string
  apiBaseUrl: string
  mediaMtxUrl?: string
  mapboxToken?: string
  mode?: VisionSimulatorMode
  unsavedChanges?: UnsavedChangesOptions
  uiOverrides?: EditorUiOverrides
}

interface VisionSimulatorProvidersProps {
  visionSimulatorId: string
  accessToken: string
  mediaMtxUrl?: string
  mapboxToken?: string
  mode: VisionSimulatorMode
  unsavedChanges?: UnsavedChangesOptions
  uiOverrides?: EditorUiOverrides
}

const createInitialSceneState = (vision: unknown): SceneStoreInitialState => ({
  scene: get(vision, 'vision.data') as SceneStoreInitialState['scene'],
  projectName: get(vision, 'name'),
})

const configureDataProvider = ({
  apiBaseUrl,
  accessToken,
}: {
  apiBaseUrl: string
  accessToken: string
}) => {
  applyAxiosApiBaseUrl(apiBaseUrl)
  applyAxiosAuthorizationHeader(accessToken)
}

const VisionSimulatorProviders: React.FC<VisionSimulatorProvidersProps> = ({
  visionSimulatorId,
  accessToken,
  mediaMtxUrl,
  mapboxToken,
  mode,
  unsavedChanges,
  uiOverrides,
}) => {
  const {data: vision} = useGetVisionByIDSuspense(visionSimulatorId, {
    query: {
      ...STATIC_VISION_QUERY_OPTIONS,
    },
  })
  const initialSceneState = React.useMemo(
    () => createInitialSceneState(vision),
    [vision],
  )
  const modePolicy = React.useMemo(
    () => getVisionSimulatorModePolicy(mode),
    [mode],
  )

  return (
    <SceneStoreProvider initialState={initialSceneState}>
      <HistoryStoreProvider initialState={{}}>
        <UiStoreProvider
          initialState={{
            accessToken,
            mediaMtxUrl,
            mapboxToken,
            viewMode: modePolicy.initialViewMode,
            previewViewMode: modePolicy.defaultPreviewViewMode,
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

const VisionSimulatorAppShell: React.FC<VisionSimulatorProvidersProps> = ({
  accessToken,
  mediaMtxUrl,
  mapboxToken,
  mode,
  visionSimulatorId,
  unsavedChanges,
  uiOverrides,
}) => (
  <Suspense fallback={<Pending />}>
    <QueryClientProvider client={queryClient}>
      <VisionSimulatorProviders
        mediaMtxUrl={mediaMtxUrl}
        uiOverrides={uiOverrides}
        unsavedChanges={unsavedChanges}
        accessToken={accessToken}
        mapboxToken={mapboxToken}
        mode={mode}
        visionSimulatorId={visionSimulatorId}
      />
    </QueryClientProvider>
  </Suspense>
)

export const App: React.FC<AppProps> = ({
  apiBaseUrl,
  mediaMtxUrl,
  mapboxToken,
  mode,
  accessToken,
  visionSimulatorId,
  unsavedChanges,
  uiOverrides,
}) => {
  configureDataProvider({apiBaseUrl, accessToken})
  const effectiveMode = resolveVisionSimulatorMode(mode)

  return (
    <PortalContainerProvider container={null}>
      <div className={APP_SURFACE_CLASSNAME}>
        <VisionSimulatorAppShell
          mediaMtxUrl={mediaMtxUrl}
          uiOverrides={uiOverrides}
          unsavedChanges={unsavedChanges}
          accessToken={accessToken}
          mapboxToken={mapboxToken}
          mode={effectiveMode}
          visionSimulatorId={visionSimulatorId}
        />
      </div>
    </PortalContainerProvider>
  )
}
