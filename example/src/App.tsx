import React from 'react'

import {VisionSimulator} from '@vega-tek-hub/vision-simulator-v2'

interface AppProps {
  className?: string
}

export const App: React.FC<AppProps> = ({className}) => {
  const accessToken = import.meta.env.VITE_ACCESS_TOKEN
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN
  const visionSimulatorId = import.meta.env.VITE_VISION_SIMULATOR_ID

  return (
    <div className={['app-root', className].filter(Boolean).join(' ')}>
      <VisionSimulator
        accessToken={accessToken}
        mapboxToken={mapboxToken}
        visionSimulatorId={visionSimulatorId}
      />
    </div>
  )
}
