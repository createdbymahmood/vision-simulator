import type {GeoOrigin, Point2D} from '@/features/scene/domain/types'

const EARTH_RADIUS_METERS = 6371000

const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180

export const latLngToMeters = (
  origin: GeoOrigin,
  target: {lat: number; lng: number},
): Point2D => {
  const latDistance = degreesToRadians(target.lat - origin.lat)
  const lngDistance = degreesToRadians(target.lng - origin.lng)

  const y = latDistance * EARTH_RADIUS_METERS
  const x =
    lngDistance *
    EARTH_RADIUS_METERS *
    Math.cos(degreesToRadians((origin.lat + target.lat) / 2))

  return {x, y}
}

export const metersToLatLng = (origin: GeoOrigin, offset: Point2D) => {
  const lat = origin.lat + (offset.y / EARTH_RADIUS_METERS) * (180 / Math.PI)
  const lng =
    origin.lng +
    (offset.x /
      (EARTH_RADIUS_METERS * Math.cos(degreesToRadians(origin.lat)))) *
      (180 / Math.PI)

  return {lat, lng}
}
