import React from 'react'

export interface RealRadarActivityItem {
  id: string
  trackerId: string
  cameraId: string
  className: string
  confidence?: number
  lat?: number
  lon?: number
  distance?: number
  timestampLabel: string
  timestampValue?: number
}

interface SimulationRealRadarActivitiesProps {
  activities: RealRadarActivityItem[]
}

const detectionIcons: Record<string, string> = {
  helmet: 'H',
  cigarette: 'C',
  hat: 'HAT',
  facemask: 'M',
  firesmoke: 'F',
  gloves: 'G',
  vest: 'V',
  boots: 'B',
  goggles: 'GOG',
  person: 'P',
  bicycle: 'BIKE',
  motorcycle: 'MOTO',
  car: 'CAR',
  bus: 'BUS',
  truck: 'TRK',
  backpack: 'BAG',
  cellphone: 'PH',
}

const detectionColors: Record<string, string> = {
  helmet: '#f97316',
  cigarette: '#f43f5e',
  hat: '#a855f7',
  facemask: '#06b6d4',
  firesmoke: '#ef4444',
  gloves: '#22c55e',
  vest: '#facc15',
  boots: '#b45309',
  goggles: '#0ea5e9',
  person: '#38bdf8',
  bicycle: '#3b82f6',
  motorcycle: '#0f172a',
  car: '#14b8a6',
  bus: '#a855f7',
  truck: '#6366f1',
  backpack: '#ec4899',
  cellphone: '#64748b',
}

const normalizeClassName = (value?: string) =>
  (value ?? 'unknown').toLowerCase()

export const SimulationRealRadarActivities: React.FC<
  SimulationRealRadarActivitiesProps
> = ({activities}) => {
  if (!activities.length) {
    return (
      <div className='text-xs text-muted-foreground'>No live updates yet.</div>
    )
  }

  return (
    <div className='space-y-2'>
      {activities.map((activity) => {
        const className = normalizeClassName(activity.className)
        const icon = detectionIcons[className] ?? 'D'
        const iconColor = detectionColors[className] ?? '#f97316'

        return (
          <div
            className='flex items-start gap-2 rounded-md border bg-background px-2 py-1.5'
            key={activity.id}
          >
            <div
              className='grid size-6 shrink-0 place-items-center rounded-full text-xs'
              style={{backgroundColor: iconColor, color: '#ffffff'}}
            >
              {icon}
            </div>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-xs font-medium'>{className}</span>
                <span className='text-[11px] text-muted-foreground'>
                  {activity.confidence != null
                    ? `${Math.round(activity.confidence * 100)}%`
                    : '--'}
                </span>
              </div>
              <div className='flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground'>
                <span>Tracker: {activity.trackerId}</span>
                <span>Camera: {activity.cameraId}</span>
                {activity.distance != null ? (
                  <span>{activity.distance.toFixed(1)} m</span>
                ) : null}
              </div>
              {activity.lat != null || activity.lon != null ? (
                <div className='text-[11px] text-muted-foreground'>
                  {activity.lat != null ? activity.lat.toFixed(5) : '--'},{' '}
                  {activity.lon != null ? activity.lon.toFixed(5) : '--'}
                </div>
              ) : null}
              <div className='text-[11px] text-muted-foreground'>
                {activity.timestampLabel}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
