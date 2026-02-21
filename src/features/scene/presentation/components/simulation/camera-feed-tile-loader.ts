let cameraFeedTileModulePromise: Promise<
  typeof import('./camera-feed-tile')
> | null = null

export const loadCameraFeedTileModule = () => {
  if (!cameraFeedTileModulePromise) {
    cameraFeedTileModulePromise = import('./camera-feed-tile')
  }

  return cameraFeedTileModulePromise
}
