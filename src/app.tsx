import React from 'react'

import {HistoryStoreProvider} from '@/features/scene/infrastructure/stores/history.store'
import {SceneStoreProvider} from '@/features/scene/infrastructure/stores/scene.store'
import {UiStoreProvider} from '@/features/scene/infrastructure/stores/ui.store'

interface AppProps {
  children?: React.ReactNode
}

export const App: React.FC<AppProps> = () => {
  return (
    <SceneStoreProvider initialState={{}}>
      <HistoryStoreProvider initialState={{}}>
        <UiStoreProvider initialState={{}}>
          <div />
        </UiStoreProvider>
      </HistoryStoreProvider>
    </SceneStoreProvider>
  )
}
