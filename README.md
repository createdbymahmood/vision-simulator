# React + TypeScript + Vite

## Documentation

- `docs/user-guide.md`
- `docs/keyboard-shortcuts.md`
- `docs/scene-json-schema.md`
- `docs/developer-setup.md`
- `docs/known-limitations.md`

## Release Workflow

- Use `yarn release:patch`, `yarn release:minor`, or `yarn release:major`.
- Each command requires a clean git working tree and a non-detached branch.
- The command runs a push preflight check, then bumps `package.json` version, creates `chore(release): vX.Y.Z` commit and `vX.Y.Z` tag, then pushes both.
- If pushing fails after tag creation, the script deletes the created tag (local and remote if needed) before exiting.
- Pushing the tag triggers `.github/workflows/release-on-tag.yml`, which builds and publishes to GitHub Packages.
- CI rejects the release when the pushed tag does not match `package.json.version`.
- CI uses `GITHUB_TOKEN` for package publishing.

## Required Props

The `VisionSimulator` export requires an `apiBaseUrl`, `apiWsServiceUrl`,
`mapboxToken`, `visionSimulatorId`, and `accessToken` to be provided via props.
The app does not fall back to `import.meta.env` internally.

```tsx
import {VisionSimulator} from '@vega-tek-hub/vision-simulator-v2'

interface AppProps {
  apiBaseUrl: string
  apiWsServiceUrl: string
  mapboxToken: string
  visionSimulatorId: string
  accessToken: string
  mode?: 'editor' | 'preview'
}

export const App: React.FC<AppProps> = ({
  accessToken,
  apiBaseUrl,
  apiWsServiceUrl,
  mapboxToken,
  visionSimulatorId,
}) => {
  return (
    <VisionSimulator
      accessToken={accessToken}
      apiBaseUrl={apiBaseUrl}
      apiWsServiceUrl={apiWsServiceUrl}
      mapboxToken={mapboxToken}
      mode='editor'
      visionSimulatorId={visionSimulatorId}
    />
  )
}
```

## Mode Prop

`mode` is optional and defaults to `'editor'`.

- `mode='editor'`: full editor UI and standard preview toggle behavior.
- `mode='preview'`: simulation-only view (no top bar or editor surfaces).

```tsx
<VisionSimulator
  accessToken={accessToken}
  apiBaseUrl={apiBaseUrl}
  apiWsServiceUrl={apiWsServiceUrl}
  mapboxToken={mapboxToken}
  mode='preview'
  visionSimulatorId={visionSimulatorId}
/>
```

```tsx
<VisionSimulator
  accessToken={accessToken}
  apiBaseUrl={apiBaseUrl}
  apiWsServiceUrl={apiWsServiceUrl}
  mapboxToken={mapboxToken}
  mode='editor'
  visionSimulatorId={visionSimulatorId}
/>
```

## UI Overrides Styling

`uiOverrides` components are rendered in the normal DOM tree and use the app's
regular stylesheet pipeline.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
