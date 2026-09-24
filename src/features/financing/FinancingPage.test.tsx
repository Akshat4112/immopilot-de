import { render, screen } from '@testing-library/react'
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
      },
    })
    renderPage()

    expect(screen.getByLabelText(/Betrag pro Darlehensjahr/)).toBeDisabled()
    expect(screen.getByLabelText(/Monat im Darlehensjahr/)).toBeDisabled()
    expect(screen.getByDisplayValue('5.000')).toBeVisible()
    expect(screen.getByText(/für einen späteren Wechsel zur Finanzierung erhalten/i)).toBeVisible()
    expect(useScenarioWorkspaceStore.getState().financing.additionalRepayments).toMatchObject({
      annualAdditionalRepayment: '5.000',
      annualAdditionalRepaymentMonth: '6',
    })
  })

  it('provides English labels, guidance, and locale-formatted input', async () => {
    const user = userEvent.setup()
    await i18n.changeLanguage('en')
    renderPage()

    const amount = screen.getByLabelText(/Amount per loan year/)
    await user.type(amount, '5,000.50')

    expect(screen.getByRole('group', { name: 'Annual additional repayment' })).toBeVisible()
    expect(screen.getByText(/contractual monthly payment remains unchanged/i)).toBeVisible()
    expect(amount).toHaveAttribute('aria-invalid', 'false')
    expect(
      useScenarioWorkspaceStore.getState().financing.additionalRepayments.annualAdditionalRepayment,
    ).toBe('5,000.50')
  })
})
