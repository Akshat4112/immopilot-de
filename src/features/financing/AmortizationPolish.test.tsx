import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'

import i18n from '../../i18n/config'
import { renderWithProviders, screen, userEvent, within } from '../../test/render'
import {
  calculateScenarioWorkspace,
  initialFinancingDraft,
  initialPurchaseCostsDraft,
  type FinancingDraft,
} from '../scenario-workspace'
import { AmortizationBreakdown } from './AmortizationBreakdown'

function workspace(financing: Partial<FinancingDraft> = {}) {
  return calculateScenarioWorkspace(
    {
      ...initialPurchaseCostsDraft,
      purchasePrice: '250000',
      renovationBudget: { amountCents: 0, budgetStatus: 'confirmed-zero' },
      movingSetupCosts: { amountCents: 0, budgetStatus: 'confirmed-zero' },
    },
    { ...initialFinancingDraft, availableEquity: '66250', downPayment: '50000', ...financing },
  )
}
function explorer(result = workspace()) {
  return (
    <I18nextProvider i18n={i18n}>
      <AmortizationBreakdown
        baseline={result.amortization}
        selected={result.selectedAmortization}
        selectedBasis={result.selectedAmortizationBasis}
        inputKey="fixture"
      />
    </I18nextProvider>
  )
}
const copy = {
  de: {
    open: 'Detaillierten Tilgungsplan öffnen',
    annual: 'Reguläre Zahlungen (Summe)',
    monthly: 'Reguläre Rate',
    month: 'Monatlich',
    full: 'Vollständige Rückzahlung (Projektion)',
    sum: '11.000,04 €',
    rate: '916,67 €',
    help: /horizontal wischen.*Pfeiltasten.*EUR/,
    cash: /Kauf ohne Darlehen.*keinen Tilgungsplan/,
    unavailable: /Prüfe Sollzins, anfängliche Tilgung/,
    baseline: /Ohne Sondertilgung gibt es nur/,
  },
  en: {
    open: 'Open detailed amortization schedule',
    annual: 'Regular payments (sum)',
    monthly: 'Regular payment',
    month: 'Monthly',
    full: 'Full projected repayment',
    sum: '€11,000.04',
    rate: '€916.67',
    help: /Swipe horizontally.*arrow keys.*EUR/,
    cash: /cash purchase.*no mortgage repayment schedule/,
    unavailable: /Check the nominal interest, initial repayment/,
    baseline: /Without additional repayments, only/,
  },
} as const

describe.each(['de', 'en'] as const)('amortization copy in %s', (language) => {
  it('keeps full captions outside scrolling tables with native names and localized annual sums', async () => {
    await i18n.changeLanguage(language)
    const user = userEvent.setup()
    renderWithProviders(explorer())
    await user.click(screen.getByText(copy[language].open))
    expect(screen.getByRole('radio', { name: copy[language].full })).toBeEnabled()
    for (const summary of document.querySelectorAll<HTMLDetailsElement>(
      '.chart-data-view > summary',
    ))
      await user.click(summary)
    const tables = screen.getAllByRole('table')
    expect(tables).toHaveLength(3)
    for (const table of tables) {
      expect(table).toHaveAccessibleName(/EUR$/)
      const frame = table.closest<HTMLElement>('.amortization-table-frame')!
      const visibleCaption = frame.querySelector('.amortization-table-caption')!
      expect(visibleCaption).toHaveTextContent(table.querySelector('caption')!.textContent)
      expect(visibleCaption.closest('.amortization-table-scroll')).toBeNull()
      const region = within(frame).getByRole('region')
      expect(region).toHaveAccessibleDescription(copy[language].help)
      expect(
        within(table)
          .getAllByRole('columnheader')
          .every((h) => h.getAttribute('scope') === 'col'),
      ).toBe(true)
    }
    const repayment = screen.getByRole('table', {
      name: language === 'de' ? /^Tilgungsplan ohne/ : /^Schedule without/,
    })
    expect(
      within(repayment).getByRole('columnheader', { name: copy[language].annual }),
    ).toBeInTheDocument()
    expect(within(repayment).getAllByRole('row')[1]).toHaveTextContent(copy[language].sum)
    const paymentData = tables.find(
      (table) =>
        within(table).queryByRole('columnheader', { name: copy[language].annual }) &&
        table !== repayment,
    )!
    expect(within(paymentData).getAllByRole('row')[1]).toHaveTextContent(copy[language].sum)
    await user.click(screen.getByRole('radio', { name: copy[language].month }))
    const monthly = screen.getByRole('table')
    expect(
      within(monthly).getByRole('columnheader', { name: copy[language].monthly }),
    ).toBeInTheDocument()
    expect(
      within(monthly).queryByRole('columnheader', { name: copy[language].annual }),
    ).not.toBeInTheDocument()
    expect(within(monthly).getAllByRole('row')[1]).toHaveTextContent(copy[language].rate)
  })

  it('explains cash purchases and unavailable schedules without misleading numeric views', async () => {
    await i18n.changeLanguage(language)
    const user = userEvent.setup()
    const view = renderWithProviders(
      explorer(workspace({ mode: 'available-equity', availableEquity: '999999' })),
    )
    await user.click(screen.getByText(copy[language].open))
    expect(screen.getByRole('status')).toHaveTextContent(copy[language].cash)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    const result = workspace({ initialRepaymentRate: '0' })
    expect(result.amortization.status).toBe('unavailable')
    view.rerender(explorer(result))
    expect(screen.getByRole('status')).toHaveTextContent(copy[language].unavailable)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('explains absent plans and keeps zero and partial final-payment amounts localized', async () => {
    await i18n.changeLanguage(language)
    const user = userEvent.setup()
    renderWithProviders(explorer())
    await user.click(screen.getByText(copy[language].open))
    expect(screen.getByText(copy[language].baseline)).toBeVisible()
    await user.click(screen.getByRole('radio', { name: copy[language].full }))
    await user.click(
      screen.getByRole('button', { name: language === 'de' ? 'Letzte Seite' : 'Last page' }),
    )
    const last = screen.getAllByRole('row').at(-1)!
    expect(within(last).getByRole('rowheader')).toHaveTextContent(
      language === 'de' ? 'Volltilgung' : 'Payoff',
    )
    expect(within(last).getAllByRole('cell').at(-1)).toHaveTextContent(
      language === 'de' ? '0 €' : '€0',
    )
  })
})
