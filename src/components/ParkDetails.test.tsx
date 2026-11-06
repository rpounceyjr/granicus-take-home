import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { normalizePark } from '../normalizePark'
import { ParkDetails } from './ParkDetails'

describe('missing data', () => {
  it('never renders "undefined" or "null" for any sample park', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    const list = screen.getByRole('region', { name: /Parks/ })

    for (const button of within(list).getAllByRole('button')) {
      await user.click(button)
      expect(container.textContent).not.toMatch(/\b(undefined|null|NaN)\b/)
      for (const img of container.querySelectorAll('img')) {
        expect(img.getAttribute('alt') ?? '').not.toMatch(/\b(undefined|null)\b/)
      }
    }
  })

  it('shows only the name, address, and location note for a sparse park', () => {
    const park = normalizePark({ id: 'sparse', location: { address: 'Ridge Rd' } })
    render(<ParkDetails park={park} selection={{}} />)

    const details = screen.getByRole('region', { name: 'Unnamed park' })
    expect(within(details).getByText('Ridge Rd')).toBeInTheDocument()
    expect(within(details).getByText('No map location')).toBeInTheDocument()
    expect(within(details).queryByRole('heading', { level: 3 })).toBeNull()
    expect(within(details).queryByRole('img')).toBeNull()
    expect(details.querySelector('dl')).toBeNull()
  })
})
