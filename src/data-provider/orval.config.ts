import {assign} from 'lodash-es'
import {defineConfig} from 'orval'

export default defineConfig({
  V2: {
    input: {
      target: './swagger/v2.json',
      override: {
        transformer: (specs) => assign(specs, {info: {title: 'api'}}),
      },
      filters: {
        tags: [/^visionsimulator$/i],
      },
    },
    output: {
      mode: 'tags',
      prettier: true,
      client: 'react-query',
      clean: true,
      override: {
        mutator: {
          path: './axios/axios.ts',
          name: 'apiServiceInstance',
        },
        query: {
          useSuspenseQuery: true,
        },
      },
      target: 'api/services/v2',
    },
  },
})
