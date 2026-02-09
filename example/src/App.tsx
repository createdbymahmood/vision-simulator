import {VisionSimulator} from '@vega-tek-hub/vision-simulator-v2'
import simulatorStylesUrl from '@vega-tek-hub/vision-simulator-v2/styles.css?url'
import React from 'react'

interface AppProps {
  className?: string
}

export const App: React.FC<AppProps> = ({className}) => {
  const accessToken = import.meta.env.VITE_ACCESS_TOKEN
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN
  const visionSimulatorId = import.meta.env.VITE_VISION_SIMULATOR_ID

  return (
    <div className={['app-root', className].filter(Boolean).join(' ')}>
      <VisionSimulator
        apiBaseUrl={apiBaseUrl}
        accessToken={accessToken}
        isolationMode='shadow'
        mapboxToken={mapboxToken}
        shadowStyleUrls={[simulatorStylesUrl]}
        visionSimulatorId={visionSimulatorId}
      />
    </div>
  )
}
