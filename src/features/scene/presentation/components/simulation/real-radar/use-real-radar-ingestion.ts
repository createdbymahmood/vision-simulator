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

const DEFAULT_START = '-5m' as const
const DEFAULT_STOP = '-0m' as const
const DEFAULT_EVERY = '1m' as const
const DEFAULT_FN = 'raw-data' as const
const DEFAULT_ENCODE = 'raw' as const
const DEFAULT_TIMEZONE = 'UTC' as const
const deviceSubscriptionOwnersByKey = new Map<string, number>()
const deviceSubscriptionRequestIdByKey = new Map<string, string>()
const deviceSubscriptionDeviceIdByKey = new Map<string, string>()

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

const getDeviceSubscriptionKey = (claims: DecodedUserJwt, deviceId: string) =>
  `${claims.workspaceId}:${claims.id}:${deviceId}`

// eslint-disable-next-line max-lines-per-function
export const useRealRadarIngestion = ({
  deviceIds,
  onMessages,
}: UseRealRadarIngestionInput) => {
  const accessToken = useUiStore((state) => state.accessToken)
  const apiWsServiceUrl = useUiStore((state) => state.apiWsServiceUrl)
  const claims = React.useMemo(
    () => decodeJwtClaims(accessToken),
    [accessToken],
  )
  const ownedSubscriptionKeysRef = React.useRef(new Set<string>())
  const onMessagesRef = useCallbackRef(onMessages)

  const wsUrl = apiWsServiceUrl ?? null
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
    shouldReconnect: () => Boolean(accessToken && wsUrl),
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

  const releaseSubscriptionOwnership = useCallbackRef(
    (subscriptionKey: string, canSendSubscription: boolean) => {
      const ownerCount = deviceSubscriptionOwnersByKey.get(subscriptionKey) ?? 0
      if (ownerCount <= 1) {
        const requestId = deviceSubscriptionRequestIdByKey.get(subscriptionKey)
        const deviceId = deviceSubscriptionDeviceIdByKey.get(subscriptionKey)

        if (canSendSubscription && requestId && deviceId) {
          sendSubscription('unsubscribeDevices', deviceId, requestId)
        }

        deviceSubscriptionOwnersByKey.delete(subscriptionKey)
        deviceSubscriptionRequestIdByKey.delete(subscriptionKey)
        deviceSubscriptionDeviceIdByKey.delete(subscriptionKey)
        return
      }

      deviceSubscriptionOwnersByKey.set(subscriptionKey, ownerCount - 1)
    },
  )

  const acquireSubscriptionOwnership = useCallbackRef(
    (subscriptionKey: string, deviceId: string) => {
      const ownerCount = deviceSubscriptionOwnersByKey.get(subscriptionKey) ?? 0
      if (ownerCount > 0) {
        deviceSubscriptionOwnersByKey.set(subscriptionKey, ownerCount + 1)
        return
      }

      const requestId = createRequestId()
      sendSubscription('subscribeDevices', deviceId, requestId)
      deviceSubscriptionOwnersByKey.set(subscriptionKey, 1)
      deviceSubscriptionRequestIdByKey.set(subscriptionKey, requestId)
      deviceSubscriptionDeviceIdByKey.set(subscriptionKey, deviceId)
    },
  )

  const releaseOwnedSubscriptions = useCallbackRef(
    (canSendSubscription: boolean) => {
      ownedSubscriptionKeysRef.current.forEach((subscriptionKey) => {
        releaseSubscriptionOwnership(subscriptionKey, canSendSubscription)
      })
      ownedSubscriptionKeysRef.current.clear()
    },
  )

  React.useEffect(() => {
    if (!claims || socket.readyState !== ReadyState.OPEN) {
      releaseOwnedSubscriptions(false)
      return
    }

    const nextSubscriptionKeyByDeviceId = new Map<string, string>()
    normalizedDeviceIds.forEach((deviceId) => {
      nextSubscriptionKeyByDeviceId.set(
        deviceId,
        getDeviceSubscriptionKey(claims, deviceId),
      )
    })
    const nextSubscriptionKeys = new Set(nextSubscriptionKeyByDeviceId.values())

    ownedSubscriptionKeysRef.current.forEach((subscriptionKey) => {
      if (nextSubscriptionKeys.has(subscriptionKey)) {
        return
      }

      releaseSubscriptionOwnership(subscriptionKey, true)
      ownedSubscriptionKeysRef.current.delete(subscriptionKey)
    })

    nextSubscriptionKeyByDeviceId.forEach((subscriptionKey, deviceId) => {
      if (ownedSubscriptionKeysRef.current.has(subscriptionKey)) {
        return
      }

      acquireSubscriptionOwnership(subscriptionKey, deviceId)
      ownedSubscriptionKeysRef.current.add(subscriptionKey)
    })
  }, [
    acquireSubscriptionOwnership,
    claims,
    normalizedDeviceIdsKey,
    normalizedDeviceIds,
    releaseOwnedSubscriptions,
    releaseSubscriptionOwnership,
    socket.readyState,
  ])

  React.useEffect(
    () => () => {
      releaseOwnedSubscriptions(
        Boolean(claims) && socket.readyState === ReadyState.OPEN,
      )
    },
    [claims, releaseOwnedSubscriptions, socket.readyState],
  )
}
