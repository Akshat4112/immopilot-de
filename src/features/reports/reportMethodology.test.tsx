import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import assumptionSet from '../../../data/assumptions/de-2026.09.json'
import { createSavedScenario } from '../../storage'
import { capturedReport, reportInputs } from '../../test/reportFixtures'
import { ComparisonReport } from './ComparisonReport'
import { PropertyReport } from './PropertyReport'
import { captureComparisonReport } from './reportSnapshot'

describe('PF-006.5 methodology and provenance disclosures', () => {
  it.each(['en', 'de'] as const)(
    'shows frozen, independently dated source and methodology evidence in %s',
    (language) => {
      const captured = capturedReport(reportInputs(), {
        language,
        generatedAt: '2026-10-26T11:00:00Z',
      })
      const source = captured.properties[0]!.provenance.sources[0]!
      render(<PropertyReport snapshot={captured} />)
      const article = screen.getByRole('article')
      const text = article.textContent ?? ''
      expect(text).toContain(assumptionSet.assumptionSetVersion)
      expect(text).toContain(assumptionSet.calculationSpecificationVersion)
      expect(text).toContain(assumptionSet.schemaVersion)
      expect(text).toContain(assumptionSet.verifiedOn)
      expect(text).toContain(assumptionSet.transferTax.rateSourceDate)
      expect(text).toContain(assumptionSet.transferTax.states[0]!.effectiveFrom)
      expect(text).toContain(source.publisher)
      expect(text).toContain(source.verifiedOn)
      expect(text).toContain(source.sourceDate!)
      expect(text).toContain(
        language === 'de'
          ? 'Quellen behalten ihre dokumentierten Prüfdaten'
          : 'Sources retain their recorded verification dates',
      )
      expect(text).toContain(
        language === 'de'
          ? 'Standardwerte der Kaufnebenkosten sind Planungsannahmen'
          : 'Acquisition cost defaults are planning estimates',
      )
      expect(text).toContain(
        language === 'de'
          ? 'Projektionen sind keine Kreditzusagen'
          : 'projections are not lender commitments',
      )
      expect(text).toContain(language === 'de' ? 'Quelldatum' : 'Source date')
      // The report timestamp never replaces the versioned source verification date.
      expect(captured.generatedAt).toContain('2026-10-26')
      expect(source.verifiedOn).not.toBe('2026-10-26')
    },
  )

  it('distinguishes repayment wholly inside fixation from post-fixation extrapolation', () => {
    const early = reportInputs()
    early.financing.initialRepaymentRate = '20'
    early.financing.fixedInterestYears = '15'
    const paidOff = capturedReport(early)
    const schedule = paidOff.properties[0]!.results.amortization
    expect(schedule.status).toBe('available')
    if (schedule.status !== 'available') throw new Error('Missing schedule')
    expect(schedule.payoffMonth).toBeLessThan(schedule.fixedInterestMonths)
    const { unmount } = render(<PropertyReport snapshot={paidOff} />)
    const inside = screen.getByRole('article')
    expect(inside).toHaveTextContent(
      'Mortgage schedule ends within the fixed-interest period; no post-fixation rate is assumed.',
    )
    expect(inside).not.toHaveTextContent(
      'Projection beyond the fixed-interest period assumes the initial nominal rate remains unchanged.',
    )
    unmount()

    const longer = capturedReport(reportInputs())
    const projected = longer.properties[0]!.results.amortization
    expect(projected.status).toBe('available')
    if (projected.status !== 'available') throw new Error('Missing projected schedule')
    expect(projected.payoffMonth).toBeGreaterThan(projected.fixedInterestMonths)
    render(<PropertyReport snapshot={longer} />)
    expect(screen.getByRole('article')).toHaveTextContent(
      'Projection beyond the fixed-interest period assumes the initial nominal rate remains unchanged.',
    )
  })

  it('discloses each property state effective date independently in a comparison', () => {
    const bw = createSavedScenario('BW', reportInputs(), { id: 'bw' })
    const bavarianInputs = reportInputs()
    bavarianInputs.purchaseCosts.stateId = 'DE-BY'
    const by = createSavedScenario('BY', bavarianInputs, { id: 'by' })
    const capture = captureComparisonReport(
      { documents: [bw, by], selectedIds: ['by', 'bw'] },
      { language: 'en', generatedAt: '2026-10-26T11:00:00Z' },
    )
    expect(capture.status).toBe('captured')
    if (capture.status !== 'captured') throw new Error('Comparison blocked')
    render(<ComparisonReport snapshot={capture.snapshot} />)
    const articles = screen.getAllByRole('article')
    const report = articles.find((article) => article.classList.contains('comparison-report'))
    expect(report).toBeDefined()
    expect(capture.snapshot.properties.map((property) => property.ordinal)).toEqual([1, 2])
    expect(
      capture.snapshot.properties.map((property) => property.provenance.stateTaxEffectiveFrom),
    ).toEqual(['1998-01-01', '2011-11-05'])
    const properties = within(report!).getAllByRole('article')
    expect(properties[0]).toHaveTextContent('1998-01-01')
    expect(properties[1]).toHaveTextContent('2011-11-05')
  })

  it('labels rental performance as pre-tax without claiming personal tax effects', () => {
    const inputs = reportInputs()
    Object.assign(inputs.analysis, {
      propertyUse: 'rental-investment',
      monthlyNetColdRent: '650',
      monthlyNonRecoverableHausgeld: '120',
      monthlyReserveContribution: '40',
    })
    render(<PropertyReport snapshot={capturedReport(inputs)} />)
    const text = screen.getByRole('article').textContent ?? ''
    expect(text).toContain('Rental performance before tax')
    expect(text).toContain('Personal taxes and tax savings are not modeled.')
    expect(text).toContain('Purchase-price denominator')
    expect(text).toContain('Investment cost denominator')
  })
})
