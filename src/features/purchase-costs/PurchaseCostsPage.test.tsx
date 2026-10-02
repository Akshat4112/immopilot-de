import { fireEvent, render, screen, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import i18n from '../../i18n/config'
import { useScenarioWorkspaceStore } from '../scenario-workspace'
import { PurchaseCostsPage } from './PurchaseCostsPage'

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <PurchaseCostsPage />
      </MemoryRouter>
    </I18nextProvider>,
  )
}

describe('PurchaseCostsPage', () => {
  beforeEach(async () => {
    useScenarioWorkspaceStore.getState().reset()
    await i18n.changeLanguage('de')
  })

  afterEach(async () => {
    await i18n.changeLanguage('de')
  })

  it('shows the transaction-cost breakdown before post-purchase budgets are confirmed', () => {
    renderPage()

    fireEvent.change(screen.getByRole('textbox', { name: 'Kaufpreis' }), {
      target: { value: '250000' },
    })

    expect(screen.getByRole('heading', { name: 'Grunderwerbsteuer' })).toBeVisible()
    expect(screen.getByText(/12\.500,00/)).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Kaufnebenkosten gesamt' })).toBeVisible()
    expect(screen.getByText(/16\.250,00/)).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'Budgets nach dem Kauf noch nicht bestätigt' }),
    ).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Gesamtkosten' })).not.toBeInTheDocument()
  })

  it('marks a positive entered amount as budgeted and enables the full project total', () => {
    renderPage()

    fireEvent.change(screen.getByRole('textbox', { name: 'Kaufpreis' }), {
      target: { value: '250000' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Renovierungsbudget' }), {
      target: { value: '10000' },
    })

    expect(screen.getByRole('combobox', { name: 'Status für Renovierungsbudget' })).toHaveValue(
      'budgeted',
    )

    fireEvent.change(
      screen.getByRole('combobox', { name: 'Status für Umzugs- und Einrichtungskosten' }),
      { target: { value: 'confirmed-zero' } },
    )

    expect(screen.getByRole('heading', { name: 'Gesamtkosten' })).toBeVisible()
    expect(screen.getByText(/276\.250,00/)).toBeVisible()
  })

  it('accepts an English decimal rate and formats the result for the active locale', async () => {
    await i18n.changeLanguage('en')
    renderPage()

    const stateSelect = screen.getByRole('combobox', { name: 'Federal state' })
    expect(within(stateSelect).getByRole('option', { name: 'Bavaria' })).toBeVisible()

    fireEvent.change(screen.getByRole('textbox', { name: 'Purchase price' }), {
      target: { value: '250000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Advanced inputs' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Property transfer tax (Rate)' }), {
      target: { value: '1.5' },
    })

    const transferTaxCard = screen
      .getByRole('heading', { name: 'Property transfer tax' })
      .closest('article')
    expect(transferTaxCard).not.toBeNull()
    expect(within(transferTaxCard as HTMLElement).getByText(/€3,750\.00/)).toBeVisible()
    expect(within(transferTaxCard as HTMLElement).getByText(/1\.50%/)).toBeVisible()
  })

  it.each([
    ['de', 'renovationBudget', 'Renovierungsbudget', 'Umzugs- und Einrichtungskosten'],
    ['de', 'movingSetupCosts', 'Umzugs- und Einrichtungskosten', 'Renovierungsbudget'],
    ['en', 'renovationBudget', 'Renovation budget', 'Moving and setup costs'],
    ['en', 'movingSetupCosts', 'Moving and setup costs', 'Renovation budget'],
  ] as const)(
    'keeps %s %s valid when a positive budget is confirmed zero, unconfirmed or cleared',
    async (language, field, label, otherLabel) => {
      await i18n.changeLanguage(language)
      renderPage()
      const statusLabel = (budget: string) =>
        language === 'de' ? `Status für ${budget}` : `Status for ${budget}`
      const amount = screen.getByRole('textbox', { name: label })
      const status = screen.getByRole('combobox', { name: statusLabel(label) })
      fireEvent.change(
        screen.getByRole('textbox', {
          name: language === 'de' ? 'Kaufpreis' : 'Purchase price',
        }),
        { target: { value: '250000' } },
      )
      fireEvent.change(screen.getByRole('combobox', { name: statusLabel(otherLabel) }), {
        target: { value: 'confirmed-zero' },
      })

      fireEvent.change(amount, { target: { value: '10000' } })
      fireEvent.change(status, { target: { value: 'confirmed-zero' } })
      expect(amount).toHaveValue('')
      expect(useScenarioWorkspaceStore.getState().purchaseCosts[field]).toEqual({
        amountCents: 0,
        budgetStatus: 'confirmed-zero',
      })
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.getByText(language === 'de' ? /266\.250,00/ : /€266,250\.00/)).toBeVisible()

      fireEvent.change(amount, { target: { value: '10000' } })
      fireEvent.change(status, { target: { value: 'not-budgeted' } })
      expect(amount).toHaveValue('')
      expect(useScenarioWorkspaceStore.getState().purchaseCosts[field]).toEqual({
        amountCents: 0,
        budgetStatus: 'not-budgeted',
      })
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()

      fireEvent.change(amount, { target: { value: '10000' } })
      fireEvent.change(amount, { target: { value: '' } })
      expect(status).toHaveValue('not-budgeted')
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      fireEvent.change(status, { target: { value: 'confirmed-zero' } })
      expect(screen.getByText(language === 'de' ? /266\.250,00/ : /€266,250\.00/)).toBeVisible()
    },
  )
})
