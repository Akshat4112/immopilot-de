import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import i18n from '../../i18n/config'
import { renderWithProviders, screen, userEvent } from '../../test/render'
import App from '../../app/App'

function renderMethodology() {
  return renderWithProviders(
    <MemoryRouter initialEntries={['/methodology']}>
      <App />
    </MemoryRouter>,
  )
}

describe('PF-007.3 methodology and source metadata', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('de')
  })

  it('explains methods and all source verification dates without inventing a source date', () => {
    renderMethodology()
    expect(
      screen.getByRole('heading', { level: 1, name: 'So berechnet ImmoPilot deine Szenarien' }),
    ).toBeVisible()
    expect(screen.getByText('de-2026.09')).toBeVisible()
    expect(screen.getAllByText('1.0.0').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Bruttorendite = Jahresnettokaltmiete / Kaufpreis P;', { exact: false }))
      .toBeVisible()
    expect(screen.getByText('Nicht angegeben', { exact: false }).length).not.toBe(0)
    expect(
      screen.getByRole('link', { name: /Aktuelle Grunderwerbsteuersätze/u }),
    ).toHaveAttribute('href', expect.stringContaining('dnoti.de'))
    expect(screen.getByText(/historisches Prüfdatum/)).toBeVisible()
    expect(screen.getByText(/keine gesetzlichen Erwerbsnebenkosten/)).toBeVisible()
    expect(
      screen.getByRole('link', { name: 'Berechnungsspezifikation 1.0.0' }),
    ).toHaveAttribute('href', expect.stringContaining('calculation-specification.md'))
  })

  it('switches formula explanations, source dates and page metadata to English', async () => {
    const user = userEvent.setup()
    renderMethodology()
    await user.click(screen.getByRole('button', { name: 'English' }))
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'How ImmoPilot calculates your scenarios',
      }),
    ).toBeVisible()
    expect(screen.getByText(/Gross yield = annual net cold rent/)).toBeVisible()
    expect(screen.getByText(/historical verification date/)).toBeVisible()
    expect(screen.getAllByText(/Not provided/).length).toBeGreaterThan(0)
    expect(document.title).toBe('Calculation methodology and sources · ImmoPilot DE')
  })
})
