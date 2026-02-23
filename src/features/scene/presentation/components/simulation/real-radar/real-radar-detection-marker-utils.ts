import type {DetectionState} from './real-radar-types'

const detectionIcons: Record<string, string> = {
  helmet: '🪖',
  cigarette: '🚬',
  hat: '🎩',
  facemask: '😷',
  firesmoke: '🔥',
  gloves: '🧤',
  vest: '🦺',
  boots: '🥾',
  goggles: '🥽',
  person: '🧍',
  bicycle: '🚲',
  motorcycle: '🏍️',
  car: '🚗',
  bus: '🚌',
  truck: '🚚',
  backpack: '🎒',
  cellphone: '📱',
}

const detectionColors: Record<string, string> = {
  helmet: '#f97316',
  cigarette: '#f43f5e',
  hat: '#a855f7',
  facemask: '#06b6d4',
  firesmoke: '#ef4444',
  gloves: '#22c55e',
  vest: '#facc15',
  boots: '#b45309',
  goggles: '#0ea5e9',
  person: '#38bdf8',
  bicycle: '#3b82f6',
  motorcycle: '#0f172a',
  car: '#14b8a6',
  bus: '#a855f7',
  truck: '#6366f1',
  backpack: '#ec4899',
  cellphone: '#64748b',
}

export const updateDetectionMarkerElement = ({
  element,
  detectionState,
}: {
  element: HTMLDivElement
  detectionState: DetectionState
}) => {
  const icon = detectionIcons[detectionState.className] ?? '📍'
  const color = detectionColors[detectionState.className] ?? '#f97316'

  element.style.setProperty('--marker-color', color)
  element.title = `${detectionState.className} (${Math.round((detectionState.confidence ?? 0) * 100)}%)`

  let iconElement = element.querySelector(
    '.real-radar-detection-icon',
  ) as HTMLDivElement | null

  if (!iconElement) {
    iconElement = document.createElement('div')
    iconElement.className = 'real-radar-detection-icon'
    element.appendChild(iconElement)
  }

  iconElement.textContent = icon
}
