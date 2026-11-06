import type { Park, ParkImage } from './types'

export const UNNAMED_PARK = 'Unnamed park'

type RawRecord = Record<string, unknown>

const LOCAL_IMAGE = /^\/images\/[\w-]+\.(jpe?g|png|webp)$/i
// RFC 2606 / 6761 reserved names never resolve to real content.
const RESERVED_HOST = /(^|\.)(example\.(com|net|org)|example|invalid|test|localhost)$/i

const AMENITY_LABELS: Record<string, string> = {
  wifi: 'Wi-Fi',
}

function isRecord(value: unknown): value is RawRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null
  return trimmed
}

function cleanNumber(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return value >= min && value <= max ? value : null
}

function cleanLocation(value: unknown): Park['location'] {
  if (!isRecord(value)) return null
  const lat = cleanNumber(value.lat, -90, 90)
  const lng = cleanNumber(value.lng, -180, 180)
  return lat !== null && lng !== null ? { lat, lng } : null
}

function amenityLabel(slug: string): string {
  const key = slug.toLowerCase()
  if (AMENITY_LABELS[key]) return AMENITY_LABELS[key]
  const words = key.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function cleanAmenities(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const labels = value
    .map(cleanString)
    .filter((slug): slug is string => slug !== null)
    .map(amenityLabel)
  return [...new Set(labels)]
}

function isUsableImageSrc(src: string): boolean {
  if (LOCAL_IMAGE.test(src)) return true
  try {
    const url = new URL(src)
    return (url.protocol === 'https:' || url.protocol === 'http:') && !RESERVED_HOST.test(url.hostname)
  } catch {
    return false
  }
}

function cleanImages(value: unknown, parkName: string): ParkImage[] {
  if (!Array.isArray(value)) return []
  const sources = [
    ...new Set(
      value.map(cleanString).filter((src): src is string => src !== null && isUsableImageSrc(src)),
    ),
  ]
  return sources.map((src, i) => ({
    src,
    alt: `${parkName}, photo ${i + 1} of ${sources.length}`,
  }))
}

function cleanHours(value: unknown): string | null {
  const hours = cleanString(value)
  return hours === null ? null : hours.replace(/\s*-\s*/g, ' – ')
}

/**
 * Returns null for records that cannot be shown: no id (an unstable id could
 * orphan persisted data), or no name, address, or coordinates to find it by.
 */
export function normalizePark(raw: unknown): Park | null {
  if (!isRecord(raw)) return null

  const id = cleanString(raw.id)
  if (id === null) {
    console.warn('[normalizePark] Dropped park with no id', { name: cleanString(raw.name) })
    return null
  }

  const rawLocation = isRecord(raw.location) ? raw.location : {}
  const location = cleanLocation(raw.location)
  const address = cleanString(rawLocation.address)
  const rawName = cleanString(raw.name)
  if (rawName === null && address === null && location === null) return null

  const name = rawName ?? UNNAMED_PARK

  return {
    id,
    name,
    address,
    description: cleanString(raw.description),
    location,
    amenities: cleanAmenities(raw.amenities),
    hours: cleanHours(raw.hours),
    images: cleanImages(raw.images, name),
    acreage: cleanNumber(raw.acreage, 0, Number.MAX_SAFE_INTEGER),
    rating: cleanNumber(raw.rating, 0, 5),
  }
}

/** Normalizes a raw list, dropping unusable records and later duplicate ids. */
export function normalizeParks(raw: unknown): Park[] {
  if (!Array.isArray(raw)) return []
  const keptNames = new Map<string, string>()
  const parks: Park[] = []
  for (const item of raw) {
    const park = normalizePark(item)
    if (park === null) continue
    const keptName = keptNames.get(park.id)
    if (keptName !== undefined) {
      console.warn('[normalizeParks] Dropped park with duplicate id', {
        id: park.id,
        keptName,
        droppedName: park.name,
      })
      continue
    }
    keptNames.set(park.id, park.name)
    parks.push(park)
  }
  return parks
}
