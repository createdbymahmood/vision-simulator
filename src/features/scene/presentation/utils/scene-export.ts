import {format} from 'date-fns'

const createTimestamp = (date: Date = new Date()) =>
  format(date, 'yyyy-MM-dd_HH-mm-ss')

export const createRecordingFilename = (date?: Date) =>
  `simulation_${createTimestamp(date)}.webm`

export const createSnapshotFilename = (date?: Date) =>
  `snapshot_${createTimestamp(date)}.png`

export const createSceneJsonFilename = (date?: Date) =>
  `scene_${createTimestamp(date)}.json`

export const createSceneImageFilename = (date?: Date) =>
  `scene_${createTimestamp(date)}.png`

export const downloadBlob = (blob: Blob, filename: string) => {
  if (typeof document === 'undefined') {
    return
  }
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const downloadDataUrl = (dataUrl: string, filename: string) => {
  if (typeof document === 'undefined') {
    return
  }
  const anchor = document.createElement('a')
  anchor.href = dataUrl
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export const formatRecordingTimer = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
