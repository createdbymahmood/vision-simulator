'use client'

/* eslint-disable @eslint-react/no-unstable-context-value, @typescript-eslint/no-use-before-define, @typescript-eslint/no-shadow, complexity */

import * as React from 'react'
import * as RechartsPrimitive from 'recharts'

import {cn} from '@/lib/utils'

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = {light: '', dark: '.dark'} as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | {color?: never; theme: Record<keyof typeof THEMES, string>}
    | {color?: string; theme?: never}
  )
}

interface ChartContextProps {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }

  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >['children']
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{config}}>
      <div
        data-chart={chartId}
        data-slot='chart'
        className={cn(
          "vs:[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground vs:[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 vs:[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border vs:[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border vs:[&_.recharts-radial-bar-background-sector]:fill-muted vs:[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted vs:[&_.recharts-reference-line_[stroke='#ccc']]:stroke-border vs:flex vs:aspect-video vs:justify-center vs:text-xs vs:[&_.recharts-dot[stroke='#fff']]:stroke-transparent vs:[&_.recharts-layer]:outline-hidden vs:[&_.recharts-sector]:outline-hidden vs:[&_.recharts-sector[stroke='#fff']]:stroke-transparent vs:[&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartStyle = ({id, config}: {id: string; config: ChartConfig}) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color,
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join('\n')}
}
`,
          )
          .join('\n'),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: React.ComponentProps<'div'> &
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> & {
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: 'dashed' | 'dot' | 'line'
    nameKey?: string
    labelKey?: string
  }) {
  const {config} = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${labelKey || item?.dataKey || item?.name || 'value'}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value =
      !labelKey && typeof label === 'string'
        ? config[label as keyof typeof config]?.label || label
        : itemConfig?.label

    if (labelFormatter) {
      return (
        <div className={cn('vs:font-medium', labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      )
    }

    if (!value) {
      return null
    }

    return <div className={cn('vs:font-medium', labelClassName)}>{value}</div>
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ])

  if (!active || !payload?.length) {
    return null
  }

  const nestLabel = payload.length === 1 && indicator !== 'dot'

  return (
    <div
      className={cn(
        'vs:border-border/50 vs:bg-background vs:grid vs:min-w-[8rem] vs:items-start vs:gap-1.5 vs:rounded-lg vs:border vs:px-2.5 vs:py-1.5 vs:text-xs vs:shadow-xl',
        className,
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className='vs:grid vs:gap-1.5'>
        {payload
          .filter((item) => item.type !== 'none')
          .map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || 'value'}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  'vs:[&>svg]:text-muted-foreground vs:flex vs:w-full vs:flex-wrap vs:items-stretch vs:gap-2 vs:[&>svg]:h-2.5 vs:[&>svg]:w-2.5',
                  indicator === 'dot' && 'vs:items-center',
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            'vs:shrink-0 vs:rounded-[2px] vs:border-(--color-border) vs:bg-(--color-bg)',
                            {
                              'h-2.5 w-2.5': indicator === 'dot',
                              'w-1': indicator === 'line',
                              'w-0 border-[1.5px] border-dashed bg-transparent':
                                indicator === 'dashed',
                              'my-0.5': nestLabel && indicator === 'dashed',
                            },
                          )}
                          style={
                            {
                              '--color-bg': indicatorColor,
                              '--color-border': indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        'vs:flex vs:flex-1 vs:justify-between vs:leading-none',
                        nestLabel ? 'vs:items-end' : 'vs:items-center',
                      )}
                    >
                      <div className='vs:grid vs:gap-1.5'>
                        {nestLabel ? tooltipLabel : null}
                        <span className='vs:text-muted-foreground'>
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className='vs:text-foreground vs:font-mono vs:font-medium vs:tabular-nums'>
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

const ChartLegend = RechartsPrimitive.Legend

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = 'bottom',
  nameKey,
}: Pick<RechartsPrimitive.LegendProps, 'payload' | 'verticalAlign'> &
  React.ComponentProps<'div'> & {
    hideIcon?: boolean
    nameKey?: string
  }) {
  const {config} = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        'vs:flex vs:items-center vs:justify-center vs:gap-4',
        verticalAlign === 'top' ? 'vs:pb-3' : 'vs:pt-3',
        className,
      )}
    >
      {payload
        .filter((item) => item.type !== 'none')
        .map((item) => {
          const key = `${nameKey || item.dataKey || 'value'}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                'vs:[&>svg]:text-muted-foreground vs:flex vs:items-center vs:gap-1.5 vs:[&>svg]:h-3 vs:[&>svg]:w-3',
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className='vs:h-2 vs:w-2 vs:shrink-0 vs:rounded-[2px]'
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
    </div>
  )
}

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string,
) {
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const payloadPayload =
    'payload' in payload &&
    typeof payload.payload === 'object' &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === 'string'
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === 'string'
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
}
