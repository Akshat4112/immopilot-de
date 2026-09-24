import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import i18n from '../../i18n/config'
import {
  initialFinancingDraft,
  initialPurchaseCostsDraft,
  initialScenarioAnalysisDraft,
  useScenarioWorkspaceStore,
} from '../scenario-workspace'
import { ResultsPage } from './ResultsPage'

function completePurchaseDraft() {
  return {
    ...initialPurchaseCostsDraft,
    purchasePrice: '250000',
    renovationBudget: { amountCents: 0, budgetStatus: 'confirmed-zero' as const },
    movingSetupCosts: { amountCents: 0, budgetStatus: 'confirmed-zero' as const },
  }
}

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <ResultsPage />
      </MemoryRouter>
    </I18nextProvider>,
  )
}

describe('ResultsPage', () => {
  beforeEach(async () => {
    useScenarioWorkspaceStore.getState().reset()
    useScenarioWorkspaceStore.getState().setPurchaseCosts(completePurchaseDraft())
    useScenarioWorkspaceStore.getState().updateFinancing({
      ...initialFinancingDraft,
      availableEquity: '66250',
      downPayment: '50000',
    })
    useScenarioWorkspaceStore.getState().updateAnalysis({
      ...initialScenarioAnalysisDraft,
      currentComparableRent: '1000',
      monthlyOwnerCosts: '250',
    })
    await i18n.changeLanguage('de')
  })

  afterEach(async () => {
    await i18n.changeLanguage('de')
  })

  it('presents shared mortgage, refinancing, and matched-budget results on one route', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Eine Immobilie bewerten' })).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'Wichtige Entscheidungen auf einen Blick' }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'Anschlussfinanzierung unter Stress' }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Mieten oder kaufen' })).toBeVisible()
    expect(screen.getAllByText(/152\.188,73/)).toHaveLength(2)
    expect(screen.getByText('Nettovermögen Käufer')).toBeVisible()
  })

  it('presents rental, sale, yield, and offer results when investment assumptions are complete', () => {
    useScenarioWorkspaceStore.getState().updateAnalysis({
      ...initialScenarioAnalysisDraft,
      propertyUse: 'rental-investment',
      monthlyNetColdRent: '1000',
      monthlyNonRecoverableHausgeld: '150',
      rentalPropertyAppreciationRate: '2',
      rentalSellingCostRate: '3',
      targetGrossYield: '5',
      targetNetYield: '4',
      maximumMonthlyPayment: '1000',
      livingAreaSquareMetres: '60',
      askingPrice: '250000',
      proposedOffer: '230000',
      comparablePricePerSquareMetreLow: '3800',
      comparablePricePerSquareMetreHigh: '4300',
      openingOfferLargerDiscount: '12',
      openingOfferSmallerDiscount: '8',
    })

    renderPage()

    expect(screen.getByRole('heading', { name: 'Kapitalanlage' })).toBeVisible()
    expect(screen.getByText('Bruttomietrendite')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Hypothetischer Verkauf' })).toBeVisible()
    expect(screen.getByText('Preisobergrenze bei Bruttorendite')).toBeVisible()
    expect(screen.getByText('Vergleichbarer Wert')).toBeVisible()
    expect(screen.getByText('Eröffnungsangebot')).toBeVisible()
    expect(screen.getByText(/Jahresnettokaltmiete/)).toBeVisible()
    expect(screen.getByText(/Betriebsergebnis/)).toBeVisible()
  })

  it('explains when purchase costs must be complete before analysis can begin', () => {
    useScenarioWorkspaceStore.getState().reset()

    renderPage()

    expect(screen.getByRole('heading', { name: 'Ergebnis nicht verfügbar' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Kaufkosten vervollständigen' })).toHaveAttribute(
      'href',
      '/purchase-costs',
    )
  })

  it('retains a negative annual growth assumption in the editable field', () => {
    renderPage()

    const rentGrowth = document.getElementById('ownerRentGrowthRate')
    if (!(rentGrowth instanceof HTMLInputElement))
      throw new Error('Owner rent-growth input is missing')
    fireEvent.change(rentGrowth, { target: { value: '-2' } })

    expect(rentGrowth).toHaveValue('-2')
  })

  it('normalizes English monetary input and preserves its value after changing language', async () => {
    await i18n.changeLanguage('en')
    renderPage()

    const currentRent = document.getElementById('currentComparableRent')
    if (!(currentRent instanceof HTMLInputElement))
      throw new Error('Comparable-rent input is missing')
    expect(currentRent).toHaveAttribute('placeholder', '1,200')

    fireEvent.change(currentRent, { target: { value: '1,200.50' } })
    expect(useScenarioWorkspaceStore.getState().analysis.currentComparableRent).toBe('1200.50')

    await i18n.changeLanguage('de')
    await waitFor(() => expect(currentRent).toHaveValue('1200,50'))
    expect(useScenarioWorkspaceStore.getState().analysis.currentComparableRent).toBe('1200.50')
  })

  it('labels an owner-occupier projection that extends beyond the fixed-interest period', () => {
    useScenarioWorkspaceStore.getState().updateAnalysis({
      ...initialScenarioAnalysisDraft,
      currentComparableRent: '1000',
      monthlyOwnerCosts: '250',
      ownerAnalysisYears: '15',
    })

    renderPage()

    expect(screen.getByText(/Nach Ende der Zinsbindung/)).toBeVisible()
  })

  it('shows the baseline comparison, fixed-period impact, and constant-rate projections', () => {
    useScenarioWorkspaceStore.getState().updateFinancing({
      additionalRepayments: {
        annualAdditionalRepayment: '5.000',
        annualAdditionalRepaymentMonth: '12',
        oneTimeAdditionalRepayments: [{ amount: '2.500', month: '12' }],
      },
    })

    renderPage()

    const heading = screen.getByRole('heading', { name: 'Sondertilgung im Vergleich' })
    const section = heading.closest('section')
    if (!section) throw new Error('Expected the Sondertilgung result section')
    const comparison = within(section)

    expect(comparison.getByText(/zwei identische Darlehensverläufe/i)).toBeVisible()
    expect(comparison.getByText('Vertragliche Monatsrate')).toBeVisible()
    expect(comparison.getByText('Zusätzliche Tilgung')).toBeVisible()
    expect(comparison.getByText('Gesparte Zinsen')).toBeVisible()
    expect(comparison.getByText('Niedrigere Restschuld')).toBeVisible()
    expect(comparison.getByText('Projizierte Zinsersparnis gesamt')).toBeVisible()
    expect(comparison.getByText('Projizierte Zeitersparnis')).toBeVisible()
    expect(comparison.getByText(/916,67/)).toBeVisible()
    expect(comparison.getByText(/Jahre.*Monate/)).toBeVisible()
    expect(comparison.getAllByText(/Projektion bei konstantem Sollzins/)).toHaveLength(2)

    const refinancingHeading = screen.getByRole('heading', {
      name: 'Anschlussfinanzierung unter Stress',
    })
    const refinancingSection = refinancingHeading.closest('section')
    if (!refinancingSection) throw new Error('Expected the refinancing section')
    expect(within(refinancingSection).getByText(/Restschuld .* nach Sondertilgung/)).toBeVisible()
    expect(screen.getByText(/Nach Sondertilgung und 10 Jahren Zinsbindung/)).toBeVisible()
  })

  it('marks an invalid additional-repayment comparison as unavailable', () => {
    useScenarioWorkspaceStore.getState().updateFinancing({
      additionalRepayments: {
        annualAdditionalRepayment: '',
        annualAdditionalRepaymentMonth: '12',
        oneTimeAdditionalRepayments: [{ amount: '', month: '18' }],
      },
    })

    renderPage()

    const heading = screen.getByRole('heading', { name: 'Sondertilgung im Vergleich' })
    const section = heading.closest('section')
    if (!section) throw new Error('Expected the Sondertilgung result section')
    expect(within(section).getByRole('heading', { name: 'Ergebnis nicht verfügbar' })).toBeVisible()
    expect(within(section).getByText(/unvollständig oder ungültig/i)).toBeVisible()
    const refinancingHeading = screen.getByRole('heading', {
      name: 'Anschlussfinanzierung unter Stress',
    })
    const refinancingSection = refinancingHeading.closest('section')
    if (!refinancingSection) throw new Error('Expected the refinancing section')
    expect(
      within(refinancingSection).getByText(
        /Tilgungsverlauf mit Sondertilgung ist nicht verfügbar/i,
      ),
    ).toBeVisible()
  })

  it('provides the additional-repayment comparison in English', async () => {
    await i18n.changeLanguage('en')
    useScenarioWorkspaceStore.getState().updateFinancing({
      additionalRepayments: {
        annualAdditionalRepayment: '5,000',
        annualAdditionalRepaymentMonth: '12',
        oneTimeAdditionalRepayments: [],
      },
    })

    renderPage()

    expect(screen.getByRole('heading', { name: 'Additional repayment comparison' })).toBeVisible()
    expect(screen.getByText('Additional principal repaid')).toBeVisible()
    expect(screen.getByText('Projected lifetime interest saved')).toBeVisible()
    expect(screen.getAllByText(/Constant-rate projection/)).toHaveLength(2)
    expect(
      screen.getByText(/Refinancing basis: remaining debt .* after additional repayments/),
    ).toBeVisible()
  })

  it('marks refinancing as not applicable for a cash purchase', () => {
    useScenarioWorkspaceStore.getState().updateFinancing({
      ...initialFinancingDraft,
      mode: 'available-equity',
      availableEquity: '266250',
    })

    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Keine Anschlussfinanzierung erforderlich' }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Keine Sondertilgung anwendbar' })).toBeVisible()
  })
})
