import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import {
  VisionSimulator,
  type DirtyStateChangePayload,
} from '@vega-tek-hub/vision-simulator-v2'
import simulatorStylesUrl from '@vega-tek-hub/vision-simulator-v2/styles.css?url'
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
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: '100vh',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '12px',
        }}
      >
        <strong>Vision Simulator v2 Example</strong>
        <Link to='/' activeProps={{style: {fontWeight: 700}}}>
          Home
        </Link>
        <Link to='/simulator' activeProps={{style: {fontWeight: 700}}}>
          Simulator
        </Link>
      </header>

      <Outlet />
    </div>
  )
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
  const [dirtyState, setDirtyState] = React.useState<DirtyStateChangePayload>({
    isDirty: false,
    isSaving: false,
  })

  const accessToken = import.meta.env.VITE_ACCESS_TOKEN
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN
  const visionSimulatorId = import.meta.env.VITE_VISION_SIMULATOR_ID

  return (
    <section
      style={{
        display: 'grid',
        gap: '12px',
        minHeight: 0,
        flex: 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <span>
          Dirty: <strong>{String(dirtyState.isDirty)}</strong>
        </span>
        <span>
          Saving: <strong>{String(dirtyState.isSaving)}</strong>
        </span>
      </div>

      <p style={{margin: 0}}>
        To test route blocking: make changes, then click <code>Home</code> in the
        top navigation.
      </p>

      <p style={{margin: 0}}>
        To test browser unload blocking: make changes, then refresh the tab.
      </p>

      <div
        style={{
          minHeight: 0,
          flex: 1,
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <VisionSimulator
          apiBaseUrl={apiBaseUrl}
          accessToken={accessToken}
          isolationMode='shadow'
          mapboxToken={mapboxToken}
          shadowStyleUrls={[simulatorStylesUrl]}
          unsavedChanges={{
            enabled: true,
            onDirtyStateChange: setDirtyState,
          }}
          visionSimulatorId={visionSimulatorId}
        />
      </div>
    </section>
  )
}
