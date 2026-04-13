import type {QueryClient} from '@tanstack/react-query'

import {QueryClientProvider} from '@tanstack/react-query'
import React, {Suspense} from 'react'

import type {VisionSimulatorMode} from '@/features/scene/services/vision-simulator-mode'
import type {SceneStoreInitialState} from '@/features/scene/state/scene.store'
import type {EditorUiOverrides} from '@/features/scene/types/editor-ui-overrides'
import type {UnsavedChangesOptions} from '@/features/scene/types/leave-guard/types'

import {Pending} from '@/components/shared/pending'
import {Toaster} from '@/components/ui/sonner'
import {TooltipProvider} from '@/components/ui/tooltip'
import {useGetVisionByIDSuspense} from '@/data-provider/api/services/v2/vision-simulator'
import {
  applyAxiosApiBaseUrl,
  applyAxiosAuthorizationHeader,
} from '@/data-provider/axios/axios'
import {EditorLayout} from '@/features/scene/components/editor-layout'
import {
  getVisionSimulatorModePolicy,
  resolveVisionSimulatorMode,
} from '@/features/scene/services/vision-simulator-mode'
import {HistoryStoreProvider} from '@/features/scene/state/history.store'
import {SceneStoreProvider} from '@/features/scene/state/scene.store'
import {UiStoreProvider} from '@/features/scene/state/ui.store'
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
  queryClient: QueryClient
  visionSimulatorId: string
  accessToken: string
  apiBaseUrl: string
  apiWsServiceUrl: string
  mediaMtxUrl?: string
  mapboxToken?: string
  mode?: VisionSimulatorMode
  unsavedChanges?: UnsavedChangesOptions
  uiOverrides?: EditorUiOverrides
}

interface VisionSimulatorProvidersProps {
  queryClient: QueryClient
  visionSimulatorId: string
  accessToken: string
  apiWsServiceUrl: string
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
  apiWsServiceUrl,
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
            apiWsServiceUrl,
            mediaMtxUrl,
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

const VisionSimulatorAppShell: React.FC<VisionSimulatorProvidersProps> = ({
  queryClient,
  accessToken,
  apiWsServiceUrl,
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
        apiWsServiceUrl={apiWsServiceUrl}
        mediaMtxUrl={mediaMtxUrl}
        queryClient={queryClient}
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
  queryClient,
  apiBaseUrl,
  apiWsServiceUrl,
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
          apiWsServiceUrl={apiWsServiceUrl}
          mediaMtxUrl={mediaMtxUrl}
          queryClient={queryClient}
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
