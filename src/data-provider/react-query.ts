import type {QueryClientConfig} from '@tanstack/react-query'

import {QueryClient} from '@tanstack/react-query'
import {capitalize} from 'lodash-es'
import {toast} from 'sonner'

import {toClientErrorMessage} from '@/lib/error'

const defaultQueryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      retry: 0,
    },
    mutations: {
      onError: (error) => {
        void toast.error(capitalize(toClientErrorMessage(error)))
      },
    },
  },
}

export const queryClient = new QueryClient(defaultQueryClientConfig)
