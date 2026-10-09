import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import i18n from '../../i18n/config'
import { renderWithProviders, screen, userEvent } from '../../test/render'
import { useScenarioWorkspaceStore } from '../scenario-workspace'
import { HomePage } from './HomePage'

function renderPage() {
  return renderWithProviders(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage audience entry paths', () => {
  beforeEach(async () => {
    useScenarioWorkspaceStore.getState().reset()
    await i18n.changeLanguage('de')
  })

  it('offers distinct owner-occupier and rental-investment starts', async () => {
    const user = userEvent.setup()
    renderPage()

    const owner = screen.getByRole('link', { name: /Für Eigennutzung rechnen/ })
    const rental = screen.getByRole('link', { name: 'Kapitalanlage bewerten' })
    expect(owner).toHaveAttribute('href', '/purchase-costs')
    expect(rental).toHaveAttribute('href', '/purchase-costs')

    await user.click(rental)
    expect(useScenarioWorkspaceStore.getState().analysis.propertyUse).toBe('rental-investment')
    expect(screen.getByText(/abschließenden Release-Prüfung/)).toBeVisible()
    expect(screen.queryByText(/schrittweise.*gebaut/)).not.toBeInTheDocument()
  })

  it('provides both entry paths in English and preserves the selected mode', async () => {
    const user = userEvent.setup()
    await i18n.changeLanguage('en')
    renderPage()

    expect(screen.getByRole('link', { name: /Calculate for my own home/ })).toBeVisible()
    await user.click(screen.getByRole('link', { name: 'Evaluate a rental investment' }))

    expect(useScenarioWorkspaceStore.getState().analysis.propertyUse).toBe('rental-investment')
  })
})
