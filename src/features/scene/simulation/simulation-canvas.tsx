import {Canvas} from '@react-three/fiber'
import React from 'react'
import * as THREE from 'three'

import type {SimulationCaptureApi} from './simulation-capture'
import type {SimulationSceneProps} from './simulation-scene'

import {SimulationScene} from './simulation-scene'

export interface SimulationCanvasProps extends SimulationSceneProps {
  onCaptureReady?: (api: SimulationCaptureApi) => void
  className?: string
}

const SimulationCanvasComponent: React.FC<SimulationCanvasProps> = ({
  className,
  onCaptureReady,
  ...props
}) => (
  <Canvas
    camera={{fov: 50, position: [40, 30, 40], near: 0.5, far: 1200}}
    className={className ?? 'vs:h-full vs:w-full'}
    dpr={[1, 1.25]}
    gl={{
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
    }}
    onCreated={({gl}) => {
      gl.outputColorSpace = THREE.SRGBColorSpace
      gl.toneMapping = THREE.NoToneMapping
      gl.shadowMap.enabled = true
      gl.shadowMap.type = THREE.PCFSoftShadowMap
      gl.localClippingEnabled = true
    }}
    shadows
  >
    <SimulationScene {...props} onCaptureReady={onCaptureReady} />
  </Canvas>
)

SimulationCanvasComponent.displayName = 'SimulationCanvas'

export const SimulationCanvas = React.memo(SimulationCanvasComponent)
