import React from 'react'
import {motion} from 'framer-motion'

import type {CameraEntity} from '@/features/scene/domain/types'

export interface RadarPoint {
  x: number
  y: number
}

export interface RadarGridLine {
  start: RadarPoint
  end: RadarPoint
}

export interface RadarAreaPath {
  id: string
  path: string
}

export interface RadarWedge {
  camera: CameraEntity
  origin: RadarPoint
  points: RadarPoint[]
}

export interface RadarTrailPath {
  id: string
  path: string
}

export interface RadarConnectionLine {
  camera: CameraEntity
  cameraPoint: RadarPoint
  personPoint: RadarPoint
}

export interface RadarCameraMarker {
  camera: CameraEntity
  point: RadarPoint
  arrowPoint: RadarPoint
}

export interface RadarPersonMarker {
  id: string
  point: RadarPoint
}

interface SimulationRadarSvgProps {
  size: {width: number; height: number}
  gridLines: RadarGridLine[]
  areaPaths: RadarAreaPath[]
  wedges: RadarWedge[]
  trailPaths: RadarTrailPath[]
  connections: RadarConnectionLine[]
  cameraMarkers: RadarCameraMarker[]
  peopleMarkers: RadarPersonMarker[]
  hoveredCameraId?: string
  selectedPersonId?: string
  pingPoint?: RadarPoint | null
  pingKey: number
  onSelectCamera: (cameraId: string) => void
  onSelectPerson: (personId: string) => void
  onHoverCamera: (cameraId?: string) => void
}

export const SimulationRadarSvg: React.FC<SimulationRadarSvgProps> = ({
  size,
  gridLines,
  areaPaths,
  wedges,
  trailPaths,
  connections,
  cameraMarkers,
  peopleMarkers,
  hoveredCameraId,
  selectedPersonId,
  pingPoint,
  pingKey,
  onSelectCamera,
  onSelectPerson,
  onHoverCamera,
}) => (
  <svg width={size.width} height={size.height}>
    <rect width='100%' height='100%' fill='transparent' />
    <defs>
      <filter
        id='radar-person-glow'
        x='-50%'
        y='-50%'
        width='200%'
        height='200%'
      >
        <feGaussianBlur in='SourceGraphic' stdDeviation='4' result='blur' />
        <feMerge>
          <feMergeNode in='blur' />
          <feMergeNode in='SourceGraphic' />
        </feMerge>
      </filter>
    </defs>
    {gridLines.map((line, index) => (
      <line
        key={`grid-${index}`}
        x1={line.start.x}
        y1={line.start.y}
        x2={line.end.x}
        y2={line.end.y}
        stroke='rgba(255,255,255,0.1)'
        strokeWidth={1}
      />
    ))}
    {areaPaths.map((area) => (
      <path
        key={area.id}
        d={area.path}
        fill='transparent'
        stroke='rgba(255,255,255,0.2)'
        strokeWidth={1}
      />
    ))}
    {wedges.map((wedge) => {
      const path = wedge.points
        .map((point, index) =>
          index === 0
            ? `M ${wedge.origin.x} ${wedge.origin.y} L ${point.x} ${point.y}`
            : `L ${point.x} ${point.y}`,
        )
        .join(' ')
      return (
        <path
          key={wedge.camera.id}
          d={`${path} Z`}
          fill={wedge.camera.color}
          fillOpacity={0.1}
          stroke={wedge.camera.color}
          strokeOpacity={0.4}
          strokeWidth={1}
        />
      )
    })}
    {trailPaths.map((trail) => (
      <path
        key={`trail-${trail.id}`}
        d={trail.path}
        fill='transparent'
        stroke='rgba(78,205,196,0.35)'
        strokeWidth={1}
      />
    ))}
    {connections.map((line, index) => (
      <motion.line
        key={`line-${index}`}
        x1={line.cameraPoint.x}
        y1={line.cameraPoint.y}
        x2={line.personPoint.x}
        y2={line.personPoint.y}
        stroke={line.camera.color}
        strokeWidth={1}
        strokeDasharray='4 4'
        animate={{strokeDashoffset: [0, -8]}}
        transition={{duration: 0.2, ease: 'linear', repeat: Infinity}}
      />
    ))}
    {cameraMarkers.map(({camera, point, arrowPoint}) => {
      const isHovered = hoveredCameraId === camera.id
      const radius = isHovered ? 7 : 6
      const opacity = isHovered ? 0.95 : 0.6
      return (
        <g key={camera.id}>
          <title>{camera.name}</title>
          <circle
            cx={point.x}
            cy={point.y}
            r={radius}
            fill={camera.color}
            opacity={opacity}
            onMouseEnter={() => onHoverCamera(camera.id)}
            onMouseLeave={() => onHoverCamera(undefined)}
            onClick={() => onSelectCamera(camera.id)}
          />
          <line
            x1={point.x}
            y1={point.y}
            x2={arrowPoint.x}
            y2={arrowPoint.y}
            stroke={camera.color}
            strokeWidth={isHovered ? 2.5 : 2}
            opacity={opacity}
          />
        </g>
      )
    })}
    {peopleMarkers.map(({id, point}) => (
      <motion.circle
        key={id}
        animate={{
          cx: point.x,
          cy: point.y,
          r: selectedPersonId === id ? 7 : 5,
        }}
        initial={false}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          bounce: 0.45,
        }}
        fill={selectedPersonId === id ? '#F7DC6F' : '#4ECDC4'}
        filter={selectedPersonId === id ? 'url(#radar-person-glow)' : undefined}
        onClick={() => onSelectPerson(id)}
      />
    ))}
    {pingPoint ? (
      <g key={`ping-${pingKey}`}>
        {[0, 0.2, 0.4].map((delay, index) => (
          <motion.circle
            key={`ping-${index}`}
            cx={pingPoint.x}
            cy={pingPoint.y}
            r={0}
            fill='none'
            stroke='#F7DC6F'
            strokeWidth={2}
            animate={{r: 50, opacity: 0}}
            transition={{duration: 1.2, ease: 'easeOut', delay}}
          />
        ))}
      </g>
    ) : null}
  </svg>
)
