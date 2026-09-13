import { describe, expect, it } from 'vitest'

import { renderWithProviders, screen } from '../test/render'
import App from './App'

describe('App', () => {
  it('renders the foundation experience and its primary navigation', () => {
    renderWithProviders(<App />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Zahlen verstehen\.\s*Sicherer entscheiden\./i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'ImmoPilot DE Startseite' })).toHaveAttribute(
      'href',
      '#top',
    )
    expect(screen.getByText('250.000 €')).toBeVisible()
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })
})
