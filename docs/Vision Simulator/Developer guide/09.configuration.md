# Configuration

## Environment
There is an `.env` file in repo root for local development. The library itself does not read `import.meta.env` directly; the host app must pass required props (API URLs, tokens).

## Vite
`vite.config.ts` enables:
- React plugin
- Tailwind plugin
- tsconfig path aliases (`@/*`)

## TypeScript
- `tsconfig.app.json` is used for app typechecking
- `tsconfig.lib.json` is used for library type output
- `tsconfig.node.json` is for tooling
