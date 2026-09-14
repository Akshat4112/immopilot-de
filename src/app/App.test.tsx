import { beforeEach, describe, expect, it } from 'vitest'
import { BrowserRouter } from 'react-router-dom'

import i18n from '../i18n/config'
import { renderWithProviders, screen, userEvent } from '../test/render'
import App from './App'

describe('App', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('de')
  })

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

  it('switches the complete interface between German and English', async () => {
    const user = userEvent.setup()
    renderWithProviders(<App />)

    expect(document.documentElement).toHaveAttribute('lang', 'de')

    await user.click(screen.getByRole('button', { name: 'English' }))

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Understand the numbers\.\s*Decide with confidence\./i,
      }),
    ).toBeVisible()
    expect(screen.getByText('€250,000')).toBeVisible()
    expect(screen.getByRole('group', { name: 'Choose language' })).toBeVisible()
    expect(document.documentElement).toHaveAttribute('lang', 'en')
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
