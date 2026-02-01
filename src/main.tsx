import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'

import '@/host.css'
import '@/index.css'
import {App} from '@/app'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App mapboxToken={import.meta.env.VITE_MAPBOX_TOKEN} />
  </StrictMode>,
)
