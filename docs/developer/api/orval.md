# API Client Generation (Orval)

Generate or refresh API clients from the Swagger file:
```bash
pnpm orval
```

This runs:
- `scripts/download-swagger-file.mjs`
- `orval --config src/data-provider/orval.config.ts`

Generated clients are written under `src/data-provider/api`.
