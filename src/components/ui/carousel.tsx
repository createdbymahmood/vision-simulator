import type {UseEmblaCarouselType} from 'embla-carousel-react'

import useEmblaCarousel from 'embla-carousel-react'
import {ArrowLeft, ArrowRight} from 'lucide-react'
import * as React from 'react'

import {Button} from '@/components/ui/button'
import {cn} from '@/lib/utils'

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

interface CarouselProps {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: 'horizontal' | 'vertical'
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = CarouselProps & {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error('useCarousel must be used within a <Carousel />')
  }

  return context
}

function Carousel({
  orientation = 'horizontal',
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: CarouselProps & React.ComponentProps<'div'>) {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === 'horizontal' ? 'x' : 'y',
    },
    plugins,
  )
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const onSelect = React.useCallback((carouselApi: CarouselApi) => {
    if (!carouselApi) return
    setCanScrollPrev(carouselApi.canScrollPrev())
    setCanScrollNext(carouselApi.canScrollNext())
  }, [])

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev()
  }, [api])

  const scrollNext = React.useCallback(() => {
    api?.scrollNext()
  }, [api])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        scrollPrev()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        scrollNext()
      }
    },
    [scrollPrev, scrollNext],
  )

  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on('reInit', onSelect)
    api.on('select', onSelect)

    return () => {
      api?.off('select', onSelect)
    }
  }, [api, onSelect])

  const contextValue = React.useMemo(
    () => ({
      carouselRef,
      api,
      opts,
      orientation:
        orientation || (opts?.axis === 'y' ? 'vertical' : 'horizontal'),
      scrollPrev,
      scrollNext,
      canScrollPrev,
      canScrollNext,
    }),
    [
      api,
      carouselRef,
      canScrollNext,
      canScrollPrev,
      opts,
      orientation,
      scrollNext,
      scrollPrev,
    ],
  )

  return (
    <CarouselContext.Provider value={contextValue}>
      <div
        className={cn('vs:relative', className)}
        aria-roledescription='carousel'
        data-slot='carousel'
        onKeyDownCapture={handleKeyDown}
        role='region'
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({className, ...props}: React.ComponentProps<'div'>) {
  const {carouselRef, orientation} = useCarousel()

  return (
    <div
      className='vs:overflow-hidden'
      ref={carouselRef}
      data-slot='carousel-content'
    >
      <div
        className={cn(
          'vs:flex',
          orientation === 'horizontal' ? 'vs:-ml-4' : 'vs:-mt-4 vs:flex-col',
          className,
        )}
        {...props}
      />
    </div>
  )
}

function CarouselItem({className, ...props}: React.ComponentProps<'div'>) {
  const {orientation} = useCarousel()

  return (
    <div
      aria-roledescription='slide'
      data-slot='carousel-item'
      role='group'
      className={cn(
        'vs:min-w-0 vs:shrink-0 vs:grow-0 vs:basis-full',
        orientation === 'horizontal' ? 'vs:pl-4' : 'vs:pt-4',
        className,
      )}
      {...props}
    />
  )
}

function CarouselPrevious({
  className,
  variant = 'outline',
  size = 'icon',
  ...props
}: React.ComponentProps<typeof Button>) {
  const {orientation, scrollPrev, canScrollPrev} = useCarousel()

  return (
    <Button
      size={size}
      disabled={!canScrollPrev}
      variant={variant}
      data-slot='carousel-previous'
      onClick={scrollPrev}
      className={cn(
        'vs:absolute vs:size-8 vs:rounded-full',
        orientation === 'horizontal'
          ? 'vs:top-1/2 vs:-left-12 vs:-translate-y-1/2'
          : 'vs:-top-12 vs:left-1/2 vs:-translate-x-1/2 vs:rotate-90',
        className,
      )}
      {...props}
    >
      <ArrowLeft />
      <span className='vs:sr-only'>Previous slide</span>
    </Button>
  )
}

function CarouselNext({
  className,
  variant = 'outline',
  size = 'icon',
  ...props
}: React.ComponentProps<typeof Button>) {
  const {orientation, scrollNext, canScrollNext} = useCarousel()

  return (
    <Button
      size={size}
      disabled={!canScrollNext}
      variant={variant}
      data-slot='carousel-next'
      onClick={scrollNext}
      className={cn(
        'vs:absolute vs:size-8 vs:rounded-full',
        orientation === 'horizontal'
          ? 'vs:top-1/2 vs:-right-12 vs:-translate-y-1/2'
          : 'vs:-bottom-12 vs:left-1/2 vs:-translate-x-1/2 vs:rotate-90',
        className,
      )}
      {...props}
    >
      <ArrowRight />
      <span className='vs:sr-only'>Next slide</span>
    </Button>
  )
}

export {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
}
