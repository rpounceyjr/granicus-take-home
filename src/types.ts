export type ParkImage = {
  src: string
  alt: string
}

export type Park = {
  id: string
  name: string
  address: string | null
  description: string | null
  location: { lat: number; lng: number } | null
  amenities: string[]
  hours: string | null
  images: ParkImage[]
  acreage: number | null
  rating: number | null
}
