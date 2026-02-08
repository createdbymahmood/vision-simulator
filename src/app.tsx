import {QueryClientProvider} from '@tanstack/react-query'
import React from 'react'

import type {EditorMode} from '@/features/scene/domain/types'

import {Toaster} from '@/components/ui/sonner'
import {TooltipProvider} from '@/components/ui/tooltip'
import {useGetVisionByIDSuspense} from '@/data-provider/api/services/v2/vision-simulator'
import {applyAxiosAuthorizationHeader} from '@/data-provider/axios/axios'
import {queryClient} from '@/data-provider/react-query'
import {HistoryStoreProvider} from '@/features/scene/infrastructure/stores/history.store'
import {SceneStoreProvider} from '@/features/scene/infrastructure/stores/scene.store'
import {UiStoreProvider} from '@/features/scene/infrastructure/stores/ui.store'
import {EditorLayout} from '@/features/scene/presentation/components/editor-layout'

interface AppProps {
  children?: React.ReactNode
  visionSimulatorId: string
  accessToken: string
  mapboxToken?: string
  editorMode?: EditorMode
}

const AppImpl = ({
  visionSimulatorId,
  editorMode,
  mapboxToken,
}: Omit<AppProps, 'accessToken'>) => {
  const {data: vision} = useGetVisionByIDSuspense(visionSimulatorId)
  /* vision.vision.data */

  /* {
    "vision": {
        "data": {
            "editorMode": "map"
        }
    },
   
} */
  return (
    <SceneStoreProvider initialState={{editorMode}}>
      <HistoryStoreProvider initialState={{}}>
        <UiStoreProvider initialState={{mapboxToken}}>
          <TooltipProvider delayDuration={0}>
            <EditorLayout />
            <Toaster />
          </TooltipProvider>
        </UiStoreProvider>
      </HistoryStoreProvider>
    </SceneStoreProvider>
  )
}
export const App: React.FC<AppProps> = ({
  mapboxToken,
  editorMode,
  accessToken,
  visionSimulatorId,
}) => {
  applyAxiosAuthorizationHeader(accessToken)

  return (
    <QueryClientProvider client={queryClient}>
      <AppImpl
        editorMode={editorMode}
        mapboxToken={mapboxToken}
        visionSimulatorId={visionSimulatorId}
      />
    </QueryClientProvider>
  )
}
