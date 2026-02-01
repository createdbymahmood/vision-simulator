import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import '@vega-tek-hub/vision-simulator-v2/styles.css'
import {App} from './app'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
