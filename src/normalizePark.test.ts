import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import rawParks from './assets/parks.sample.json'
import { normalizePark, normalizeParks, UNNAMED_PARK } from './normalizePark'

let warn: MockInstance<typeof console.warn>

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warn.mockRestore()
})

describe('normalizePark', () => {
  it('cleans a messy record without inventing data', () => {
    const park = normalizePark({
      id: ' messy ',
      name: '  Messy Park ',
      description: null,
      location: { lat: 0, lng: -73.9 },
      amenities: ['dog-run', 'wifi', '', 'dog-run', 42],
      hours: '6:00 AM - 1:00 AM',
      images: [
        '/images/park-1.jpg',
        'https://images.example.com/x.jpg',
        'not a url',
        '',
        '/images/park-1.jpg',
        'https://upload.wikimedia.org/park.jpg',
      ],
      acreage: 'big',
      rating: 4.5,
    })

    expect(park).toEqual({
      id: 'messy',
      name: 'Messy Park',
      address: null,
      description: null,
      location: { lat: 0, lng: -73.9 },
      amenities: ['Dog run', 'Wi-Fi'],
      hours: '6:00 AM – 1:00 AM',
      images: [
        { src: '/images/park-1.jpg', alt: 'Messy Park, photo 1 of 2' },
        { src: 'https://upload.wikimedia.org/park.jpg', alt: 'Messy Park, photo 2 of 2' },
      ],
      acreage: null,
      rating: 4.5,
    })
  })

  it('drops a park with every field missing', () => {
    expect(normalizePark({})).toBeNull()
    expect(normalizePark(null)).toBeNull()
    expect(normalizePark(undefined)).toBeNull()
  })

  it('drops a park with no id even when everything else is present', () => {
    expect(
      normalizePark({ name: 'No Id Park', location: { lat: 40.7, lng: -74, address: '1 Main St' } }),
    ).toBeNull()
    expect(warn).toHaveBeenCalledWith('[normalizePark] Dropped park with no id', {
      name: 'No Id Park',
    })
  })

  it('keeps an unnamed park that has coordinates, with every other field empty', () => {
    expect(normalizePark({ id: 'mystery', location: { lat: 40.7, lng: -74 } })).toEqual({
      id: 'mystery',
      name: UNNAMED_PARK,
      address: null,
      description: null,
      location: { lat: 40.7, lng: -74 },
      amenities: [],
      hours: null,
      images: [],
      acreage: null,
      rating: null,
    })
  })

  it('keeps an unnamed park that has only an address, with no map location', () => {
    const park = normalizePark({ id: 'addr-only', location: { address: 'Ridge Rd' } })
    expect(park?.name).toBe(UNNAMED_PARK)
    expect(park?.address).toBe('Ridge Rd')
    expect(park?.location).toBeNull()
  })

  it('treats out-of-range or partial coordinates as no location', () => {
    expect(normalizePark({ id: 'a', name: 'A', location: { lat: 91, lng: 0 } })?.location).toBeNull()
    expect(normalizePark({ id: 'b', name: 'B', location: { lat: 40 } })?.location).toBeNull()
  })
})

describe('normalizeParks', () => {
  it('drops id-less parks and later duplicate ids before anything renders', () => {
    const location = { lat: 40.7, lng: -74 }
    const parks = normalizeParks([
      { name: 'No Id One', location },
      { id: '', name: 'Blank Id', location },
      { id: 'a', name: 'First A', location },
      { name: 'No Id Two', location },
      { id: 'a', name: 'Second A', location },
      { id: 'b', name: 'B', location },
    ])
    expect(parks.map((p) => [p.id, p.name])).toEqual([
      ['a', 'First A'],
      ['b', 'B'],
    ])
    expect(warn).toHaveBeenCalledWith('[normalizePark] Dropped park with no id', {
      name: 'No Id One',
    })
    expect(warn).toHaveBeenCalledWith('[normalizePark] Dropped park with no id', {
      name: 'Blank Id',
    })
    expect(warn).toHaveBeenCalledWith('[normalizePark] Dropped park with no id', {
      name: 'No Id Two',
    })
    expect(warn).toHaveBeenCalledWith('[normalizeParks] Dropped park with duplicate id', {
      id: 'a',
      keptName: 'First A',
      droppedName: 'Second A',
    })
    expect(warn).toHaveBeenCalledTimes(4)
  })
})

describe('normalizeParks on the sample data', () => {
  const parks = normalizeParks(rawParks)

  it('keeps all 12 sample parks without warnings', () => {
    expect(normalizeParks(rawParks)).toHaveLength(12)
    expect(warn).not.toHaveBeenCalled()
  })

  it('drops example.com images and keeps local ones', () => {
    const byId = Object.fromEntries(parks.map((p) => [p.id, p]))
    expect(byId['prospect-park'].images.map((i) => i.src)).toEqual(['/images/park-8.jpg'])
    expect(byId['sunset-playground'].images).toEqual([])
    expect(byId['highland-dog-park'].address).toBeNull()
    expect(byId['old-mill-botanical-garden'].description).toBeNull()
  })

  it('never produces the strings "undefined" or "null"', () => {
    expect(JSON.stringify(parks)).not.toMatch(/"(undefined|null)"/)
  })
})
