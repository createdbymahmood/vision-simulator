import {useFrame} from '@react-three/fiber'
import React from 'react'
import * as THREE from 'three'

import {DEBUG_LAYER} from './simulation-layers'

interface PersonTrailProps {
  selectedPersonId?: string
  positions: Map<string, THREE.Vector3>
}

export const PersonTrail: React.FC<PersonTrailProps> = ({
  selectedPersonId,
  positions,
}) => {
  const lineRef =
    React.useRef<THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial> | null>(
      null,
    )
  const pointsRef = React.useRef<THREE.Vector3[]>([])
  const lastPersonRef = React.useRef<string | undefined>(undefined)
  const lineObject = React.useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const material = new THREE.LineBasicMaterial({
      color: '#FACC15',
      opacity: 0.8,
      transparent: true,
    })
    return new THREE.Line(geometry, material)
  }, [])

  React.useEffect(() => {
    lineObject.layers.set(DEBUG_LAYER)
    return () => {
      lineObject.geometry.dispose()
      lineObject.material.dispose()
    }
  }, [lineObject])

  React.useEffect(() => {
    if (selectedPersonId !== lastPersonRef.current) {
      pointsRef.current = []
      lastPersonRef.current = selectedPersonId
    }
  }, [selectedPersonId])

  useFrame(() => {
    if (!selectedPersonId || !lineRef.current) {
      return
    }
    const position = positions.get(selectedPersonId)
    if (!position) {
      return
    }
    const lastPoint = pointsRef.current.at(-1)
    if (!lastPoint || lastPoint.distanceTo(position) > 0.2) {
      pointsRef.current.push(position.clone())
      if (pointsRef.current.length > 80) {
        pointsRef.current.shift()
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(
        pointsRef.current.map((point) => point.clone().setY(0.05)),
      )
      const line = lineRef.current ?? lineObject
      line.geometry.dispose()
      line.geometry = geometry
    }
  })

  if (!selectedPersonId) {
    return null
  }

  return <primitive object={lineObject} ref={lineRef} />
}
