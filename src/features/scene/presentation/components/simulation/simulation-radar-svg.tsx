import {motion} from 'framer-motion'
import React from 'react'

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
  <svg height={size.height} width={size.width}>
    <rect height='100%' width='100%' fill='transparent' />
    <defs>
      <filter
        height='200%'
        width='200%'
        id='radar-person-glow'
        x='-50%'
        y='-50%'
      >
        <feGaussianBlur in='SourceGraphic' result='blur' stdDeviation='4' />
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
        x2={line.end.x}
        y1={line.start.y}
        y2={line.end.y}
        stroke='rgba(255,255,255,0.1)'
        strokeWidth={1}
      />
    ))}
    {areaPaths.map((area) => (
      <path
        d={area.path}
        fill='transparent'
        key={area.id}
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
          d={`${path} Z`}
          fill={wedge.camera.color}
          fillOpacity={0.1}
          key={wedge.camera.id}
          stroke={wedge.camera.color}
          strokeOpacity={0.4}
          strokeWidth={1}
        />
      )
    })}
    {trailPaths.map((trail) => (
      <path
        d={trail.path}
        fill='transparent'
        key={`trail-${trail.id}`}
        stroke='rgba(78,205,196,0.35)'
        strokeWidth={1}
      />
    ))}
    {connections.map((line, index) => (
      <motion.line
        animate={{strokeDashoffset: [0, -8]}}
        key={`line-${index}`}
        x1={line.cameraPoint.x}
        x2={line.personPoint.x}
        y1={line.cameraPoint.y}
        y2={line.personPoint.y}
        stroke={line.camera.color}
        strokeDasharray='4 4'
        strokeWidth={1}
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
            fill={camera.color}
            r={radius}
            onClick={() => onSelectCamera(camera.id)}
            onMouseEnter={() => onHoverCamera(camera.id)}
            onMouseLeave={() => onHoverCamera(undefined)}
            opacity={opacity}
          />
          <line
            x1={point.x}
            x2={arrowPoint.x}
            y1={point.y}
            y2={arrowPoint.y}
            opacity={opacity}
            stroke={camera.color}
            strokeWidth={isHovered ? 2.5 : 2}
          />
        </g>
      )
    })}
    {peopleMarkers.map(({id, point}) => (
      <motion.circle
        fill={selectedPersonId === id ? '#F7DC6F' : '#4ECDC4'}
        filter={selectedPersonId === id ? 'url(#radar-person-glow)' : undefined}
        initial={false}
        key={id}
        onClick={() => onSelectPerson(id)}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          bounce: 0.45,
        }}
        animate={{
          cx: point.x,
          cy: point.y,
          r: selectedPersonId === id ? 7 : 5,
        }}
      />
    ))}
    {pingPoint ? (
      <g key={`ping-${pingKey}`}>
        {[0, 0.2, 0.4].map((delay, index) => (
          <motion.circle
            animate={{r: 50, opacity: 0}}
            cx={pingPoint.x}
            cy={pingPoint.y}
            fill='none'
            key={`ping-${index}`}
            r={0}
            stroke='#F7DC6F'
            strokeWidth={2}
            transition={{duration: 1.2, ease: 'easeOut', delay}}
          />
        ))}
      </g>
    ) : null}
  </svg>
)
