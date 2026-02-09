import {QueryClientProvider} from '@tanstack/react-query'
import React, {Suspense} from 'react'
import {createPortal} from 'react-dom'

import type {SceneStoreInitialState} from '@/features/scene/infrastructure/stores/scene.store'

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
import {get} from '@/lib/lodash-es'
import {PortalContainerProvider} from '@/lib/portal-container'

const DEFAULT_SHADOW_STYLE_URLS = [
  new URL('./styles.css', import.meta.url).href,
]

interface AppProps {
  children?: React.ReactNode
  visionSimulatorId: string
  accessToken: string
  apiBaseUrl: string
  mapboxToken?: string
  isolationMode?: 'none' | 'shadow'
  shadowStyleUrls?: string[]
}

interface ShadowIsolatedRootProps {
  children: React.ReactNode
  shadowStyleUrls?: string[]
}

const AppImpl = ({
  visionSimulatorId,
  mapboxToken,
}: Omit<
  AppProps,
  'accessToken' | 'apiBaseUrl' | 'isolationMode' | 'shadowStyleUrls'
>) => {
  const {data: vision} = useGetVisionByIDSuspense(visionSimulatorId)

  const initialSceneState: SceneStoreInitialState = {
    scene: get(vision, 'vision.data') as SceneStoreInitialState['scene'],
    projectName: get(vision, 'name'),
  }

  return (
    <SceneStoreProvider initialState={initialSceneState}>
      <HistoryStoreProvider initialState={{}}>
        <UiStoreProvider initialState={{mapboxToken}}>
          <TooltipProvider delayDuration={0}>
            <EditorLayout visionSimulatorId={visionSimulatorId} />
            <Toaster />
          </TooltipProvider>
        </UiStoreProvider>
      </HistoryStoreProvider>
    </SceneStoreProvider>
  )
}

const ShadowIsolatedRoot: React.FC<ShadowIsolatedRootProps> = ({
  children,
  shadowStyleUrls,
}) => {
  const hostRef = React.useRef<HTMLDivElement>(null)
  const [shadowRoot, setShadowRoot] = React.useState<ShadowRoot | null>(null)

  React.useEffect(() => {
    const hostElement = hostRef.current

    if (!hostElement) {
      return
    }

    const nextShadowRoot =
      hostElement.shadowRoot ?? hostElement.attachShadow({mode: 'open'})

    if (shadowRoot !== nextShadowRoot) {
      setShadowRoot(nextShadowRoot)
    }
  }, [shadowRoot])

  const styleUrls = React.useMemo(() => {
    if (!shadowStyleUrls || shadowStyleUrls.length === 0) {
      return DEFAULT_SHADOW_STYLE_URLS
    }

    return [...new Set(shadowStyleUrls.filter(Boolean))]
  }, [shadowStyleUrls])

  return (
    <div ref={hostRef} data-slot='vision-simulator-shadow-host'>
      {shadowRoot
        ? createPortal(
            <>
              {styleUrls.map((href) => (
                <link href={href} key={href} rel='stylesheet' />
              ))}
              <PortalContainerProvider container={shadowRoot}>
                {children}
              </PortalContainerProvider>
            </>,
            shadowRoot,
          )
        : null}
    </div>
  )
}

export const App: React.FC<AppProps> = ({
  apiBaseUrl,
  mapboxToken,
  accessToken,
  visionSimulatorId,
  isolationMode = 'shadow',
  shadowStyleUrls,
}) => {
  applyAxiosApiBaseUrl(apiBaseUrl)
  applyAxiosAuthorizationHeader(accessToken)

  const appShell = (
    <Suspense fallback={<Pending />}>
      <QueryClientProvider client={queryClient}>
        <AppImpl
          mapboxToken={mapboxToken}
          visionSimulatorId={visionSimulatorId}
        />
      </QueryClientProvider>
    </Suspense>
  )

  if (isolationMode === 'shadow') {
    return (
      <ShadowIsolatedRoot shadowStyleUrls={shadowStyleUrls}>
        {appShell}
      </ShadowIsolatedRoot>
    )
  }

  return (
    <PortalContainerProvider container={null}>
      {appShell}
    </PortalContainerProvider>
  )
}
