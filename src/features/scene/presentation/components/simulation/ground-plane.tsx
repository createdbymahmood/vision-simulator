import React from 'react'
import * as THREE from 'three'

interface GroundPlaneProps {
  showMapTexture: boolean
  mapTexture: THREE.Texture | null
  gridTexture: THREE.Texture | null
  mapPlaneSize: {width: number; height: number}
  gridPlaneSize: {width: number; height: number}
  isStaticMap: boolean
}

export const GroundPlane: React.FC<GroundPlaneProps> = ({
  showMapTexture,
  mapTexture,
  gridTexture,
  mapPlaneSize,
  gridPlaneSize,
  isStaticMap,
}) => {
  const mapOffset = -0.004
  const gridOffset = -0.002
  const [mapOpacity, setMapOpacity] = React.useState(showMapTexture ? 1 : 0)
  const [gridOpacity, setGridOpacity] = React.useState(showMapTexture ? 0 : 1)

  React.useEffect(() => {
    const start = performance.now()
    const duration = 400
    const initialMap = mapOpacity
    const initialGrid = gridOpacity
    const targetMap = showMapTexture ? 1 : 0
    const targetGrid = showMapTexture ? 0 : 1

    const step = () => {
      const elapsed = performance.now() - start
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - (1 - t) ** 3
      setMapOpacity(initialMap + (targetMap - initialMap) * eased)
      setGridOpacity(initialGrid + (targetGrid - initialGrid) * eased)
      if (t < 1) {
        requestAnimationFrame(step)
      }
    }
    step()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMapTexture])

  React.useEffect(() => {
    if (mapTexture) {
      if (isStaticMap) {
        mapTexture.wrapS = THREE.ClampToEdgeWrapping
        mapTexture.wrapT = THREE.ClampToEdgeWrapping
        mapTexture.repeat.set(1, 1)
        mapTexture.offset.set(0, 0)
        mapTexture.flipY = true
      } else {
        mapTexture.wrapS = THREE.RepeatWrapping
        mapTexture.wrapT = THREE.RepeatWrapping
        mapTexture.repeat.set(mapPlaneSize.width / 16, mapPlaneSize.height / 16)
        mapTexture.offset.set(0, 0)
        mapTexture.flipY = true
      }
      mapTexture.needsUpdate = true
    }
    if (gridTexture) {
      gridTexture.repeat.set(gridPlaneSize.width / 4, gridPlaneSize.height / 4)
      gridTexture.offset.set(0, 0)
    }
  }, [
    gridPlaneSize.height,
    gridPlaneSize.width,
    gridTexture,
    isStaticMap,
    mapPlaneSize.height,
    mapPlaneSize.width,
    mapTexture,
  ])

  return (
    <>
      <mesh position={[0, mapOffset, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[mapPlaneSize.width, mapPlaneSize.height]} />
        <meshBasicMaterial
          transparent
          map={mapTexture ?? undefined}
          color={mapTexture ? undefined : '#E5E7EB'}
          opacity={mapOpacity}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <mesh position={[0, gridOffset, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[gridPlaneSize.width, gridPlaneSize.height]} />
        <meshBasicMaterial
          transparent
          map={gridTexture ?? undefined}
          color={gridTexture ? undefined : '#F8FAFC'}
          opacity={gridOpacity}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
    </>
  )
}
