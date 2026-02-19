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
      <div className='vs:text-xs vs:text-muted-foreground'>
        No live updates yet.
      </div>
    )
  }

  return (
    <div className='vs:space-y-2'>
      {activities.map((activity) => {
        const className = normalizeClassName(activity.className)
        const icon = detectionIcons[className] ?? 'D'
        const iconColor = detectionColors[className] ?? '#f97316'

        return (
          <div
            className='vs:flex vs:items-start vs:gap-2 vs:rounded-md vs:border vs:bg-background vs:px-2 vs:py-1.5'
            key={activity.id}
          >
            <div
              className='vs:grid vs:size-6 vs:shrink-0 vs:place-items-center vs:rounded-full vs:text-xs'
              style={{backgroundColor: iconColor, color: '#ffffff'}}
            >
              {icon}
            </div>
            <div className='vs:min-w-0 vs:flex-1'>
              <div className='vs:flex vs:items-center vs:justify-between vs:gap-2'>
                <span className='vs:text-xs vs:font-medium'>{className}</span>
                <span className='vs:text-[11px] vs:text-muted-foreground'>
                  {activity.confidence != null
                    ? `${Math.round(activity.confidence * 100)}%`
                    : '--'}
                </span>
              </div>
              <div className='vs:flex vs:flex-wrap vs:items-center vs:gap-x-2 vs:text-[11px] vs:text-muted-foreground'>
                <span>Tracker: {activity.trackerId}</span>
                <span>Camera: {activity.cameraId}</span>
                {activity.distance != null ? (
                  <span>{activity.distance.toFixed(1)} m</span>
                ) : null}
              </div>
              {activity.lat != null || activity.lon != null ? (
                <div className='vs:text-[11px] vs:text-muted-foreground'>
                  {activity.lat != null ? activity.lat.toFixed(5) : '--'},{' '}
                  {activity.lon != null ? activity.lon.toFixed(5) : '--'}
                </div>
              ) : null}
              <div className='vs:text-[11px] vs:text-muted-foreground'>
                {activity.timestampLabel}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
