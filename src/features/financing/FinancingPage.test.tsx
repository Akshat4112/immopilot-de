import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import i18n from '../../i18n/config'
import {
  initialFinancingDraft,
  initialPurchaseCostsDraft,
  useScenarioWorkspaceStore,
} from '../scenario-workspace'
import { FinancingPage } from './FinancingPage'

function completePurchaseDraft() {
  return {
    ...initialPurchaseCostsDraft,
    purchasePrice: '250000',
    renovationBudget: {
      amountCents: 0,
      budgetStatus: 'confirmed-zero' as const,
    },
    movingSetupCosts: {
      amountCents: 0,
      budgetStatus: 'confirmed-zero' as const,
    },
  }
}

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <FinancingPage />
      </MemoryRouter>
    </I18nextProvider>,
  )
}

describe('FinancingPage', () => {
  beforeEach(async () => {
    useScenarioWorkspaceStore.getState().reset()
    await i18n.changeLanguage('de')
  })

  afterEach(async () => {
    await i18n.changeLanguage('de')
  })

  it('asks the user to complete purchase costs before financing is available', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Kaufkosten zuerst vervollständigen' }),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: 'Kaufkosten bearbeiten' })).toHaveAttribute(
      'href',
      '/purchase-costs',
    )
  })

  it('shows the required equity, payment and remaining debt from the shared draft', () => {
    useScenarioWorkspaceStore.getState().setPurchaseCosts(completePurchaseDraft())
    useScenarioWorkspaceStore.getState().updateFinancing({
      ...initialFinancingDraft,
      availableEquity: '66250',
      downPayment: '50000',
    })

    renderPage()

    expect(screen.getByRole('heading', { name: 'Finanzierung planen' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Finanzierung gedeckt' })).toBeVisible()
    expect(screen.getByText(/^66\.250/)).toBeVisible()
    expect(screen.getByText(/916,67/)).toBeVisible()
    expect(screen.getByText(/152\.188,73/)).toBeVisible()
    expect(screen.getByText('Detaillierten Tilgungsplan öffnen')).toBeVisible()
  })

  it('shows baseline and Sondertilgung month rows directly from the domain schedules', async () => {
    const user = userEvent.setup()
    useScenarioWorkspaceStore.getState().setPurchaseCosts(completePurchaseDraft())
    useScenarioWorkspaceStore.getState().updateFinancing({
      ...initialFinancingDraft,
      availableEquity: '66250',
      downPayment: '50000',
      additionalRepayments: {
        annualAdditionalRepayment: '5.000',
        annualAdditionalRepaymentMonth: '12',
        oneTimeAdditionalRepayments: [{ amount: '2.500', month: '12' }],
      },
    })

    renderPage()
    await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
    await user.click(screen.getByRole('radio', { name: 'Monatlich' }))
    await user.click(screen.getByRole('radio', { name: 'Vollständige Rückzahlung' }))

    const baseline = screen.getByRole('table', { name: /Tilgungsplan ohne Sondertilgung/ })
    const selected = screen.getByRole('table', { name: /Tilgungsplan mit Sondertilgung/ })
    const baselineMonth12 = within(baseline).getByRole('rowheader', { name: '12' }).closest('tr')
    const selectedMonth12 = within(selected).getByRole('rowheader', { name: '12' }).closest('tr')
    if (!baselineMonth12 || !selectedMonth12) throw new Error('Expected month 12 schedule rows')

    expect(within(baselineMonth12).getByText(/^0\s*€$/)).toBeVisible()
    expect(within(selectedMonth12).getByText(/7\.500(?:,00)?\s*€/)).toBeVisible()
    expect(screen.getAllByText(/Projektion bei konstantem Sollzins/i)).toHaveLength(4)
  })

  it('stores locale-formatted annual repayment inputs without changing the baseline schedule', async () => {
    const user = userEvent.setup()
    useScenarioWorkspaceStore.getState().setPurchaseCosts(completePurchaseDraft())
    useScenarioWorkspaceStore.getState().updateFinancing({
      ...initialFinancingDraft,
      availableEquity: '66250',
      downPayment: '50000',
    })
    renderPage()

    const amount = screen.getByLabelText(/Betrag pro Darlehensjahr/)
    const month = screen.getByLabelText(/Monat im Darlehensjahr/)
    expect(month).toHaveValue('12')

    await user.type(amount, '5.000,50')
    await user.selectOptions(month, '3')

    expect(useScenarioWorkspaceStore.getState().financing.additionalRepayments).toMatchObject({
      annualAdditionalRepayment: '5.000,50',
      annualAdditionalRepaymentMonth: '3',
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText(/916,67/)).toBeVisible()
    expect(screen.getByText(/152\.188,73/)).toBeVisible()
  })

  it('shows accessible errors for negative amounts and invalid active months', async () => {
    const user = userEvent.setup()
    useScenarioWorkspaceStore.getState().updateFinancing({
      additionalRepayments: {
        ...initialFinancingDraft.additionalRepayments,
        annualAdditionalRepaymentMonth: '',
      },
    })
    renderPage()

    const amount = screen.getByLabelText(/Betrag pro Darlehensjahr/)
    await user.type(amount, '-100')
    expect(amount).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent(/darf nicht negativ sein/i)

    await user.clear(amount)
    await user.type(amount, '5000')
    expect(screen.getByLabelText(/Monat im Darlehensjahr/)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent(/Monat von 1 bis 12/i)
  })

  it('disables annual repayment controls for a cash purchase without clearing their values', () => {
    useScenarioWorkspaceStore.getState().setPurchaseCosts(completePurchaseDraft())
    useScenarioWorkspaceStore.getState().updateFinancing({
      ...initialFinancingDraft,
      mode: 'available-equity',
      availableEquity: '266250',
      additionalRepayments: {
        ...initialFinancingDraft.additionalRepayments,
        annualAdditionalRepayment: '5.000',
        annualAdditionalRepaymentMonth: '6',
        oneTimeAdditionalRepayments: [{ amount: '10.000', month: '18' }],
      },
    })
    renderPage()

    expect(screen.getByLabelText(/Betrag pro Darlehensjahr/)).toBeDisabled()
    expect(screen.getByLabelText(/Monat im Darlehensjahr/)).toBeDisabled()
    expect(screen.getByLabelText(/Betrag für Einmalzahlung 1/)).toBeDisabled()
    expect(screen.getByLabelText(/Darlehensmonat für Einmalzahlung 1/)).toBeDisabled()
    expect(screen.getByRole('button', { name: /Einmalzahlung 1 entfernen/ })).toBeDisabled()
    expect(screen.getByDisplayValue('5.000')).toBeVisible()
    expect(screen.getByText(/für einen späteren Wechsel zur Finanzierung erhalten/i)).toBeVisible()
    expect(useScenarioWorkspaceStore.getState().financing.additionalRepayments).toMatchObject({
      annualAdditionalRepayment: '5.000',
      annualAdditionalRepaymentMonth: '6',
      oneTimeAdditionalRepayments: [{ amount: '10.000', month: '18' }],
    })
  })

  it('adds, edits, sorts, and removes one-time repayment rows', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Einmalzahlung hinzufügen' }))
    await user.click(screen.getByRole('button', { name: 'Einmalzahlung hinzufügen' }))

    await user.type(screen.getByLabelText('Betrag für Einmalzahlung 1'), '2.000')
    await user.type(screen.getByLabelText('Darlehensmonat für Einmalzahlung 1'), '24')
    await user.type(screen.getByLabelText('Betrag für Einmalzahlung 2'), '1.000')
    await user.type(screen.getByLabelText('Darlehensmonat für Einmalzahlung 2'), '6')
    await user.tab()

    expect(
      useScenarioWorkspaceStore.getState().financing.additionalRepayments
        .oneTimeAdditionalRepayments,
    ).toEqual([
      { amount: '1.000', month: '6' },
      { amount: '2.000', month: '24' },
    ])

    await user.click(screen.getByRole('button', { name: 'Einmalzahlung 1 entfernen' }))
    expect(
      useScenarioWorkspaceStore.getState().financing.additionalRepayments
        .oneTimeAdditionalRepayments,
    ).toEqual([{ amount: '2.000', month: '24' }])
  })

  it('requires complete rows and rejects duplicate one-time repayment months', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Einmalzahlung hinzufügen' }))
    expect(screen.getByText(/für diese Einmalzahlung einen Betrag/i)).toBeVisible()
    expect(screen.getByText(/für diese Einmalzahlung einen Darlehensmonat/i)).toBeVisible()

    await user.type(screen.getByLabelText('Betrag für Einmalzahlung 1'), '1.000')
    await user.type(screen.getByLabelText('Darlehensmonat für Einmalzahlung 1'), '12')
    await user.click(screen.getByRole('button', { name: 'Einmalzahlung hinzufügen' }))
    await user.type(screen.getByLabelText('Betrag für Einmalzahlung 2'), '2.000')
    await user.type(screen.getByLabelText('Darlehensmonat für Einmalzahlung 2'), '12')

    expect(screen.getAllByText(/für diesen Darlehensmonat gibt es bereits/i)).toHaveLength(2)
  })

  it('allows annual and one-time additional repayments in the same month', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/Betrag pro Darlehensjahr/), '5.000')
    await user.click(screen.getByRole('button', { name: 'Einmalzahlung hinzufügen' }))
    await user.type(screen.getByLabelText('Betrag für Einmalzahlung 1'), '1.000')
    await user.type(screen.getByLabelText('Darlehensmonat für Einmalzahlung 1'), '12')

    expect(screen.queryByText(/für diesen Darlehensmonat gibt es bereits/i)).not.toBeInTheDocument()
  })

  it('explains timing, payoff treatment, and contractual boundaries bilingually', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByText('So rechnet ImmoPilot mit Sondertilgungen'))
    expect(screen.getByText('Zeitpunkt im Zahlungsmonat')).toBeVisible()
    expect(screen.getByText(/Sondertilgung am Monatsende/)).toBeVisible()
    expect(screen.getByText(/reguläre Monatsrate bleibt unverändert/)).toBeVisible()
    expect(screen.getByText(/keine vertraglichen Rechte, Höchstbeträge, Gebühren/)).toBeVisible()

    await i18n.changeLanguage('en')
    expect(screen.getByText('How ImmoPilot calculates additional repayments')).toBeVisible()
    expect(screen.getByText('Treatment in results')).toBeVisible()
    expect(screen.getByText(/Cash-on-cash return remains before/)).toBeVisible()
  })

  it('provides English labels, guidance, and locale-formatted input', async () => {
    const user = userEvent.setup()
    await i18n.changeLanguage('en')
    renderPage()

    const amount = screen.getByLabelText(/Amount per loan year/)
    await user.type(amount, '5,000.50')

    expect(screen.getByRole('group', { name: 'Annual additional repayment' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'One-time additional repayments' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Add one-time repayment' })).toBeVisible()
    expect(screen.getByText(/contractual monthly payment remains unchanged/i)).toBeVisible()
    expect(amount).toHaveAttribute('aria-invalid', 'false')
    expect(
      useScenarioWorkspaceStore.getState().financing.additionalRepayments.annualAdditionalRepayment,
    ).toBe('5,000.50')
  })
})
