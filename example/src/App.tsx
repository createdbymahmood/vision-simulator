import React from 'react'

import {VisionSimulator} from '@vega-tek-hub/vision-simulator-v2'

interface AppProps {
  className?: string
}

export const App: React.FC<AppProps> = ({className}) => {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN

  return (
    <div className={['app-root', className].filter(Boolean).join(' ')}>
      <VisionSimulator mapboxToken={mapboxToken} />
    </div>
  )
}
