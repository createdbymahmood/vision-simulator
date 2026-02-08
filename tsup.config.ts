import {defineConfig} from 'tsup'

import {
  createEsbuildClassNameObfuscationPlugin,
  getClassNameObfuscationContext,
} from './scripts/classname-obfuscation'

const classNameObfuscationContext = getClassNameObfuscationContext(
  process.cwd(),
)

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  tsconfig: 'tsconfig.lib.json',
  external: ['react', 'react-dom'],
  esbuildPlugins: [
    createEsbuildClassNameObfuscationPlugin(classNameObfuscationContext),
  ],
})
