import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import i18n from '../../i18n/config'
import { renderWithProviders, screen, userEvent, within } from '../../test/render'
import { SCENARIO_LIBRARY_STORAGE_KEY } from '../../storage'
import { useScenarioWorkspaceStore } from '../scenario-workspace'
import { ScenariosPage } from './ScenariosPage'

function renderPage(route = '/scenarios') {
  return renderWithProviders(
    <MemoryRouter initialEntries={[route]}>
      <ScenariosPage />
    </MemoryRouter>,
  )
}

describe('ScenariosPage', () => {
  beforeEach(async () => {
    window.localStorage.clear()
    useScenarioWorkspaceStore.getState().reset()
    await i18n.changeLanguage('de')
  })

  it('saves, loads, renames, duplicates, and deletes local scenarios', async () => {
    const user = userEvent.setup()
    useScenarioWorkspaceStore.getState().setPurchaseCosts({
      ...useScenarioWorkspaceStore.getState().purchaseCosts,
      purchasePrice: '350000',
    })
    renderPage()

    await user.type(screen.getByLabelText('Szenarioname'), 'Altbau Köln')
    await user.click(screen.getByRole('button', { name: 'Szenario speichern' }))

    const library = JSON.parse(
      window.localStorage.getItem(SCENARIO_LIBRARY_STORAGE_KEY) ?? '{}',
    ) as { scenarios: Array<Record<string, unknown>> }
    expect(library.scenarios).toHaveLength(1)
    expect(library.scenarios[0]).not.toHaveProperty('results')
    expect(
      within(screen.getByRole('listitem')).getByRole('link', { name: 'Vergleichen' }),
    ).toHaveAttribute('href', expect.stringMatching(/^\/comparison\?scenario=/))

    useScenarioWorkspaceStore.getState().setPurchaseCosts({
      ...useScenarioWorkspaceStore.getState().purchaseCosts,
      purchasePrice: '1',
    })
    const firstCard = screen.getAllByRole('listitem')[0]!
    await user.click(within(firstCard).getByRole('button', { name: 'Laden' }))
    expect(useScenarioWorkspaceStore.getState().purchaseCosts.purchasePrice).toBe('350000')

    const nameInput = within(firstCard).getByLabelText('Szenarioname')
    await user.clear(nameInput)
    await user.type(nameInput, 'Köln Zentrum')
    await user.click(within(firstCard).getByRole('button', { name: 'Umbenennen' }))
    expect(screen.getByDisplayValue('Köln Zentrum')).toBeVisible()

    await user.click(within(firstCard).getByRole('button', { name: 'Duplizieren' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByDisplayValue('Köln Zentrum (Kopie)')).toBeVisible()

    await user.click(
      within(screen.getAllByRole('listitem')[1]!).getByRole('button', { name: 'Löschen' }),
    )
    expect(screen.getByText(/wirklich dauerhaft löschen/i)).toBeVisible()
    await user.click(
      within(screen.getAllByRole('listitem')[1]!).getByRole('button', {
        name: 'Endgültig löschen',
      }),
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Alle lokalen Daten löschen' }))
    expect(screen.getByText(/kann nicht rückgängig gemacht werden/i)).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Alle endgültig löschen' }))
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('does not overwrite the workspace with corrupted shared data and can remove it from the URL', async () => {
    const user = userEvent.setup()
    useScenarioWorkspaceStore.getState().setPurchaseCosts({
      ...useScenarioWorkspaceStore.getState().purchaseCosts,
      purchasePrice: '777000',
    })

    renderPage('/scenarios?scenario=not-valid-base64')

    expect(screen.getByRole('alert')).toHaveTextContent(/beschädigt oder unvollständig/i)
    expect(useScenarioWorkspaceStore.getState().purchaseCosts.purchasePrice).toBe('777000')

    await user.click(screen.getByRole('button', { name: 'Geteilte Daten aus URL entfernen' }))
    expect(screen.queryByRole('heading', { name: 'Geteiltes Szenario' })).not.toBeInTheDocument()
  })

  it('requires an explicit privacy acknowledgement before sharing or exporting', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Szenarioname'), 'Private Adresse')
    await user.click(screen.getByRole('button', { name: 'Szenario speichern' }))
    const savedCard = screen.getByRole('listitem')

    await user.click(within(savedCard).getByRole('button', { name: 'Teilen' }))
    expect(screen.queryByLabelText('Freigabelink für das Szenario')).not.toBeInTheDocument()
    expect(screen.getByText(/Jeder mit dem vollständigen Link/i)).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Verstanden, Link erstellen' }))
    expect(screen.getByLabelText('Freigabelink für das Szenario')).toBeVisible()

    await user.click(within(savedCard).getByRole('button', { name: 'JSON exportieren' }))
    expect(screen.getByText(/Kaufpläne und finanzielle Verhältnisse/i)).toBeVisible()
  })

  it('reports corrupted local data without throwing', () => {
    window.localStorage.setItem(SCENARIO_LIBRARY_STORAGE_KEY, '{broken')

    renderPage()

    expect(screen.getByRole('alert')).toHaveTextContent('Ungültige Szenariodaten')
    expect(screen.getByText('Noch keine Szenarien gespeichert.')).toBeVisible()
  })

  it('restores the saved library after the page remounts', async () => {
    const user = userEvent.setup()
    const view = renderPage()
    await user.type(screen.getByLabelText('Szenarioname'), 'Reload test')
    await user.click(screen.getByRole('button', { name: 'Szenario speichern' }))

    view.unmount()
    renderPage()

    expect(screen.getByDisplayValue('Reload test')).toBeVisible()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('switches all scenario-management copy to English', async () => {
    const user = userEvent.setup()
    renderPage()

    await i18n.changeLanguage('en')

    expect(screen.getByRole('heading', { level: 1, name: 'Saved scenarios' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Save scenario' })).toBeVisible()
    expect(screen.getByText(/Only user inputs are saved/i)).toBeVisible()
    await user.type(screen.getByLabelText('Scenario name'), 'Berlin flat')
  })
})
