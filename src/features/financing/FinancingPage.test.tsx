import { render, screen } from '@testing-library/react'
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
})
