# Host App Integration

## Install
```bash
pnpm add @vega-tek-hub/vision-simulator-v2
```

For GitHub Packages, configure `.npmrc`:
```bash
@vega-tek-hub:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

## Styles
Import styles in your host entry:
```ts
import '@vega-tek-hub/vision-simulator-v2/styles.css'
import '@vega-tek-hub/vision-simulator-v2/host.css'
```

## Required Props
The component requires these props at runtime:
- `apiBaseUrl`
- `apiWsServiceUrl`
- `mapboxToken`
- `visionSimulatorId`
- `accessToken`

## Optional Props
- `mode`: `'editor' | 'preview'` (defaults to `editor`)
- `mediaMtxUrl`: media stream base URL (used by real-device feeds)
- `unsavedChanges`: config for leave-guard prompts
- `uiOverrides`: optional UI slot overrides

## Usage Example
```tsx
import {VisionSimulator} from '@vega-tek-hub/vision-simulator-v2'

export const App = () => (
  <VisionSimulator
    accessToken={accessToken}
    apiBaseUrl={apiBaseUrl}
    apiWsServiceUrl={apiWsServiceUrl}
    mapboxToken={mapboxToken}
    visionSimulatorId={visionSimulatorId}
    mode='editor'
  />
)
```
