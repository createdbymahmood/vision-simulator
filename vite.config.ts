import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import {createViteClassNameObfuscationPlugin} from './scripts/classname-obfuscation'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    createViteClassNameObfuscationPlugin(),
    tailwindcss(),
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
