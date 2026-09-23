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
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  it('does not overwrite the workspace with corrupted shared data', () => {
    useScenarioWorkspaceStore.getState().setPurchaseCosts({
      ...useScenarioWorkspaceStore.getState().purchaseCosts,
      purchasePrice: '777000',
    })

    renderPage('/scenarios?scenario=not-valid-base64')

    expect(screen.getByRole('alert')).toHaveTextContent(/beschädigt oder unvollständig/i)
    expect(useScenarioWorkspaceStore.getState().purchaseCosts.purchasePrice).toBe('777000')
  })

  it('reports corrupted local data without throwing', () => {
    window.localStorage.setItem(SCENARIO_LIBRARY_STORAGE_KEY, '{broken')

    renderPage()

    expect(screen.getByRole('alert')).toHaveTextContent('Ungültige Szenariodaten')
    expect(screen.getByText('Noch keine Szenarien gespeichert.')).toBeVisible()
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
