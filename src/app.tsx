import React from 'react'

import {TooltipProvider} from '@/components/ui/tooltip'
import {HistoryStoreProvider} from '@/features/scene/infrastructure/stores/history.store'
import {SceneStoreProvider} from '@/features/scene/infrastructure/stores/scene.store'
import {UiStoreProvider} from '@/features/scene/infrastructure/stores/ui.store'
import {EditorLayout} from '@/features/scene/presentation/components/editor-layout'

interface AppProps {
  children?: React.ReactNode
}

export const App: React.FC<AppProps> = () => {
  return (
    <SceneStoreProvider initialState={{}}>
      <HistoryStoreProvider initialState={{}}>
        <UiStoreProvider initialState={{}}>
          <TooltipProvider delayDuration={0}>
            <EditorLayout />
          </TooltipProvider>
        </UiStoreProvider>
      </HistoryStoreProvider>
    </SceneStoreProvider>
  )
}
