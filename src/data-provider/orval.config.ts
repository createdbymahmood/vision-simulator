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
        tags: [/^visionsimulator$/i, /^device$/i, /^file$/i],
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
  Ingestion: {
    input: {
      target: './swagger/ingestion.json',
      override: {
        transformer: (specs) => assign(specs, {info: {title: 'api'}}),
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
          name: 'ingestionApiServiceInstance',
        },
        query: {
          useSuspenseQuery: true,
        },
        operations: {
          GetDevicesDataByIdPost: {
            query: {
              useSuspenseQuery: true,
              useQuery: true,
              useMutation: false,
            },
          },
        },
      },
      target: 'api/services/ingestion',
    },
  },
})
