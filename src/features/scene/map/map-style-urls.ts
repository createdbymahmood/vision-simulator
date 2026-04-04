import type {SceneMapStyle} from '@/features/scene/types/types'

export const MAP_STYLE_URLS: Record<SceneMapStyle, string> = {
  street: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  traffic: 'mapbox://styles/mapbox/traffic-day-v2',
  osm: 'mapbox://styles/mapbox/outdoors-v12',
}
