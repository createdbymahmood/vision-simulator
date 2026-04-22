import '@/host.css'
import '@/styles.css'
import '@/local-app-base.css'

import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'

import {App} from '@/app'

const AppRouteContent: React.FC = () => (
  <App
    mapboxToken={import.meta.env.VITE_MAPBOX_TOKEN}
    visionSimulatorId={import.meta.env.VITE_VISION_SIMULATOR_ID}
  />
)

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const defaultAppRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: AppRouteContent,
})

const router = createRouter({
  routeTree: rootRoute.addChildren([defaultAppRoute]),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className='vs:h-screen vs:w-screen'>
      <RouterProvider router={router} />
    </div>
  </StrictMode>,
)
