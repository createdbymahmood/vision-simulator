import {QueryClientProvider} from '@tanstack/react-query'
import React from 'react'

import type {SceneMode} from '@/features/scene/domain/types'

import {Toaster} from '@/components/ui/sonner'
import {TooltipProvider} from '@/components/ui/tooltip'
import {queryClient} from '@/data-provider/react-query'
import {HistoryStoreProvider} from '@/features/scene/infrastructure/stores/history.store'
import {SceneStoreProvider} from '@/features/scene/infrastructure/stores/scene.store'
import {UiStoreProvider} from '@/features/scene/infrastructure/stores/ui.store'
import {EditorLayout} from '@/features/scene/presentation/components/editor-layout'

interface AppProps {
  children?: React.ReactNode
  mapboxToken?: string
  sceneMode?: SceneMode
}

export const App: React.FC<AppProps> = ({mapboxToken, sceneMode}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SceneStoreProvider initialState={{sceneMode}}>
        <HistoryStoreProvider initialState={{}}>
          <UiStoreProvider initialState={{mapboxToken}}>
            <TooltipProvider delayDuration={0}>
              <EditorLayout />
              <Toaster />
            </TooltipProvider>
          </UiStoreProvider>
        </HistoryStoreProvider>
      </SceneStoreProvider>
    </QueryClientProvider>
  )
}
