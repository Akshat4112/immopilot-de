import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { reportInputs, capturedReport } from '../../test/reportFixtures'
import { reportFormat, formatCapturedInput } from './reportCopy'
import { createReportAmortization } from './reportAmortization'
import { PropertyReport } from './PropertyReport'
import { PropertyReportPreview } from './PropertyReportPreview'

describe('bilingual property documents', () => {
  it.each(['de', 'en'] as const)(
    'renders a complete %s report from the captured rows, including partial payoff and chart data',
    (language) => {
      const inputs = reportInputs()
      inputs.financing.additionalRepayments.annualAdditionalRepayment = '5000'
      const snapshot = capturedReport(inputs, { language })
      const before = JSON.stringify(snapshot)
      render(<PropertyReport snapshot={snapshot} />)
      const report = screen.getByRole('article')
      expect(report).toHaveAttribute('lang', language)
      const schedule = within(report).getByRole('table', {
        name: `${language === 'de' ? 'Mit Sondertilgung' : 'With additional repayments'} · EUR`,
      })
      expect(within(schedule).getAllByRole('row')).toHaveLength(18)
      expect(within(schedule).getAllByRole('row')[1]!.textContent).toContain(
        reportFormat(language).money(1600004),
      )
      expect(within(schedule).getAllByRole('row').at(-1)).toHaveTextContent(
        language === 'de' ? 'Monate 193–203 · Teiljahr' : 'Months 193–203 · Partial year',
      )
      expect(within(report).getAllByRole('img')).toHaveLength(2)
      const payments = within(report).getByRole('table', {
        name: `${language === 'de' ? 'Daten zur Zahlungszusammensetzung' : 'Payment-composition data'} · EUR`,
      })
      expect(within(payments).getAllByRole('row')).toHaveLength(47)
      expect(report.textContent).toContain(
        language === 'de' ? 'Annahmen geprüft am' : 'Assumptions verified on',
      )
      expect(report).toHaveTextContent('2026-09-13')
      expect(report).toHaveTextContent(language === 'de' ? '203' : '203')
      expect(JSON.stringify(snapshot)).toBe(before)
      expect(report.querySelector('button, input, select, details')).toBeNull()
    },
  )

  it.each(['de', 'en'] as const)(
    'keeps negative rental results, exact yield bases and sale states in %s',
    (language) => {
      const inputs = reportInputs()
      Object.assign(inputs.analysis, {
        propertyUse: 'rental-investment',
        monthlyNetColdRent: '600',
        monthlyNonRecoverableHausgeld: '150',
        monthlyReserveContribution: '50',
        annualMaintenanceAllowance: '1200',
        targetGrossYield: '4.5',
        targetNetYield: '3.5',
      })
      const snapshot = capturedReport(inputs, { language })
      render(<PropertyReport snapshot={snapshot} />)
      const report = screen.getByRole('article')
      const result = snapshot.properties[0]!.results.modeSpecific
      if (result.mode !== 'rental-investment' || result.result.status !== 'available')
        throw new Error('Rental result unavailable')
      expect(result.result.firstMonth.preTaxCashFlowAfterExtraCents).toBeLessThan(0)
      expect(report.textContent).toContain(
        reportFormat(language).money(result.result.firstMonth.preTaxCashFlowAfterExtraCents),
      )
      expect(report.textContent).toContain(
        reportFormat(language).money(result.result.grossYieldBasis.numeratorCents),
      )
      expect(report.textContent).toContain(
        reportFormat(language).money(result.result.grossYieldBasis.denominatorCents),
      )
      expect(report).toHaveTextContent(language === 'de' ? 'Nicht angefordert' : 'Not requested')
      expect(
        within(report).queryByRole('heading', {
          name: language === 'de' ? 'Mieten oder kaufen' : 'Rent versus buy',
        }),
      ).not.toBeInTheDocument()
      expect(report).not.toHaveTextContent(
        language === 'de' ? 'Aktuelle vergleichbare Miete' : 'Current comparable rent',
      )
    },
  )

  it('includes all 1,200 monthly rows and the exact final capped payment without explorer pagination', () => {
    const inputs = reportInputs()
    inputs.financing.nominalAnnualRate = '0'
    inputs.financing.initialRepaymentRate = '1'
    const snapshot = capturedReport(inputs, { language: 'en', includeMonthlyAppendix: true })
    const model = createReportAmortization(snapshot.properties[0]!)
    expect(model.annualPeriods).toHaveLength(100)
    expect(model.annualPeriods!.at(-1)!.totalPaymentCents).toBe(199604)
    const html = renderToStaticMarkup(<PropertyReport snapshot={snapshot} />)
    const monthly = html.slice(html.indexOf('<caption>Monthly appendix · Baseline · EUR</caption>'))
    expect([...monthly.matchAll(/<tr>/gu)]).toHaveLength(1201)
    expect(monthly).toContain('1,200')
    expect(monthly).toContain('€162.67')
    expect(monthly).not.toContain('Page ')
  })

  it('caps a month-1 payoff and labels debt tails without fabricating payment rows', () => {
    const inputs = reportInputs()
    inputs.financing.additionalRepayments.oneTimeAdditionalRepayments = [
      { amount: '500000', month: '1' },
    ]
    const snapshot = capturedReport(inputs)
    render(<PropertyReport snapshot={snapshot} />)
    const annual = screen.getByRole('table', { name: 'With additional repayments · EUR' })
    expect(within(annual).getAllByRole('row')).toHaveLength(2)
    expect(annual).toHaveTextContent('€199,666.66')
    expect(annual).toHaveTextContent('€200,583.33')
    expect(annual).toHaveTextContent('Partial year')
    expect(screen.getByRole('table', { name: 'Remaining-debt data · EUR' })).toHaveTextContent(
      'Already repaid; no further payments',
    )
    const payments = screen.getByRole('table', { name: 'Payment-composition data · EUR' })
    expect(within(payments).getAllByRole('row')).toHaveLength(31)
    expect(
      document.querySelectorAll('[data-report-payment-series="additional-repayments"]'),
    ).toHaveLength(1)
  })

  it('marks invalid selected plans incomplete and presents baseline results only as references', () => {
    const inputs = reportInputs()
    inputs.financing.additionalRepayments.oneTimeAdditionalRepayments = [
      { amount: '-5', month: '12' },
    ]
    const snapshot = capturedReport(inputs)
    expect(snapshot.status).toBe('incomplete')
    render(<PropertyReport snapshot={snapshot} />)
    expect(screen.getByRole('article')).toHaveTextContent(
      'Baseline reference only: the requested repayment plan is unavailable.',
    )
    expect(
      document.querySelectorAll('[data-report-debt-series="additional-repayments"]'),
    ).toHaveLength(0)
    expect(
      screen.queryByRole('table', { name: 'With additional repayments · EUR' }),
    ).not.toBeInTheDocument()
  })

  it('keeps cash purchases and incomplete sections explicit, without empty mortgage charts', () => {
    const inputs = reportInputs()
    inputs.financing.availableEquity = '266250'
    inputs.financing.downPayment = '250000'
    inputs.analysis.currentComparableRent = ''
    render(<PropertyReport snapshot={capturedReport(inputs)} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByRole('article')).toHaveTextContent(
      'Cash purchase: no mortgage payments or repayment charts apply.',
    )
    expect(screen.getByRole('article')).toHaveTextContent('Required inputs are missing.')
    expect(screen.getByRole('article')).not.toHaveTextContent('NaN')
  })

  it('reports real annual aggregation overflow while retaining safe monthly detail and debt data', () => {
    const inputs = reportInputs()
    inputs.purchaseCosts.purchasePrice = '80000000000000'
    inputs.financing.availableEquity = '5200000000000'
    inputs.financing.downPayment = '0'
    inputs.financing.nominalAnnualRate = '50'
    inputs.financing.initialRepaymentRate = '100'
    inputs.analysis.currentComparableRent = ''
    inputs.analysis.maximumMonthlyPayment = ''
    const snapshot = capturedReport(inputs, { language: 'en', includeMonthlyAppendix: true })
    const model = createReportAmortization(snapshot.properties[0]!)
    expect(model.schedules).toHaveLength(1)
    expect(model.annualPeriods).toBeNull()
    expect(model.paymentChart).toBeNull()
    const html = renderToStaticMarkup(<PropertyReport snapshot={snapshot} />)
    expect(html).toContain('Annual totals exceed the safe money range.')
    expect(html).toContain('Monthly appendix · Baseline · EUR')
    expect(html).toContain('Remaining-debt data')
    expect(html).not.toContain('NaN')
  })

  it('formats captured locales independently, preserving zero, negative, missing and invalid values', () => {
    expect(formatCapturedInput('250.000,25', 'money', 'de-DE', 'en')).toBe('€250,000.25')
    expect(formatCapturedInput('250,000.25', 'money', 'en-GB', 'de')).toBe('250.000,25 €')
    expect(formatCapturedInput('-25.50', 'money', 'canonical', 'en')).toBe('-€25.50')
    expect(formatCapturedInput('0', 'money', 'canonical', 'en')).toBe('€0')
    expect(formatCapturedInput('', 'money', 'canonical', 'en')).toBe('Not provided')
    expect(formatCapturedInput('NaN', 'money', 'canonical', 'de')).toBe('Ungültige Eingabe')
  })

  it('escapes opted-in plain-text names and refuses comparison snapshots', () => {
    const snapshot = capturedReport()
    const property = { ...snapshot.properties[0]!, name: '<img src=x onerror=alert(1)>' }
    const html = renderToStaticMarkup(
      <PropertyReport snapshot={{ ...snapshot, properties: [property] }} />,
    )
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<img ')
    expect(
      renderToStaticMarkup(<PropertyReport snapshot={{ ...snapshot, kind: 'comparison' }} />),
    ).toContain('Correct the required inputs')
  })
})

describe('report preview lifecycle', () => {
  it('freezes output language, clears changed options, closes and restores trigger focus', async () => {
    const user = userEvent.setup()
    const inputs = reportInputs()
    render(<PropertyReportPreview inputs={inputs} inputLocale="de-DE" language="de" />)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Berichtssprache' }), 'en')
    await user.click(screen.getByRole('button', { name: 'Immobilienbericht ansehen' }))
    expect(screen.getByRole('article')).toHaveAttribute('lang', 'en')
    expect(screen.getByRole('heading', { name: 'Berichtsvorschau' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Bericht schließen' }))
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Immobilienbericht ansehen' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Immobilienbericht ansehen' }))
    await user.click(
      screen.getByRole('checkbox', { name: 'Vollständigen monatlichen Anhang aufnehmen' }),
    )
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Immobilienbericht ansehen' }))
    expect(
      screen.getByRole('table', { name: 'Monthly appendix · Baseline · EUR' }),
    ).toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox'), 'de')
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('blocks an incomplete capture without displaying a partial report', async () => {
    const inputs = reportInputs()
    inputs.purchaseCosts.purchasePrice = ''
    render(<PropertyReportPreview inputs={inputs} inputLocale="de-DE" language="en" />)
    await userEvent.click(screen.getByRole('button', { name: 'View property report' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Correct the required inputs')
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })
})
