import type {RadarMessage} from './real-radar-types'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const parseJson = (value: string): unknown => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const collectRadarMessages = (value: unknown, output: RadarMessage[]) => {
  if (!value) {
    return
  }

  if (typeof value === 'string') {
    const parsed = parseJson(value)
    if (!parsed) {
      return
    }

    collectRadarMessages(parsed, output)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item) => {
      collectRadarMessages(item, output)
    })
    return
  }

  if (!isRecord(value)) {
    return
  }

  const candidate = value as RadarMessage
  const hasDetection = Boolean(candidate.detection)
  const hasCamera = Boolean(candidate.camera || candidate.source_camera)

  if (hasDetection && hasCamera) {
    output.push(candidate)
    return
  }

  Object.values(value).forEach((nestedValue) => {
    collectRadarMessages(nestedValue, output)
  })
}

export const extractRadarMessages = (value: unknown): RadarMessage[] => {
  const output: RadarMessage[] = []
  collectRadarMessages(value, output)
  return output
}
