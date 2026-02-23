import type mapboxgl from 'mapbox-gl'

interface UpdateCameraMarkerInteractivityInput {
  element: HTMLDivElement
  hasVideo: boolean
  label: string
  onOpen: () => void
}

export const updateCameraMarkerInteractivity = ({
  element,
  hasVideo,
  label,
  onOpen,
}: UpdateCameraMarkerInteractivityInput) => {
  element.classList.toggle('clickable', hasVideo)

  if (!hasVideo) {
    element.removeAttribute('role')
    element.removeAttribute('aria-label')
    element.onclick = null
    return
  }

  element.setAttribute('role', 'button')
  element.setAttribute('aria-label', label)
  element.onclick = (event) => {
    event.stopPropagation()
    onOpen()
  }
}

export const updateCameraMarkerDirection = (
  marker: mapboxgl.Marker,
  yawDeg: number,
) => {
  const directionElement = marker
    .getElement()
    .querySelector('.real-radar-camera-direction') as HTMLDivElement | null

  if (directionElement) {
    directionElement.style.transform = `translate(-50%, -90%) rotate(${yawDeg}deg)`
  }
}

interface CreateCameraMarkerElementInput {
  cameraColor: string
  cameraLabel: string
  interactivityLabel: string
  hasVideo: boolean
  onOpen: () => void
}

export const createCameraMarkerElement = ({
  cameraColor,
  cameraLabel,
  interactivityLabel,
  hasVideo,
  onOpen,
}: CreateCameraMarkerElementInput) => {
  const container = document.createElement('div')
  container.className = 'real-radar-camera-marker'
  container.style.setProperty('--camera-color', cameraColor)

  updateCameraMarkerInteractivity({
    element: container,
    hasVideo,
    label: interactivityLabel,
    onOpen,
  })

  const label = document.createElement('div')
  label.className = 'real-radar-camera-label'
  label.textContent = cameraLabel

  const body = document.createElement('div')
  body.className = 'real-radar-camera-body'

  const direction = document.createElement('div')
  direction.className = 'real-radar-camera-direction'

  container.appendChild(label)
  container.appendChild(body)
  container.appendChild(direction)

  return container
}
