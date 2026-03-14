# Developer Setup

## Requirements

- Node.js 18+ (or the project's supported runtime)
- pnpm 10.30.2

Enable Corepack once if pnpm is not already available:

```bash
corepack enable
```

## Install

```bash
pnpm install
```

## Environment Variables

Create a `.env` file:

```
VITE_API_BASE_URL=https://your-api-host/api
VITE_API_WS_SERVICE_URL=wss://your-api-host/ws
VITE_ACCESS_TOKEN=your_access_token_here
VITE_MAPBOX_TOKEN=your_token_here
VITE_VISION_SIMULATOR_ID=your_vision_id_here
```

## Run

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

## Lint

```bash
pnpm lint
```
