# Assets and Styles

## Entry Styles
Global styles are defined in `src/styles.css` and include:
- Tailwind base and utilities
- Mapbox GL styles
- Feature CSS for Real Radar

## Host Styles
`src/host.css` is copied to `dist/host.css` during `build:styles`. Host apps should import both `styles.css` and `host.css`.

## Tailwind
Tailwind is configured via `@tailwindcss/vite` for dev and `@tailwindcss/cli` for the library build. The CSS output is post-processed by `scripts/normalize-dist-css.mjs` to remove `@layer` rules for compatibility.
