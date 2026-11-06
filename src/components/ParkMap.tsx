import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import type { Park } from '../types'

// Leaflet's default icon derives its image folder from a url() in leaflet.css;
// Vite inlines or hashes that url, so the derived paths are wrong. Import the images directly.
const iconOptions: L.IconOptions = {
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
}
const defaultIcon = L.icon(iconOptions)
const selectedIcon = L.icon({ ...iconOptions, className: 'park-marker-selected' })

type LocatedPark = Park & { location: NonNullable<Park['location']> }

type ParkMapProps = {
  parks: Park[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const BOUNDS_OPTIONS: L.FitBoundsOptions = { padding: [24, 24], maxZoom: 15 }

// Pans to a located park; for a park without coordinates, returns to the all-parks view
// so the map doesn't imply the previous park's location.
function FollowSelection({ park, allBounds }: { park: Park | null; allBounds: L.LatLngBounds }) {
  const map = useMap()
  useEffect(() => {
    if (!park) return
    const animate = !prefersReducedMotion()
    if (park.location) map.panTo([park.location.lat, park.location.lng], { animate })
    else map.fitBounds(allBounds, { ...BOUNDS_OPTIONS, animate })
  }, [map, park, allBounds])
  return null
}

// Leaflet makes the container focusable (arrow keys pan) but leaves it unnamed.
function labelMapContainer(map: L.Map | null) {
  if (!map) return
  const container = map.getContainer()
  container.setAttribute('role', 'group')
  container.setAttribute('aria-label', 'Park map. Arrow keys pan, plus and minus keys zoom.')
}

export function ParkMap({ parks, selectedId, onSelect }: ParkMapProps) {
  const located = useMemo(
    () => parks.filter((park): park is LocatedPark => park.location !== null),
    [parks],
  )
  const allBounds = useMemo(
    () => L.latLngBounds(located.map((p) => [p.location.lat, p.location.lng])),
    [located],
  )
  const selected = parks.find((park) => park.id === selectedId) ?? null
  const animate = !prefersReducedMotion()

  return (
    <section className="park-map" aria-labelledby="park-map-heading">
      <h2 id="park-map-heading">Map</h2>
      {selected && !selected.location && located.length > 0 && (
        <p className="park-map-note">{selected.name} has no map location. Showing all parks.</p>
      )}
      {located.length === 0 ? (
        <p>No parks have a map location.</p>
      ) : (
        <MapContainer
          className="park-map-container"
          bounds={allBounds}
          boundsOptions={BOUNDS_OPTIONS}
          scrollWheelZoom={false}
          zoomAnimation={animate}
          fadeAnimation={animate}
          markerZoomAnimation={animate}
          ref={labelMapContainer}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {located.map((park) => (
            <Marker
              key={park.id}
              position={[park.location.lat, park.location.lng]}
              icon={park.id === selectedId ? selectedIcon : defaultIcon}
              zIndexOffset={park.id === selectedId ? 1000 : 0}
              title={park.name}
              alt={park.name}
              eventHandlers={{
                click: () => onSelect(park.id),
                // Marker icons are <img role="button">, which browsers don't activate from the keyboard.
                keydown: (event) => {
                  const { key } = event.originalEvent
                  if (key !== 'Enter' && key !== ' ') return
                  event.originalEvent.preventDefault()
                  onSelect(park.id)
                },
              }}
            />
          ))}
          <FollowSelection park={selected} allBounds={allBounds} />
        </MapContainer>
      )}
    </section>
  )
}
