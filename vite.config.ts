import {fileURLToPath} from 'node:url'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import {defineConfig, type PluginOption} from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
/* @ts-expect-error -> no declaration file */
import {scopeCss} from './scripts/scope-css.mjs'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const scopedCssEntry = path.resolve(rootDir, 'src/index.css')

function scopedCssPlugin(): PluginOption {
  return {
    name: 'vision-simulator-scoped-css',
    enforce: 'pre',
    apply: 'serve',
    transform(code: string, id: string) {
      const normalizedId = id.split('?')[0]
      if (normalizedId !== scopedCssEntry) {
        return null
      }

      return scopeCss(code)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    scopedCssPlugin(),
    tsconfigPaths({
      projects: [
        './tsconfig.json',
        './tsconfig.app.json',
        './tsconfig.node.json',
      ],
    }),
    react(),
  ],
})
