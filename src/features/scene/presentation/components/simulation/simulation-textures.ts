import * as THREE from 'three'

export const createGridTexture = () => {
  const size = 512
  const step = 32
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return null
  }
  ctx.fillStyle = '#F8FAFC'
  ctx.fillRect(0, 0, size, size)

  const gridLineColor = 'rgba(148, 163, 184, 0.3)'
  ctx.strokeStyle = gridLineColor
  ctx.lineWidth = 1
  for (let i = 0; i < size; i += step) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, size)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(size, i)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  return texture
}

export const createMapTexture = () => {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return null
  }
  const gradient = ctx.createLinearGradient(0, 0, size, 0)
  gradient.addColorStop(0, '#E0F2FE')
  gradient.addColorStop(1, '#F8FAFC')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)'
  ctx.lineWidth = 2
  for (let i = 0; i <= size; i += 96) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, size)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(size, i)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(32, size * 0.2)
  ctx.bezierCurveTo(
    size * 0.25,
    size * 0.25,
    size * 0.6,
    size * 0.35,
    size,
    size * 0.3,
  )
  ctx.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  return texture
}
