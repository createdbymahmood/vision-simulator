# Data and API Refresh

## Regenerate API Clients
```bash
pnpm orval
```

## Swagger Sources
The Swagger files are fetched by `scripts/download-swagger-file.mjs` from:
- `http://be-dev.sensolist.com/api-docs/doc.json`
- `http://be-ingestion-dev.sensolist.com/api-docs/doc.json`

If those endpoints change, update the script and re-run `pnpm orval`.
