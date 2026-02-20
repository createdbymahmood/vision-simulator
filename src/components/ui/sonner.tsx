import type {ToasterProps} from 'sonner'

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import {useTheme} from 'next-themes'
import {Toaster as Sonner} from 'sonner'

const Toaster = ({...props}: ToasterProps) => {
  const {theme = 'system'} = useTheme()

  return (
    <Sonner
      className='toaster vs:group'
      theme={theme as ToasterProps['theme']}
      icons={{
        success: <CircleCheckIcon className='vs:size-4' />,
        info: <InfoIcon className='vs:size-4' />,
        warning: <TriangleAlertIcon className='vs:size-4' />,
        error: <OctagonXIcon className='vs:size-4' />,
        loading: <Loader2Icon className='vs:size-4 vs:animate-spin' />,
      }}
      style={
        {
          '--normal-bg': 'var(--vs-popover)',
          '--normal-text': 'var(--vs-popover-foreground)',
          '--normal-border': 'var(--vs-border)',
          '--border-radius': 'var(--vs-radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export {Toaster}
