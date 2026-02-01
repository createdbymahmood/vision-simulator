import type {MapRef} from 'react-map-gl/mapbox'

import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'
import {useDebouncedValue} from '@/features/scene/presentation/hooks/use-debounced-value'
import {useMapboxLocationSearch} from '@/features/scene/presentation/hooks/use-mapbox-location-search'

interface SearchLocationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mapRef: MapRef | null
}

const SEARCH_DEBOUNCE_MS = 300
const SEARCH_RESULT_LIMIT = 10
const DEFAULT_ZOOM = 14

const buildEmptyMessage = (
  query: string,
  isLoading: boolean,
  error: string | null,
) => {
  if (isLoading) {
    return 'Searching locations...'
  }
  if (error) {
    return error
  }
  if (!query.trim()) {
    return 'Type a location to search.'
  }
  return 'No locations found.'
}

export const SearchLocationDialog: React.FC<SearchLocationDialogProps> = ({
  open,
  onOpenChange,
  mapRef,
}) => {
  const mapboxToken = useUiStore((state) => state.mapboxToken)
  const [query, setQuery] = React.useState('')
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS)

  const {results, isLoading, error} = useMapboxLocationSearch({
    query: debouncedQuery,
    accessToken: mapboxToken,
    limit: SEARCH_RESULT_LIMIT,
  })

  const handleSelectLocation = useCallbackRef((result) => {
    const map = mapRef?.getMap?.()
    if (!map) return
    if (result.bbox) {
      map.fitBounds(
        [
          [result.bbox[0], result.bbox[1]],
          [result.bbox[2], result.bbox[3]],
        ],
        {padding: 80, duration: 600},
      )
    } else {
      map.flyTo({center: result.center, zoom: DEFAULT_ZOOM, duration: 600})
    }
    onOpenChange(false)
  })

  const emptyMessage = buildEmptyMessage(debouncedQuery, isLoading, error)

  React.useEffect(() => {
    if (!open) {
      setQuery('')
    }
  }, [open])

  return (
    <CommandDialog onOpenChange={onOpenChange} open={open}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder='Search location...'
      />
      <CommandList>
        <CommandEmpty>{emptyMessage}</CommandEmpty>
        {results.length > 0 ? (
          <CommandGroup heading='Locations'>
            {results.map((result) => (
              <CommandItem
                key={result.id}
                value={result.placeName}
                onSelect={() => handleSelectLocation(result)}
              >
                <div className='flex flex-col'>
                  <span className='text-sm font-medium'>{result.name}</span>
                  {result.context ? (
                    <span className='text-xs text-muted-foreground'>
                      {result.context}
                    </span>
                  ) : null}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  )
}
