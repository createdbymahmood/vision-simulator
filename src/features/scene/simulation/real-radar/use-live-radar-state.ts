import {useUiStore} from '@/features/scene/state/ui.store'

export const useLiveRadarState = () =>
  useUiStore((state) => state.liveRadarState)

export const useLiveRadarCameraStates = () =>
  useUiStore((state) => state.liveRadarState.cameraStatesById)

export const useLiveRadarDetections = () =>
  useUiStore((state) => state.liveRadarState.detectionsById)

export const useLiveRadarUpdatesByTracker = () =>
  useUiStore((state) => state.liveRadarState.updatesByTracker)
