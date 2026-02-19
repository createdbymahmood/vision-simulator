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
import '@/host.css'
import '@/index.css'

const AppRouteContent: React.FC = () => (
  <App
    apiBaseUrl={import.meta.env.VITE_API_BASE_URL}
    mediaMtxUrl={import.meta.env.VITE_MEDIA_MTX_URL}
    accessToken={import.meta.env.VITE_ACCESS_TOKEN}
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
    <div className='vision-simulator-root vs:h-screen vs:w-screen'>
      <RouterProvider router={router} />
    </div>
  </StrictMode>,
)
