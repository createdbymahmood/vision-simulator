import {defineConfig} from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'camera-fov.worker':
      'src/features/scene/map/camera-fov.worker.js',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  tsconfig: 'tsconfig.lib.json',
  external: ['react', 'react-dom'],
})
