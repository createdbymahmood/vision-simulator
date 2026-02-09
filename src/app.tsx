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

interface ShadowInlineStyleEntry {
  key: string
  cssText: string
}

interface ShadowResolvedStyles {
  inline: ShadowInlineStyleEntry[]
  links: string[]
}

const getPackageStyleSourcesFromDocument = (): ShadowResolvedStyles => {
  if (typeof document === 'undefined') {
    return {inline: [], links: []}
  }

  const matchesMarker = (value: string | null | undefined) => {
    if (!value) {
      return false
    }

    const normalizedValue = value.toLowerCase()

    return (
      normalizedValue.includes('vision-simulator-v2') &&
      normalizedValue.includes('styles.css')
    )
  }

  const inlineStyles = Array.from(document.querySelectorAll('style'))
    .filter((styleElement) => {
      const viteMarker = styleElement.getAttribute('data-vite-dev-id')
      const sourceMapMarker = styleElement.getAttribute('data-source-map')

      return matchesMarker(viteMarker) || matchesMarker(sourceMapMarker)
    })
    .map((styleElement, index) => ({
      key: `inline-style-${index}`,
      cssText: styleElement.textContent ?? '',
    }))
    .filter((entry) => entry.cssText.trim().length > 0)

  const linkStyles = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]'),
  )
    .map((linkElement) => linkElement.getAttribute('href'))
    .filter((href): href is string => Boolean(href) && matchesMarker(href))

  return {
    inline: inlineStyles,
    links: linkStyles,
  }
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
  const explicitStyleUrls = shadowStyleUrls ?? []
  const hasExplicitStyleUrls = explicitStyleUrls.length > 0
  const [documentStyles, setDocumentStyles] =
    React.useState<ShadowResolvedStyles>({
      inline: [],
      links: [],
    })

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
  }, [])

  React.useEffect(() => {
    if (hasExplicitStyleUrls) {
      return
    }

    setDocumentStyles(getPackageStyleSourcesFromDocument())
  }, [hasExplicitStyleUrls])

  const styleUrls = React.useMemo(() => {
    if (!hasExplicitStyleUrls) {
      if (documentStyles.links.length > 0) {
        return documentStyles.links
      }

      return DEFAULT_SHADOW_STYLE_URLS
    }

    return [...new Set(explicitStyleUrls.filter(Boolean))]
  }, [documentStyles.links, explicitStyleUrls, hasExplicitStyleUrls])

  return (
    <div ref={hostRef} data-slot='vision-simulator-shadow-host'>
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
