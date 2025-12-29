import {SceneHistoryProvider, SceneLayout, SceneProvider} from '@/domains/scene'

export default function App() {
  return (
    <SceneProvider>
      <SceneHistoryProvider initialState={{}}>
        <SceneLayout />
      </SceneHistoryProvider>
    </SceneProvider>
  )
}

App.displayName = 'app'
