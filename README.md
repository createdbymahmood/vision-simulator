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

The `VisionSimulator` export requires an `apiBaseUrl`, `mapboxToken`,
`visionSimulatorId`, and `accessToken` to be provided via props. The app does
not fall back to `import.meta.env` internally.

```tsx
import {VisionSimulator} from '@vega-tek-hub/vision-simulator-v2'

interface AppProps {
  apiBaseUrl: string
  mapboxToken: string
  visionSimulatorId: string
  accessToken: string
  mode?: 'editor' | 'preview'
  portalTarget?: 'shadow' | 'document'
}

export const App: React.FC<AppProps> = ({
  accessToken,
  apiBaseUrl,
  mapboxToken,
  visionSimulatorId,
}) => {
  return (
    <VisionSimulator
      accessToken={accessToken}
      apiBaseUrl={apiBaseUrl}
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
  mapboxToken={mapboxToken}
  mode='preview'
  visionSimulatorId={visionSimulatorId}
/>
```

```tsx
<VisionSimulator
  accessToken={accessToken}
  apiBaseUrl={apiBaseUrl}
  mapboxToken={mapboxToken}
  mode='editor'
  visionSimulatorId={visionSimulatorId}
/>
```

## Shadow DOM Styles for `uiOverrides`

By default, `isolationMode='shadow'` renders the simulator inside a Shadow DOM.

- If `uiOverrides` is provided, host app styles are automatically mirrored
  into the Shadow DOM so passed components keep their styling.
- If `shadowStyleUrls` is passed, those URLs still take precedence.

## Portal Target for Popovers/Selects

When `isolationMode='shadow'`, portal-based UI (Select, Dropdown, Popover, etc.)
defaults to rendering inside the shadow root (`portalTarget='shadow'`).

If your host page applies transforms/zoom/layout effects that cause inaccurate
overlay positioning, use:

```tsx
<VisionSimulator
  accessToken={accessToken}
  apiBaseUrl={apiBaseUrl}
  mapboxToken={mapboxToken}
  isolationMode='shadow'
  portalTarget='document'
  visionSimulatorId={visionSimulatorId}
/>
```

This keeps the main app in Shadow DOM while rendering portal overlays to
`document.body` for more stable positioning in complex host layouts.

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
