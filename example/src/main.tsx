import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import '@vega-tek-hub/simulator-vision/host.css'

import {App} from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div
      style={{
        height: '100vh',
        width: '100vw',
      }}
    >
      <App />
    </div>
  </StrictMode>,
)
