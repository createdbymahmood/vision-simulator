# Build Pipeline

## App Build
`pnpm build` runs:
1. `tsc -b` using `tsconfig.app.json`
2. `vite build` with `vite.config.ts`

## Library Build
`pnpm build:lib` runs:
1. `rimraf dist`
2. `tsup` (see `tsup.config.ts`)
3. `pnpm build:styles`

## Styles
`build:styles` compiles Tailwind styles into `dist/styles.css` and copies `src/host.css` into `dist/host.css`:
```bash
tailwindcss -i src/styles.css -o dist/styles.css --content "./src/**/*.{ts,tsx}" --minify
node scripts/normalize-dist-css.mjs dist/styles.css
node scripts/copy-file.mjs src/host.css dist/host.css
```

`normalize-dist-css.mjs` removes Tailwind `@layer` wrappers and ensures a runtime defaults fallback.
