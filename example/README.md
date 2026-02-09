# Vision Simulator Example (Vite + React + TanStack Router)

This example consumes the local `@vega-tek-hub/vision-simulator-v2` package and demonstrates the Phase 21 leave guard:

- route blocking when navigating away with unsaved changes
- browser unload/reload warning when unsaved changes exist

## Setup

From repo root:

```bash
yarn --cwd example install
```

Build the library after package changes:

```bash
yarn build:lib
```

Start the example app:

```bash
yarn --cwd example dev
```

## How to Verify

1. Open `/simulator`.
2. Make any scene change.
3. Click `Home` in the top navigation.
4. Confirm you see the unsaved-changes dialog (`Save and leave` / `Discard changes` / `Stay`).
5. Back on `/simulator`, make a change and refresh the browser tab to verify native unload warning.
