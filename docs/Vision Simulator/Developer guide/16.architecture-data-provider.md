# Data Provider

## Axios Setup
`src/app.tsx` configures axios with `applyAxiosApiBaseUrl` and `applyAxiosAuthorizationHeader` before the simulator renders. These must be provided by the host app via props.

## React Query
TanStack Query is configured in `src/data-provider/react-query.ts` and used throughout the app for data fetching and caching.

## API Clients
API clients are generated via Orval and live under `src/data-provider/api`.
See `api/orval.md` for regeneration steps.
