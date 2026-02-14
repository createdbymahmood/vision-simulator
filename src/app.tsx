import {QueryClientProvider} from '@tanstack/react-query'
import React, {Suspense} from 'react'
import {createPortal} from 'react-dom'

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

const DEFAULT_SHADOW_STYLE_URLS = [
  new URL('./styles.css', import.meta.url).href,
]
const SHADOW_HOST_SLOT = 'vision-simulator-shadow-host'
const STATIC_VISION_QUERY_OPTIONS = {
  gcTime: 0,
  staleTime: 0,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
} as const

export interface AppProps {
  children?: React.ReactNode
  visionSimulatorId: string
  accessToken: string
  apiBaseUrl: string
  mediaMtxUrl?: string
  mapboxToken?: string
  mode?: VisionSimulatorMode
  isolationMode?: 'none' | 'shadow'
  shadowStyleUrls?: string[]
  unsavedChanges?: UnsavedChangesOptions
  uiOverrides?: EditorUiOverrides
}

interface ShadowIsolatedRootProps {
  children: React.ReactNode
  shadowStyleUrls?: string[]
  mirrorDocumentStyles: boolean
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

const APP_SURFACE_CLASSNAME = 'block size-full min-h-0 min-w-0 overflow-hidden'

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

const shouldIncludeInlineStyle = (
  styleElement: HTMLStyleElement,
  mirrorDocumentStyles: boolean,
) => {
  if (mirrorDocumentStyles) {
    return true
  }

  const viteMarker = styleElement.getAttribute('data-vite-dev-id')
  const sourceMapMarker = styleElement.getAttribute('data-source-map')

  return (
    isVisionSimulatorStyleSource(viteMarker) ||
    isVisionSimulatorStyleSource(sourceMapMarker)
  )
}

const shouldIncludeStyleLink = (
  href: string,
  mirrorDocumentStyles: boolean,
) => {
  if (mirrorDocumentStyles) {
    return true
  }
  return isVisionSimulatorStyleSource(href)
}

const collectDocumentStyles = (
  mirrorDocumentStyles: boolean,
): ShadowResolvedStyles => {
  if (typeof document === 'undefined') {
    return {inline: [], links: []}
  }

  const inline = Array.from(document.querySelectorAll('style'))
    .filter((styleElement) =>
      shouldIncludeInlineStyle(styleElement, mirrorDocumentStyles),
    )
    .map((styleElement, index) => ({
      key: `inline-style-${index}`,
      cssText: styleElement.textContent ?? '',
    }))
    .filter((entry) => entry.cssText.trim().length > 0)

  const links = [
    ...new Set(
      Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map((linkElement) => linkElement.getAttribute('href'))
        .filter((href): href is string => Boolean(href))
        .filter((href) => shouldIncludeStyleLink(href, mirrorDocumentStyles)),
    ),
  ]

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

const useDocumentStyles = (
  enabled: boolean,
  mirrorDocumentStyles: boolean,
) => {
  const [documentStyles, setDocumentStyles] =
    React.useState<ShadowResolvedStyles>({
      inline: [],
      links: [],
    })

  React.useEffect(() => {
    if (!enabled) {
      return
    }

    setDocumentStyles(collectDocumentStyles(mirrorDocumentStyles))
  }, [enabled, mirrorDocumentStyles])

  return documentStyles
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

const ShadowIsolatedRoot: React.FC<ShadowIsolatedRootProps> = ({
  children,
  mirrorDocumentStyles,
  shadowStyleUrls,
}) => {
  const hostRef = React.useRef<HTMLDivElement>(null)
  const shadowRoot = useOpenShadowRoot(hostRef)

  useMirrorDarkModeClass(hostRef)

  const hasExplicitStyleUrls = (shadowStyleUrls?.length ?? 0) > 0
  const documentStyles = useDocumentStyles(
    !hasExplicitStyleUrls,
    mirrorDocumentStyles,
  )

  const styleUrls = React.useMemo(
    () =>
      resolveShadowStyleUrls({
        hasExplicitStyleUrls,
        explicitStyleUrls: shadowStyleUrls ?? [],
        documentStyleLinks: documentStyles.links,
      }),
    [documentStyles.links, hasExplicitStyleUrls, shadowStyleUrls],
  )

  return (
    <div
      className={APP_SURFACE_CLASSNAME}
      ref={hostRef}
      data-slot={SHADOW_HOST_SLOT}
    >
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
                <div className={APP_SURFACE_CLASSNAME}>{children}</div>
              </PortalContainerProvider>
            </>,
            shadowRoot,
          )
        : null}
    </div>
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
  isolationMode = 'shadow',
  shadowStyleUrls,
  unsavedChanges,
  uiOverrides,
}) => {
  configureDataProvider({apiBaseUrl, accessToken})
  const effectiveMode = resolveVisionSimulatorMode(mode)
  const mirrorDocumentStyles = Boolean(uiOverrides)

  const appShell = (
    <VisionSimulatorAppShell
      mediaMtxUrl={mediaMtxUrl}
      uiOverrides={uiOverrides}
      unsavedChanges={unsavedChanges}
      accessToken={accessToken}
      mapboxToken={mapboxToken}
      mode={effectiveMode}
      visionSimulatorId={visionSimulatorId}
    />
  )

  if (isolationMode !== 'shadow') {
    return (
      <PortalContainerProvider container={null}>
        <div className={APP_SURFACE_CLASSNAME}>{appShell}</div>
      </PortalContainerProvider>
    )
  }

  return (
    <ShadowIsolatedRoot
      mirrorDocumentStyles={mirrorDocumentStyles}
      shadowStyleUrls={shadowStyleUrls}
    >
      {appShell}
    </ShadowIsolatedRoot>
  )
}
