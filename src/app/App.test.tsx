import { describe, expect, it } from 'vitest'
import { BrowserRouter } from 'react-router-dom'

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

  it('renders below the GitHub Pages router basename', () => {
    window.history.replaceState({}, '', '/immopilot-de/')

    renderWithProviders(
      <BrowserRouter basename="/immopilot-de/">
        <App />
      </BrowserRouter>,
    )

    expect(screen.getByRole('heading', { level: 1 })).toBeVisible()

    window.history.replaceState({}, '', '/')
  })
})
