import type { GeoPoint } from "@/domain/entities"

const EARTH_RADIUS_KM = 6371

function toRad(value: number) {
  return (value * Math.PI) / 180
}

export function distanceKm(from: GeoPoint, to: GeoPoint) {
  const dLat = toRad(to.lat - from.lat)
  const dLng = toRad(to.lng - from.lng)
  const lat1 = toRad(from.lat)
  const lat2 = toRad(to.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function isWithinRadius(
  origin: GeoPoint,
  target: GeoPoint,
  radiusKm: number,
) {
  return distanceKm(origin, target) <= radiusKm
}
