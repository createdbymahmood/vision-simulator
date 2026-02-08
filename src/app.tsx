import {QueryClientProvider} from '@tanstack/react-query'
import React, {Suspense} from 'react'

import type {SceneStoreInitialState} from '@/features/scene/infrastructure/stores/scene.store'

import {Pending} from '@/components/shared/pending'
import {Toaster} from '@/components/ui/sonner'
import {TooltipProvider} from '@/components/ui/tooltip'
import {useGetVisionByIDSuspense} from '@/data-provider/api/services/v2/vision-simulator'
import {applyAxiosAuthorizationHeader} from '@/data-provider/axios/axios'
import {queryClient} from '@/data-provider/react-query'
import {HistoryStoreProvider} from '@/features/scene/infrastructure/stores/history.store'
import {SceneStoreProvider} from '@/features/scene/infrastructure/stores/scene.store'
import {UiStoreProvider} from '@/features/scene/infrastructure/stores/ui.store'
import {EditorLayout} from '@/features/scene/presentation/components/editor-layout'
import {get} from '@/lib/lodash-es'

interface AppProps {
  children?: React.ReactNode
  visionSimulatorId: string
  accessToken: string
  mapboxToken?: string
}

const AppImpl = ({
  visionSimulatorId,
  mapboxToken,
}: Omit<AppProps, 'accessToken'>) => {
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
export const App: React.FC<AppProps> = ({
  mapboxToken,
  accessToken,
  visionSimulatorId,
}) => {
  applyAxiosAuthorizationHeader(accessToken)

  return (
    <Suspense fallback={<Pending />}>
      <QueryClientProvider client={queryClient}>
        <AppImpl
          mapboxToken={mapboxToken}
          visionSimulatorId={visionSimulatorId}
        />
      </QueryClientProvider>
    </Suspense>
  )
}
