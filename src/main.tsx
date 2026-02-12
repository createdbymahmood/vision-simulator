import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'

import '@/host.css'
import '@/index.css'
import {App} from '@/app'

const AppRouteContent: React.FC = () => (
  <App
    apiBaseUrl={import.meta.env.VITE_API_BASE_URL}
    accessToken={import.meta.env.VITE_ACCESS_TOKEN}
    isolationMode='none'
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
    <div className='h-screen w-screen'>
      <RouterProvider router={router} />
    </div>
  </StrictMode>,
)
