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
const SHADOW_HOST_SLOT = 'vision-simulator-shadow-host'

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

interface VisionSimulatorProvidersProps {
  visionSimulatorId: string
  mapboxToken?: string
}

interface ShadowInlineStyleEntry {
  key: string
  cssText: string
}

interface ShadowResolvedStyles {
  inline: ShadowInlineStyleEntry[]
  links: string[]
}

interface ResolveShadowStyleUrlsParams {
  hasExplicitStyleUrls: boolean
  explicitStyleUrls: string[]
  documentStyleLinks: string[]
}

const isVisionSimulatorStyleSource = (value: string | null | undefined) => {
  if (!value) {
    return false
  }

  const normalizedValue = value.toLowerCase()

  return (
    normalizedValue.includes('vision-simulator-v2') &&
    normalizedValue.includes('styles.css')
  )
}

const collectPackageStylesFromDocument = (): ShadowResolvedStyles => {
  if (typeof document === 'undefined') {
    return {inline: [], links: []}
  }

  const inline = Array.from(document.querySelectorAll('style'))
    .filter((styleElement) => {
      const viteMarker = styleElement.getAttribute('data-vite-dev-id')
      const sourceMapMarker = styleElement.getAttribute('data-source-map')

      return (
        isVisionSimulatorStyleSource(viteMarker) ||
        isVisionSimulatorStyleSource(sourceMapMarker)
      )
    })
    .map((styleElement, index) => ({
      key: `inline-style-${index}`,
      cssText: styleElement.textContent ?? '',
    }))
    .filter((entry) => entry.cssText.trim().length > 0)

  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((linkElement) => linkElement.getAttribute('href'))
    .filter(
      (href): href is string =>
        Boolean(href) && isVisionSimulatorStyleSource(href),
    )

  return {inline, links}
}

const createInitialSceneState = (vision: unknown): SceneStoreInitialState => ({
  scene: get(vision, 'vision.data') as SceneStoreInitialState['scene'],
  projectName: get(vision, 'name'),
})

const resolveShadowStyleUrls = ({
  hasExplicitStyleUrls,
  explicitStyleUrls,
  documentStyleLinks,
}: ResolveShadowStyleUrlsParams): string[] => {
  if (hasExplicitStyleUrls) {
    return [...new Set(explicitStyleUrls.filter(Boolean))]
  }

  if (documentStyleLinks.length > 0) {
    return documentStyleLinks
  }

  return DEFAULT_SHADOW_STYLE_URLS
}

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

const useOpenShadowRoot = (hostRef: React.RefObject<HTMLDivElement | null>) => {
  const [shadowRoot, setShadowRoot] = React.useState<ShadowRoot | null>(null)

  React.useEffect(() => {
    const hostElement = hostRef.current

    if (!hostElement) {
      return
    }

    const nextShadowRoot =
      hostElement.shadowRoot ?? hostElement.attachShadow({mode: 'open'})

    setShadowRoot((currentShadowRoot) => {
      if (currentShadowRoot === nextShadowRoot) {
        return currentShadowRoot
      }

      return nextShadowRoot
    })
  }, [hostRef])

  return shadowRoot
}

const useMirrorDarkModeClass = (
  hostRef: React.RefObject<HTMLDivElement | null>,
) => {
  React.useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const hostElement = hostRef.current

    if (!hostElement) {
      return
    }

    const syncDarkClass = () => {
      const hasDarkClass =
        document.documentElement.classList.contains('dark') ||
        document.body.classList.contains('dark')

      hostElement.classList.toggle('dark', hasDarkClass)
    }

    syncDarkClass()

    const observer = new MutationObserver(syncDarkClass)

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      observer.disconnect()
    }
  }, [hostRef])
}

const usePackageDocumentStyles = (enabled: boolean) => {
  const [documentStyles, setDocumentStyles] =
    React.useState<ShadowResolvedStyles>({
      inline: [],
      links: [],
    })

  React.useEffect(() => {
    if (!enabled) {
      return
    }

    setDocumentStyles(collectPackageStylesFromDocument())
  }, [enabled])

  return documentStyles
}

const VisionSimulatorProviders: React.FC<VisionSimulatorProvidersProps> = ({
  visionSimulatorId,
  mapboxToken,
}) => {
  const {data: vision} = useGetVisionByIDSuspense(visionSimulatorId)
  const initialSceneState = React.useMemo(
    () => createInitialSceneState(vision),
    [vision],
  )

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
  const shadowRoot = useOpenShadowRoot(hostRef)

  useMirrorDarkModeClass(hostRef)

  const explicitStyleUrls = shadowStyleUrls ?? []
  const hasExplicitStyleUrls = explicitStyleUrls.length > 0
  const documentStyles = usePackageDocumentStyles(!hasExplicitStyleUrls)

  const styleUrls = React.useMemo(
    () =>
      resolveShadowStyleUrls({
        hasExplicitStyleUrls,
        explicitStyleUrls,
        documentStyleLinks: documentStyles.links,
      }),
    [documentStyles.links, explicitStyleUrls, hasExplicitStyleUrls],
  )

  return (
    <div className='size-full' ref={hostRef} data-slot={SHADOW_HOST_SLOT}>
      {shadowRoot
        ? createPortal(
            <>
              {!hasExplicitStyleUrls &&
                documentStyles.inline.map((entry) => (
                  <style
                    key={entry.key}
                    dangerouslySetInnerHTML={{__html: entry.cssText}}
                  />
                ))}
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

const VisionSimulatorAppShell: React.FC<VisionSimulatorProvidersProps> = ({
  mapboxToken,
  visionSimulatorId,
}) => (
  <Suspense fallback={<Pending />}>
    <QueryClientProvider client={queryClient}>
      <VisionSimulatorProviders
        mapboxToken={mapboxToken}
        visionSimulatorId={visionSimulatorId}
      />
    </QueryClientProvider>
  </Suspense>
)

export const App: React.FC<AppProps> = ({
  apiBaseUrl,
  mapboxToken,
  accessToken,
  visionSimulatorId,
  isolationMode = 'shadow',
  shadowStyleUrls,
}) => {
  configureDataProvider({apiBaseUrl, accessToken})

  const appShell = (
    <VisionSimulatorAppShell
      mapboxToken={mapboxToken}
      visionSimulatorId={visionSimulatorId}
    />
  )

  if (isolationMode !== 'shadow') {
    return (
      <PortalContainerProvider container={null}>
        {appShell}
      </PortalContainerProvider>
    )
  }

  return (
    <ShadowIsolatedRoot shadowStyleUrls={shadowStyleUrls}>
      {appShell}
    </ShadowIsolatedRoot>
  )
}
