import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom does not implement scrolling; Leaflet calls it when focusing markers.
window.scrollTo = () => {}

afterEach(() => {
  cleanup()
})
