export const MAX_CAMERA_FEEDS = 6
export const BASE_FEED_RESOLUTION = {width: 1280, height: 720}

const MAX_DEVICE_PIXEL_RATIO = 1.5

export interface FeedRenderConfig {
  renderWidth: number
  renderHeight: number
  displayWidth: number
  displayHeight: number
  fps: number
  scale: number
  label: string
}

export const getFeedQualityScale = (feedCount: number) => {
  if (feedCount <= 2) {
    return 1
  }
  if (feedCount <= 4) {
    return 0.8
  }
  return 0.6
}

export const getFeedFps = (feedCount: number) => {
  if (feedCount <= 2) {
    return 24
  }
  if (feedCount <= MAX_CAMERA_FEEDS) {
    return 18
  }
  return 15
}

export const computeFeedRenderConfig = ({
  feedCount,
  containerWidth,
  containerHeight,
  devicePixelRatio,
}: {
  feedCount: number
  containerWidth: number
  containerHeight: number
  devicePixelRatio: number
}): FeedRenderConfig | null => {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return null
  }

  const scale = getFeedQualityScale(feedCount)
  const fps = getFeedFps(feedCount)
  const sizeScale = Math.min(
    1,
    containerWidth / BASE_FEED_RESOLUTION.width,
    containerHeight / BASE_FEED_RESOLUTION.height,
  )
  const clampedDpr = Math.min(
    Math.max(devicePixelRatio, 1),
    MAX_DEVICE_PIXEL_RATIO,
  )
  const renderScale = scale * sizeScale * clampedDpr
  const renderWidth = Math.max(
    1,
    Math.round(BASE_FEED_RESOLUTION.width * renderScale),
  )
  const renderHeight = Math.max(
    1,
    Math.round(BASE_FEED_RESOLUTION.height * renderScale),
  )
  const displayWidth = Math.max(
    1,
    Math.round(BASE_FEED_RESOLUTION.width * scale * sizeScale),
  )
  const displayHeight = Math.max(
    1,
    Math.round(BASE_FEED_RESOLUTION.height * scale * sizeScale),
  )
  return {
    renderWidth,
    renderHeight,
    displayWidth,
    displayHeight,
    fps,
    scale,
    label: `${displayHeight}p`,
  }
}
