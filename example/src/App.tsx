import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import {VisionSimulator} from '@vega-tek-hub/vision-simulator-v2'
import 'mapbox-gl/dist/mapbox-gl.css'
import React from 'react'

const rootRoute = createRootRoute({
  component: () => <ExampleLayout />,
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <HomePage />,
})

const simulatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/simulator',
  component: () => <SimulatorPage />,
})

const routeTree = rootRoute.addChildren([homeRoute, simulatorRoute])

const router = createRouter({
  routeTree,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export const App: React.FC = () => <RouterProvider router={router} />

const ExampleLayout: React.FC = () => {
  return <Outlet />
}

const HomePage: React.FC = () => {
  return (
    <section style={{display: 'grid', gap: '10px'}}>
      <h2 style={{margin: 0}}>Home</h2>
      <p style={{margin: 0}}>
        Open <code>/simulator</code>, make scene edits, then navigate back to
        Home. Route navigation should be blocked with the unsaved-changes
        dialog.
      </p>
      <p style={{margin: 0}}>
        Reloading the browser tab should also trigger the native unsaved-changes
        warning while changes are dirty.
      </p>
    </section>
  )
}

const SimulatorPage: React.FC = () => {
  const accessToken = import.meta.env.VITE_ACCESS_TOKEN
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  const apiWsServiceUrl = import.meta.env.VITE_API_WS_SERVICE_URL
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN
  const visionSimulatorId = import.meta.env.VITE_VISION_SIMULATOR_ID

  return (
    <div style={{height: '100vh', width: '100vw'}}>
      <VisionSimulator
        apiBaseUrl={apiBaseUrl}
        apiWsServiceUrl={apiWsServiceUrl}
        accessToken={accessToken}
        mapboxToken={mapboxToken}
        mode='preview'
        visionSimulatorId={visionSimulatorId}
        unsavedChanges={{
          enabled: true,
        }}
      />
    </div>
  )
}
