import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { normalizeParks } from './normalizePark'

describe('App', () => {
  it('shows details and moves focus to the heading when a park is selected from the list', async () => {
    const user = userEvent.setup()
    render(<App />)

    const list = screen.getByRole('region', { name: /Parks/ })
    const button = within(list).getByRole('button', { name: /Prospect Park/ })
    await user.click(button)

    const heading = screen.getByRole('heading', { level: 2, name: 'Prospect Park' })
    expect(heading).toHaveFocus()
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('img', { name: 'Prospect Park, photo 1 of 1' })).toBeInTheDocument()

    await user.click(button)
    expect(heading).toHaveFocus()
  })

  it('selects a park from its named map marker', async () => {
    const user = userEvent.setup()
    render(<App />)

    const map = screen.getByRole('region', { name: 'Map' })
    await user.click(within(map).getByRole('button', { name: 'Lakeshore Point' }))

    expect(screen.getByRole('heading', { level: 2, name: 'Lakeshore Point' })).toHaveFocus()
  })

  it('notes on the map when the selected park has no coordinates and clears the marker highlight', async () => {
    const user = userEvent.setup()
    const parks = normalizeParks([
      { id: 'here', name: 'Here Park', location: { lat: 40.7, lng: -74 } },
      { id: 'there', name: 'There Park', location: { lat: 40.8, lng: -73.9 } },
      { id: 'nowhere', name: 'Nowhere Park', location: { address: '1 Main St' } },
    ])
    render(<App parks={parks} />)
    const list = screen.getByRole('region', { name: /Parks/ })
    const map = screen.getByRole('region', { name: 'Map' })

    await user.click(within(list).getByRole('button', { name: /Here Park/ }))
    expect(within(map).getByRole('button', { name: 'Here Park' })).toHaveClass('park-marker-selected')

    await user.click(within(list).getByRole('button', { name: /Nowhere Park/ }))
    expect(within(map).getByText('Nowhere Park has no map location. Showing all parks.')).toBeInTheDocument()
    expect(map.querySelector('.park-marker-selected')).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'Nowhere Park' })).toHaveFocus()
  })

  it('selects a park from its map marker with Enter or Space', async () => {
    const user = userEvent.setup()
    render(<App />)
    const map = screen.getByRole('region', { name: 'Map' })

    within(map).getByRole('button', { name: 'Hillcrest Skate Park' }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { level: 2, name: 'Hillcrest Skate Park' })).toHaveFocus()

    within(map).getByRole('button', { name: 'East Ridge Trailhead' }).focus()
    await user.keyboard(' ')
    expect(screen.getByRole('heading', { level: 2, name: 'East Ridge Trailhead' })).toHaveFocus()
  })
})
