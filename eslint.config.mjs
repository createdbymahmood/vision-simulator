import {defineConfig} from '@fullstacksjs/eslint-config'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'

import {tailwindPrefixPlugin} from './eslint/tailwind-prefix-plugin.mjs'

export default defineConfig({
  ignores: ['src/routes/**', 'src/data-provider/api/**'],
  plugins: {
    'unused-imports': unusedImports,
    'react-refresh': reactRefresh,
    'tailwind-prefix': tailwindPrefixPlugin,
  },
  rules: {
    'no-unused-vars': 'off', // or "@typescript-eslint/no-unused-vars": "off",
    'unused-imports/no-unused-imports': 'off',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    'tailwind-prefix/prefix-classes': 'warn',
  },
})
