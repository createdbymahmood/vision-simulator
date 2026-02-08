import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'

import '@/host.css'
import '@/index.css'
import {App} from '@/app'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      apiBaseUrl={import.meta.env.VITE_API_BASE_URL}
      accessToken={import.meta.env.VITE_ACCESS_TOKEN}
      mapboxToken={import.meta.env.VITE_MAPBOX_TOKEN}
      visionSimulatorId={import.meta.env.VITE_VISION_SIMULATOR_ID}
    />
  </StrictMode>,
)
