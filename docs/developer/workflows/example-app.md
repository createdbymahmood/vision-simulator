# Example App

The `example/` workspace consumes the local package and is useful for integration testing.

From repo root:
```bash
pnpm install
pnpm build:lib
pnpm --filter example dev
```

The example app includes routes for testing unsaved-change guards and UI integration.
