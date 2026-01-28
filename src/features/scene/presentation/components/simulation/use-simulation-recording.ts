import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'
import {toast} from 'sonner'

import {
  createRecordingFilename,
  downloadBlob,
  formatRecordingTimer,
} from '@/features/scene/presentation/utils/scene-export'

import type {SimulationCaptureApi} from './simulation-capture'

interface UseSimulationRecordingOptions {
  captureRef: React.RefObject<SimulationCaptureApi | null>
}

interface RecordingState {
  isRecording: boolean
  elapsedSeconds: number
  formattedTime: string
  fps: number | null
  isLowFps: boolean
  startRecording: () => void
  stopRecording: () => void
}

const TARGET_RECORDING_FPS = 30
const RECORDING_MIME_TYPE = 'video/webm;codecs=vp9'
const RECORDING_BITRATE = 8_000_000
const FPS_WARNING_THRESHOLD = 30

const useFpsMonitor = (enabled: boolean) => {
  const [fps, setFps] = React.useState<number | null>(null)
  const frameRef = React.useRef(0)
  const lastTimeRef = React.useRef(0)
  const rafRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!enabled) {
      setFps(null)
      frameRef.current = 0
      lastTimeRef.current = 0
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    const tick = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time
      }
      frameRef.current += 1
      const elapsed = time - lastTimeRef.current
      if (elapsed >= 1000) {
        const nextFps = Math.round((frameRef.current * 1000) / elapsed)
        frameRef.current = 0
        lastTimeRef.current = time
        setFps(nextFps)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [enabled])

  return fps
}

export const useSimulationRecording = ({
  captureRef,
}: UseSimulationRecordingOptions): RecordingState => {
  const [isRecording, setIsRecording] = React.useState(false)
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0)
  const chunksRef = React.useRef<Blob[]>([])
  const recorderRef = React.useRef<MediaRecorder | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const timerRef = React.useRef<number | null>(null)
  const startedAtRef = React.useRef<number>(0)

  const fps = useFpsMonitor(isRecording)
  const isLowFps = Boolean(fps !== null && fps < FPS_WARNING_THRESHOLD)

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startTimer = () => {
    clearTimer()
    startedAtRef.current = Date.now()
    setElapsedSeconds(0)
    timerRef.current = window.setInterval(() => {
      const nextElapsed = Math.floor((Date.now() - startedAtRef.current) / 1000)
      setElapsedSeconds(nextElapsed)
    }, 1000)
  }

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const finalizeRecording = (blob: Blob, mimeType: string) => {
    const filename = createRecordingFilename()
    const finalBlob = blob.size
      ? blob
      : new Blob(chunksRef.current, {type: mimeType})
    downloadBlob(finalBlob, filename)
  }

  const startRecording = useCallbackRef(() => {
    if (isRecording) {
      return
    }
    const canvas = captureRef.current?.getCanvas() ?? null
    if (!canvas) {
      toast.error('Recording unavailable: 3D view not ready')
      return
    }
    if (typeof MediaRecorder === 'undefined') {
      toast.error('Recording unavailable in this browser')
      return
    }
    if (!MediaRecorder.isTypeSupported(RECORDING_MIME_TYPE)) {
      toast.error('VP9 recording not supported in this browser')
      return
    }

    chunksRef.current = []
    const stream = canvas.captureStream(TARGET_RECORDING_FPS)
    streamRef.current = stream

    try {
      const recorder = new MediaRecorder(stream, {
        mimeType: RECORDING_MIME_TYPE,
        videoBitsPerSecond: RECORDING_BITRATE,
      })

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || RECORDING_MIME_TYPE,
        })
        finalizeRecording(blob, recorder.mimeType || RECORDING_MIME_TYPE)
        chunksRef.current = []
        cleanupStream()
        clearTimer()
        setIsRecording(false)
        recorderRef.current = null
      }

      recorder.onerror = () => {
        toast.error('Recording failed to start')
        cleanupStream()
        clearTimer()
        setIsRecording(false)
        recorderRef.current = null
      }

      recorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      startTimer()
    } catch (error) {
      toast.error('Recording failed to start')
      cleanupStream()
      clearTimer()
      setIsRecording(false)
    }
  })

  const stopRecording = useCallbackRef(() => {
    if (!isRecording) {
      return
    }
    recorderRef.current?.stop()
  })

  React.useEffect(
    () => () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop()
      }
      cleanupStream()
      clearTimer()
    },
    [],
  )

  return {
    isRecording,
    elapsedSeconds,
    formattedTime: formatRecordingTimer(elapsedSeconds),
    fps,
    isLowFps,
    startRecording,
    stopRecording,
  }
}
