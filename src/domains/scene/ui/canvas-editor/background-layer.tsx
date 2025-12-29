import React, {useEffect, useMemo, useState} from 'react'
import {Image, Layer} from 'react-konva'

import type {SceneBackground} from '../../core/scene-types'

import {GRID_SIZE} from './constants'

interface BackgroundLayerProps {
  background?: SceneBackground
}

const useBackgroundImage = (source?: string) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!source) {
      setImage(null)
      return
    }
    let cancelled = false
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (!cancelled) {
        setImage(img)
      }
    }
    img.src = source
    return () => {
      cancelled = true
    }
  }, [source])

  return image
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  background,
}) => {
  const image = useBackgroundImage(
    background?.type === 'image' ? background.value : undefined,
  )

  const config = useMemo(() => {
    if (!background || background.type !== 'image') {
      return null
    }
    return {
      opacity: background.opacity ?? 1,
      scale: background.scale ?? 1,
      rotation: background.rotation ?? 0,
      position: background.position ?? {x: 0, y: 0},
    }
  }, [background])

  if (!image || !config) {
    return null
  }

  const width = image.width * config.scale * GRID_SIZE
  const height = image.height * config.scale * GRID_SIZE

  return (
    <Layer listening={false}>
      <Image
        height={height}
        width={width}
        image={image}
        x={config.position.x * GRID_SIZE}
        y={config.position.y * GRID_SIZE}
        opacity={config.opacity}
        rotation={config.rotation}
      />
    </Layer>
  )
}

BackgroundLayer.displayName = 'background-layer'
