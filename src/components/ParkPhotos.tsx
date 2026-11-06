import { useState, type CSSProperties } from 'react'
import type { Park } from '../types'

type ParkPhotosProps = {
  park: Park | null
}

export function ParkPhotos({ park }: ParkPhotosProps) {
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(new Set())

  const images = park ? park.images.filter((image) => !failedSrcs.has(image.src)) : []
  if (!park || images.length === 0) return null

  return (
    <section className="park-photos" style={{ '--photo-count': images.length } as CSSProperties}>
      <ul>
        {images.map((image) => (
          <li key={image.src}>
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              onError={() => setFailedSrcs((prev) => new Set(prev).add(image.src))}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
