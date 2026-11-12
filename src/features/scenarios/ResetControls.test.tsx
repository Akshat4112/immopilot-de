import { beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '../../i18n/config'
import { renderWithProviders, screen, userEvent } from '../../test/render'
import { SCENARIO_LIBRARY_STORAGE_KEY } from '../../storage'
import { useScenarioWorkspaceStore } from '../scenario-workspace'
import { ResetControls } from './ResetControls'

describe('PF-007.2 reset controls', () => {
  beforeEach(async () => {
    window.localStorage.clear()
    useScenarioWorkspaceStore.getState().reset()
    await i18n.changeLanguage('de')
  })

  it('confirms before resetting a module and preserves saved and unrelated browser data', async () => {
    const user = userEvent.setup()
    const clearAll = vi.fn(() => true)
    window.localStorage.setItem(SCENARIO_LIBRARY_STORAGE_KEY, 'saved scenario bytes')
    window.localStorage.setItem('other-product', 'keep')
    useScenarioWorkspaceStore.getState().setPurchaseCosts({
      ...useScenarioWorkspaceStore.getState().purchaseCosts,
      purchasePrice: '325000',
    })
    useScenarioWorkspaceStore.getState().updateFinancing({ downPayment: '45000' })
    renderWithProviders(<ResetControls onClearAllLocalData={clearAll} />)

    const purchaseReset = screen.getByRole('button', { name: 'Kaufkosten zurücksetzen' })
    await user.click(purchaseReset)
    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'Finanzierung, Analyse und gespeicherte Szenarien bleiben erhalten.',
    )
    expect(useScenarioWorkspaceStore.getState().purchaseCosts.purchasePrice).toBe('325000')

    await user.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(useScenarioWorkspaceStore.getState().purchaseCosts.purchasePrice).toBe('325000')

    await user.click(purchaseReset)
    await user.click(screen.getByRole('button', { name: 'Ja, zurücksetzen' }))
    expect(useScenarioWorkspaceStore.getState().purchaseCosts.purchasePrice).toBe('')
    expect(useScenarioWorkspaceStore.getState().financing.downPayment).toBe('45000')
    expect(window.localStorage.getItem(SCENARIO_LIBRARY_STORAGE_KEY)).toBe('saved scenario bytes')
    expect(window.localStorage.getItem('other-product')).toBe('keep')
    expect(clearAll).not.toHaveBeenCalled()
  })

  it('retains all inputs when storage deletion fails, then clears only on success', async () => {
    const user = userEvent.setup()
    const clearAll = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true)
    useScenarioWorkspaceStore.getState().setPurchaseCosts({
      ...useScenarioWorkspaceStore.getState().purchaseCosts,
      purchasePrice: '300000',
    })
    renderWithProviders(<ResetControls onClearAllLocalData={clearAll} />)

    await user.click(
      screen.getByRole('button', { name: 'Arbeitsstand und gespeicherte Szenarien löschen' }),
    )
    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'Bereits exportierte Dateien und geteilte Links können nicht zurückgerufen werden.',
    )
    await user.click(screen.getByRole('button', { name: 'Ja, zurücksetzen' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Nichts wurde zurückgesetzt.')
    expect(useScenarioWorkspaceStore.getState().purchaseCosts.purchasePrice).toBe('300000')

    await user.click(screen.getByRole('button', { name: 'Ja, zurücksetzen' }))
    expect(useScenarioWorkspaceStore.getState().purchaseCosts.purchasePrice).toBe('')
    expect(clearAll).toHaveBeenCalledTimes(2)
  })

  it('explains scopes in English and protects saved data on workspace-only reset', async () => {
    const user = userEvent.setup()
    const clearAll = vi.fn(() => true)
    await i18n.changeLanguage('en')
    useScenarioWorkspaceStore.getState().updateFinancing({ downPayment: '50000' })
    renderWithProviders(<ResetControls onClearAllLocalData={clearAll} />)

    await user.click(screen.getByRole('button', { name: 'Reset workspace' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'Locally saved scenarios are retained.',
    )
    await user.click(screen.getByRole('button', { name: 'Yes, reset' }))
    expect(useScenarioWorkspaceStore.getState().financing.downPayment).toBe('')
    expect(clearAll).not.toHaveBeenCalled()
  })
})
