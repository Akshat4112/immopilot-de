import { waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import i18n from '../i18n/config'
import { renderWithProviders, screen, userEvent } from '../test/render'
import App from './App'

function renderApp(route = '/') {
  return renderWithProviders(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('de')
  })

  it('renders the responsive shell, overview and approved disclaimer', () => {
    renderApp()

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Zahlen verstehen\.\s*Sicherer entscheiden\./i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'ImmoPilot DE Startseite' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.getByRole('link', { name: 'Zum Inhalt springen' })).toHaveAttribute(
      'href',
      '#main-content',
    )
    expect(screen.getByRole('navigation', { name: 'Hauptnavigation' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Überblick' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('250.000 €')).toBeVisible()
    expect(screen.getByText(/kein Darlehensangebot oder Finanzierungszusage/i)).toBeVisible()
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })

  it('switches the complete interface between German and English', async () => {
    const user = userEvent.setup()
    renderApp()

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
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toBeVisible()
    expect(screen.getByText(/not a financing offer or approval/i)).toBeVisible()
    expect(document.documentElement).toHaveAttribute('lang', 'en')
  })

  it('moves keyboard focus to the route content without changing routes', async () => {
    const user = userEvent.setup()
    renderApp('/purchase-costs')

    await user.click(screen.getByRole('link', { name: 'Zum Inhalt springen' }))

    expect(screen.getByRole('main')).toHaveFocus()
    expect(screen.getByRole('heading', { level: 1, name: 'Kaufkosten berechnen' })).toBeVisible()
  })

  it('opens the compact navigation and closes it after route navigation', async () => {
    const user = userEvent.setup()
    renderApp()

    const navigation = screen.getByRole('navigation', { name: 'Hauptnavigation' })
    const menuButton = screen.getByRole('button', { name: 'Navigation öffnen' })

    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(navigation).toHaveAttribute('data-open', 'false')

    await user.click(menuButton)

    expect(screen.getByRole('button', { name: 'Navigation schließen' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(navigation).toHaveAttribute('data-open', 'true')

    await user.click(screen.getByRole('link', { name: 'Finanzierung' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Finanzierung planen' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Finanzierung' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(navigation).toHaveAttribute('data-open', 'false')
    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus())
  })

  it('redirects unknown routes to the overview', () => {
    renderApp('/does-not-exist')

    expect(screen.getByRole('link', { name: 'Überblick' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { level: 1 })).toBeVisible()
  })

  it('opens the saved-scenarios workspace from the primary navigation', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('link', { name: 'Gespeicherte Szenarien' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Gespeicherte Szenarien' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Gespeicherte Szenarien' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('opens the property comparison workspace from the primary navigation', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('link', { name: 'Vergleich' }))

    expect(
      screen.getByRole('heading', { level: 1, name: 'Immobilien im direkten Vergleich' }),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: 'Vergleich' })).toHaveAttribute('aria-current', 'page')
  })
})
