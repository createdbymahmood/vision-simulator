import type {AxiosError, AxiosInstance, AxiosRequestConfig} from 'axios'

import axios from 'axios'
import {v4 as uuidv4} from 'uuid'

const ApiServiceCallerInstance = axios.create({})
const IngestionServiceCallerInstance = axios.create({})

const instances: AxiosInstance[] = [
  ApiServiceCallerInstance,
  IngestionServiceCallerInstance,
]

export const applyAxiosApiBaseUrl = (apiBaseUrl: string) => {
  instances.forEach((instance) => {
    instance.defaults.baseURL = apiBaseUrl
  })
}

export const applyAxiosAuthorizationHeader = (accessToken: string) => {
  instances.forEach((instance) => {
    instance.defaults.headers.common.Authorization = `Bearer ${accessToken}`
  })
}

export const clearAxiosAuthorizationHeader = () => {
  instances.forEach((instance) => {
    instance.defaults.headers.common.Authorization = null
  })
}

export const applyDeviceIdHeader = (deviceId: string) => {
  instances.forEach((instance) => {
    instance.defaults.headers['X-Client-ID'] = deviceId
  })
}

const applyAxios401Interceptor = () => {
  // Apply the interceptor for response
  instances.forEach((instance) => {
    instance.interceptors.response.use(
      (response) => {
        return response // If the response is successful, pass it through
      },
      (error: AxiosError) => {
        // Always reject the error to propagate it
        return Promise.reject(error)
      },
    )
  })
}

const applyXTraceIdHeader = () => {
  instances.forEach((instance) => {
    instance.interceptors.request.use((config) => {
      config.headers['X-Trace-ID'] = uuidv4()
      return config
    })
  })
}

applyAxios401Interceptor()
applyXTraceIdHeader()

// add a second `options` argument here if you want to pass extra options to each generated query
export const apiServiceInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const source = axios.CancelToken.source()
  const promise = ApiServiceCallerInstance({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({data}) => data)

  // @ts-ignore ignore cm
  promise.cancel = () => {
    source.cancel('Query was cancelled')
  }

  return promise
}

export const ingestionApiServiceInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const source = axios.CancelToken.source()
  const promise = IngestionServiceCallerInstance({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({data}) => data)

  // @ts-ignore ignore cm
  promise.cancel = () => {
    source.cancel('Query was cancelled')
  }

  return promise
}

// In some case with react-query and swr you want to be able to override the return error type so you can also do it here like this
export type ErrorType<Error> = AxiosError<Error>

export type BodyType<BodyData> = BodyData
