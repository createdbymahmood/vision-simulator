import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import {useRef, useState} from 'react'

import type {SimulationViewportHandle} from './types'

interface UseViewportRecorderResult {
  recording: boolean
  startRecording: (handle: SimulationViewportHandle | null) => Promise<boolean>
  stopRecording: () => void
  replaceSource: (handle: SimulationViewportHandle | null) => void
}

const stopStreamTracks = (stream: MediaStream | null) => {
  stream?.getTracks().forEach((track) => track.stop())
}

const downloadBlob = (blob: Blob) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `simulation-${Date.now()}.webm`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}

export const useViewportRecorder = (): UseViewportRecorderResult => {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const composedStreamRef = useRef<MediaStream | null>(null)
  const sourceStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [recording, setRecording] = useState(false)

  const resetStreams = () => {
    stopStreamTracks(sourceStreamRef.current)
    stopStreamTracks(composedStreamRef.current)
    sourceStreamRef.current = null
    composedStreamRef.current = null
  }

  const stopRecording = useCallbackRef(() => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      return
    }
    recorder.stop()
  })

  const startRecording = useCallbackRef(
    async (handle: SimulationViewportHandle | null): Promise<boolean> => {
      if (!handle) {
        return false
      }
      if (recorderRef.current && recorderRef.current.state === 'recording') {
        return true
      }
      if (typeof MediaRecorder === 'undefined') {
        return false
      }

      const stream = handle.getStream()
      const track = stream?.getVideoTracks()[0]
      if (!stream || !track) {
        stopStreamTracks(stream ?? null)
        return false
      }

      const composedStream = new MediaStream()
      composedStream.addTrack(track)
      composedStreamRef.current = composedStream
      sourceStreamRef.current = stream
      chunksRef.current = []

      try {
        const preferredOptions: MediaRecorderOptions[] = [
          {mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 10_000_000},
          {mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 8_000_000},
          {mimeType: 'video/webm', videoBitsPerSecond: 8_000_000},
        ]
        const recorder =
          preferredOptions.reduce<MediaRecorder | null>((created, options) => {
            if (created) return created
            try {
              return new MediaRecorder(composedStream, options)
            } catch {
              return null
            }
          }, null) ?? new MediaRecorder(composedStream)
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data)
          }
        }
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, {type: 'video/webm'})
          downloadBlob(blob)
          recorderRef.current = null
          setRecording(false)
          resetStreams()
        }
        recorder.start()
        recorderRef.current = recorder
        setRecording(true)
        return true
      } catch (error) {
        resetStreams()
        return false
      }
    },
  )

  const replaceSource = useCallbackRef(
    (handle: SimulationViewportHandle | null) => {
      if (!handle || !recorderRef.current || !composedStreamRef.current) {
        return
      }
      const nextStream = handle.getStream()
      const nextTrack = nextStream?.getVideoTracks()[0]
      if (!nextStream || !nextTrack) {
        stopStreamTracks(nextStream ?? null)
        return
      }
      const composedStream = composedStreamRef.current

      composedStream.getVideoTracks().forEach((track) => {
        composedStream.removeTrack(track)
        track.stop()
      })

      if (nextTrack) {
        composedStream.addTrack(nextTrack)
      }

      stopStreamTracks(sourceStreamRef.current)
      sourceStreamRef.current = nextStream
    },
  )

  return {
    recording,
    replaceSource,
    startRecording,
    stopRecording,
  }
}
