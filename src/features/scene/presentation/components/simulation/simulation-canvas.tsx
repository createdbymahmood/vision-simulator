import {Canvas} from '@react-three/fiber'
import React from 'react'
import * as THREE from 'three'

import type {SimulationCaptureApi} from './simulation-capture'
import type {SimulationSceneProps} from './simulation-scene'

import {SimulationScene} from './simulation-scene'

export interface SimulationCanvasProps extends SimulationSceneProps {
  onCaptureReady?: (api: SimulationCaptureApi) => void
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  onCaptureReady,
  ...props
}) => (
  <Canvas
    camera={{fov: 50, position: [40, 30, 40], near: 0.5, far: 1200}}
    className='h-full w-full'
    gl={{antialias: true, alpha: true, logarithmicDepthBuffer: true}}
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
