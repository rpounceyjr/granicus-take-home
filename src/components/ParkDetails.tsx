import { useEffect, useRef } from 'react'
import type { Park } from '../types'

type ParkDetailsProps = {
  park: Park | null
  /** Changes identity on every selection; each change moves focus to the heading. */
  selection: object | null
}

export function ParkDetails({ park, selection }: ParkDetailsProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (selection) headingRef.current?.focus()
  }, [selection])

  if (!park) {
    return (
      <section className="park-details" aria-label="Park details">
        <p>Select a park to see its details.</p>
      </section>
    )
  }

  return (
    <section className="park-details" aria-labelledby="park-details-heading">
      <h2 id="park-details-heading" ref={headingRef} tabIndex={-1}>
        {park.name}
      </h2>

      {park.address && <p className="park-details-address">{park.address}</p>}
      {!park.location && <p className="park-details-note">No map location</p>}
      {park.description && <p>{park.description}</p>}

      <div className="park-details-facts">
        {(park.hours || park.acreage !== null || park.rating !== null) && (
          <dl>
            {park.hours && (
              <>
                <dt>Hours</dt>
                <dd>{park.hours}</dd>
              </>
            )}
            {park.acreage !== null && (
              <>
                <dt>Size</dt>
                <dd>
                  {park.acreage} {park.acreage === 1 ? 'acre' : 'acres'}
                </dd>
              </>
            )}
            {park.rating !== null && (
              <>
                <dt>Rating</dt>
                <dd>{park.rating} out of 5</dd>
              </>
            )}
          </dl>
        )}

        {park.amenities.length > 0 && (
          <div>
            <h3>Amenities</h3>
            <ul>
              {park.amenities.map((amenity) => (
                <li key={amenity}>{amenity}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
