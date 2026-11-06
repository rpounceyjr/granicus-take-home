import { useState } from 'react'
import rawParks from './assets/parks.sample.json'
import { ParkDetails } from './components/ParkDetails'
import { ParkList } from './components/ParkList'
import { ParkMap } from './components/ParkMap'
import { ParkPhotos } from './components/ParkPhotos'
import { normalizeParks } from './normalizePark'
import type { Park } from './types'

const sampleParks = normalizeParks(rawParks)

// A new object per selection, so re-selecting the same park still moves focus.
type Selection = { id: string }

function App({ parks = sampleParks }: { parks?: Park[] }) {
  const [selection, setSelection] = useState<Selection | null>(null)
  const selectedPark = parks.find((park) => park.id === selection?.id) ?? null
  const selectedId = selectedPark?.id ?? null
  const select = (id: string) => setSelection({ id })

  return (
    <main>
      <h1>Find a Park</h1>
      <div className="layout">
        <ParkList parks={parks} selectedId={selectedId} onSelect={select} />
        <div className="layout-main">
          <ParkMap parks={parks} selectedId={selectedId} onSelect={select} />
          <ParkDetails park={selectedPark} selection={selection} />
        </div>
        <ParkPhotos park={selectedPark} />
      </div>
    </main>
  )
}

export default App
