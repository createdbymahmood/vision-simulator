# Builds

## App Build (Vite)
```bash
pnpm build
```
Runs `tsc -b` then `vite build`.

## Library Build (Publishable Package)
```bash
pnpm build:lib
```
Produces:
- `dist/index.js` and `dist/index.d.ts`
- `dist/styles.css` and `dist/host.css`
- `dist/assets/camera-fov.worker-*.js`

`build:lib` also runs the Tailwind build via `build:styles`.
