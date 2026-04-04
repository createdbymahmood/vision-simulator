import React from 'react'

interface MapboxFeature {
  id: string
  text?: string
  place_name?: string
  center?: [number, number]
  bbox?: [number, number, number, number]
}

interface MapboxGeocodeResponse {
  features?: MapboxFeature[]
}

export interface LocationSearchResult {
  id: string
  name: string
  context: string
  placeName: string
  center: {lng: number; lat: number}
  bbox?: [number, number, number, number]
}

interface UseMapboxLocationSearchParams {
  query: string
  accessToken?: string
  limit?: number
}

interface UseMapboxLocationSearchResult {
  results: LocationSearchResult[]
  isLoading: boolean
  error: string | null
}

const buildLocationLabel = (feature: MapboxFeature) => {
  const placeName = feature.place_name ?? feature.text ?? ''
  const name = feature.text ?? placeName
  const context = placeName.startsWith(`${name}, `)
    ? placeName.slice(name.length + 2)
    : placeName
  return {name, context: context === name ? '' : context, placeName}
}

export const useMapboxLocationSearch = ({
  query,
  accessToken,
  limit = 10,
}: UseMapboxLocationSearchParams): UseMapboxLocationSearchResult => {
  const [results, setResults] = React.useState<LocationSearchResult[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setIsLoading(false)
      setError(null)
      return
    }

    if (!accessToken) {
      setResults([])
      setIsLoading(false)
      setError('Mapbox access token is missing.')
      return
    }

    const controller = new AbortController()
    const fetchLocations = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const url = new URL(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json`,
        )
        url.searchParams.set('access_token', accessToken)
        url.searchParams.set('limit', String(limit))
        url.searchParams.set('autocomplete', 'true')

        const response = await fetch(url.toString(), {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`Mapbox search failed (${response.status})`)
        }

        const payload = (await response.json()) as MapboxGeocodeResponse
        const nextResults = (payload.features ?? [])
          .map((feature) => {
            if (!feature.center || feature.center.length < 2) {
              return null
            }
            const {name, context, placeName} = buildLocationLabel(feature)
            return {
              id: feature.id,
              name,
              context,
              placeName,
              center: {lng: feature.center[0], lat: feature.center[1]},
              bbox: feature.bbox,
            }
          })
          .filter(Boolean) as LocationSearchResult[]

        setResults(nextResults)
      } catch (err) {
        if ((err as {name?: string}).name === 'AbortError') {
          return
        }
        setResults([])
        setError('Unable to fetch locations. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    void fetchLocations()

    return () => {
      controller.abort()
    }
  }, [accessToken, limit, query])

  return {results, isLoading, error}
}
