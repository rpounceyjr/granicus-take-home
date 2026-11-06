import type { Park } from '../types'

type ParkListProps = {
  parks: Park[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ParkList({ parks, selectedId, onSelect }: ParkListProps) {
  return (
    <section className="park-list" aria-labelledby="park-list-heading">
      <h2 id="park-list-heading">Parks ({parks.length})</h2>
      <ul>
        {parks.map((park) => (
          <li key={park.id}>
            <button
              type="button"
              aria-pressed={park.id === selectedId}
              onClick={() => onSelect(park.id)}
            >
              <span className="park-list-name">{park.name}</span>
              {park.address && <span className="park-list-meta">{park.address}</span>}
              {!park.location && <span className="park-list-meta">No map location</span>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
