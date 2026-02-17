import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'
import useWebSocket, {ReadyState} from 'react-use-websocket'

import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'

import type {RadarMessage} from './real-radar-types'

import {extractRadarMessages} from './real-radar-parsers'

interface DecodedUserJwt {
  id: string
  workspaceId: string
}

interface UseRealRadarIngestionInput {
  deviceIds: string[]
  onMessages: (messages: RadarMessage[]) => void
}

interface DeviceSubscriptionMessage {
  requestId: string
  workspace: string
  userId: string
  timestamp: string
  timezone: 'UTC'
  provider: 'ingestion'
  method: 'subscribeDevices' | 'unsubscribeDevices'
  payload: {
    device: string
    sensors: []
    start: '-5m'
    stop: '-0m'
    every: '1m'
    fn: 'raw-data'
    encode: 'raw'
  }
}

const DEFAULT_WS_URL = 'ws://ws-dev.sensolist.com/ws'
const DEFAULT_START = '-5m' as const
const DEFAULT_STOP = '-0m' as const
const DEFAULT_EVERY = '1m' as const
const DEFAULT_FN = 'raw-data' as const
const DEFAULT_ENCODE = 'raw' as const
const DEFAULT_TIMEZONE = 'UTC' as const

const decodeJwtClaims = (accessToken?: string): DecodedUserJwt | null => {
  if (!accessToken) {
    return null
  }

  const payloadSegment = accessToken.split('.')[1]
  if (!payloadSegment) {
    return null
  }

  try {
    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    )
    const decodedText = decodeURIComponent(
      Array.from(atob(padded))
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )

    const parsed = JSON.parse(decodedText) as Partial<DecodedUserJwt>
    if (
      typeof parsed.id !== 'string' ||
      typeof parsed.workspaceId !== 'string'
    ) {
      return null
    }

    return {
      id: parsed.id,
      workspaceId: parsed.workspaceId,
    }
  } catch {
    return null
  }
}

const getWsBaseUrl = () => {
  const fromEnv = import.meta.env.VITE_API_WS_SERVICE_URL
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    return fromEnv.trim()
  }

  return DEFAULT_WS_URL
}

const createRequestId = () => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const buildBinaryMessage = (
  provider: string,
  jsonText: string,
): ArrayBuffer => {
  const encoder = new TextEncoder()
  const providerBytes = encoder.encode(provider)
  const bodyBytes = encoder.encode(jsonText)

  if (providerBytes.length > 255) {
    throw new Error('Provider field is too long for binary envelope')
  }

  const output = new Uint8Array(1 + providerBytes.length + bodyBytes.length)
  output[0] = providerBytes.length
  output.set(providerBytes, 1)
  output.set(bodyBytes, 1 + providerBytes.length)

  return output.buffer
}

const buildSubscriptionMessage = (
  method: 'subscribeDevices' | 'unsubscribeDevices',
  deviceId: string,
  requestId: string,
  claims: DecodedUserJwt,
): ArrayBuffer => {
  const payload: DeviceSubscriptionMessage = {
    requestId,
    workspace: claims.workspaceId,
    userId: claims.id,
    timestamp: new Date().toISOString(),
    timezone: DEFAULT_TIMEZONE,
    provider: 'ingestion',
    method,
    payload: {
      device: deviceId,
      sensors: [],
      start: DEFAULT_START,
      stop: DEFAULT_STOP,
      every: DEFAULT_EVERY,
      fn: DEFAULT_FN,
      encode: DEFAULT_ENCODE,
    },
  }

  return buildBinaryMessage('ingestion', JSON.stringify(payload))
}

const getUniqueDeviceIds = (deviceIds: string[]) =>
  Array.from(new Set(deviceIds.filter(Boolean)))

export const useRealRadarIngestion = ({
  deviceIds,
  onMessages,
}: UseRealRadarIngestionInput) => {
  const accessToken = useUiStore((state) => state.accessToken)
  const claims = React.useMemo(
    () => decodeJwtClaims(accessToken),
    [accessToken],
  )
  const activeDeviceRequestIdsRef = React.useRef(new Map<string, string>())
  const onMessagesRef = useCallbackRef(onMessages)

  const wsUrl = React.useMemo(() => getWsBaseUrl(), [])
  const normalizedDeviceIds = React.useMemo(
    () => getUniqueDeviceIds(deviceIds),
    [deviceIds],
  )
  const normalizedDeviceIdsKey = React.useMemo(
    () => [...normalizedDeviceIds].sort().join('|'),
    [normalizedDeviceIds],
  )

  const processSocketText = useCallbackRef((messageText: string) => {
    const messages = extractRadarMessages(messageText)
    if (messages.length) {
      onMessagesRef(messages)
    }
  })

  const socket = useWebSocket<unknown>(wsUrl, {
    shouldReconnect: () => Boolean(accessToken),
    retryOnError: true,
    share: true,
    reconnectInterval: 2_000,
    queryParams: {
      token: accessToken ?? '',
      id: claims?.id ?? '',
    },
    onMessage(event) {
      if (typeof event.data === 'string') {
        processSocketText(event.data)
        return
      }

      if (event.data instanceof Blob) {
        void event.data.text().then((text) => {
          processSocketText(text)
        })
      }
    },
  })

  const sendSubscription = useCallbackRef(
    (
      method: 'subscribeDevices' | 'unsubscribeDevices',
      deviceId: string,
      requestId: string,
    ) => {
      if (!claims) {
        return
      }

      const message = buildSubscriptionMessage(
        method,
        deviceId,
        requestId,
        claims,
      )
      socket.sendMessage(message)
    },
  )

  React.useEffect(() => {
    if (!claims || socket.readyState !== ReadyState.OPEN) {
      return
    }

    const currentSubscriptions = activeDeviceRequestIdsRef.current
    const nextDeviceIds = new Set(normalizedDeviceIds)

    currentSubscriptions.forEach((requestId, currentDeviceId) => {
      if (nextDeviceIds.has(currentDeviceId)) {
        return
      }

      sendSubscription('unsubscribeDevices', currentDeviceId, requestId)
      currentSubscriptions.delete(currentDeviceId)
    })

    normalizedDeviceIds.forEach((deviceId) => {
      if (currentSubscriptions.has(deviceId)) {
        return
      }

      const requestId = createRequestId()
      sendSubscription('subscribeDevices', deviceId, requestId)
      currentSubscriptions.set(deviceId, requestId)
    })
  }, [
    claims,
    normalizedDeviceIdsKey,
    normalizedDeviceIds,
    sendSubscription,
    socket.readyState,
  ])

  React.useEffect(
    () => () => {
      if (!claims || socket.readyState !== ReadyState.OPEN) {
        return
      }

      activeDeviceRequestIdsRef.current.forEach((requestId, deviceId) => {
        sendSubscription('unsubscribeDevices', deviceId, requestId)
      })

      activeDeviceRequestIdsRef.current.clear()
    },
    [claims, sendSubscription, socket.readyState],
  )
}
