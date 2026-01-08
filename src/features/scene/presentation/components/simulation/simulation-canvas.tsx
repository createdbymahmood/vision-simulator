import React from 'react'
import {Canvas} from '@react-three/fiber'
import * as THREE from 'three'

import {SimulationScene, type SimulationSceneProps} from './simulation-scene'

export interface SimulationCanvasProps extends SimulationSceneProps {}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = (props) => (
  <Canvas
    className='h-full w-full'
    shadows
    camera={{fov: 50, position: [40, 30, 40], near: 0.5, far: 1200}}
    gl={{antialias: true, alpha: true, logarithmicDepthBuffer: true}}
    onCreated={({gl}) => {
      gl.outputColorSpace = THREE.SRGBColorSpace
      gl.toneMapping = THREE.NoToneMapping
      gl.shadowMap.enabled = true
      gl.shadowMap.type = THREE.PCFSoftShadowMap
    }}
  >
    <SimulationScene {...props} />
  </Canvas>
)
