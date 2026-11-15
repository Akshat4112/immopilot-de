import { describe, expect, it } from 'vitest'
import { BASIS_RATE_BY_YEAR, calculateAdvanceTax, calculateDisposalTax } from './etfTax'

const base = {
  year: 2026,
  category: 'equity' as const,
  startOfYearValueEuro: 10000,
  endOfYearValueEuro: 11000,
  distributionsEuro: 0,
  acquisitionMonth: 1,
  remainingAllowanceEuro: 0,
}

describe('ETF-001: German investment-fund taxes for private investors', () => {
  it('uses the published 2026 BMF basis rate and 2027 tax receipt', () => {
    expect(BASIS_RATE_BY_YEAR[2026]).toBe(0.032)
    const result = calculateAdvanceTax(base)
    expect(result.deemedReceiptDate).toBe('2027-01-04')
    expect(result.baseReturnEuro).toBe(224)
    expect(result.advancePaymentEuro).toBe(224)
    expect(result.taxableAdvanceEuro).toBe(156.8)
    expect(result.estimatedTaxEuro).toBe(41.36)
  })

  it('caps the advance by actual fund appreciation plus distributions', () => {
    expect(calculateAdvanceTax({ ...base, endOfYearValueEuro: 10090 }).advancePaymentEuro).toBe(90)
    expect(calculateAdvanceTax({ ...base, endOfYearValueEuro: 9000 }).advancePaymentEuro).toBe(0)
  })

  it('subtracts distributions without ever making an advance negative', () => {
    expect(calculateAdvanceTax({
      ...base, distributionsEuro: 100, endOfYearValueEuro: 10900,
    }).advancePaymentEuro).toBe(124)
    expect(calculateAdvanceTax({
      ...base, distributionsEuro: 300, endOfYearValueEuro: 10700,
    }).advancePaymentEuro).toBe(0)
  })

  it('prorates purchases and handles remaining allowance without reusing it', () => {
    expect(calculateAdvanceTax({ ...base, acquisitionMonth: 7 }).advancePaymentEuro).toBe(112)
    expect(calculateAdvanceTax({ ...base, remainingAllowanceEuro: 200 }).estimatedTaxEuro).toBe(0)
    expect(calculateAdvanceTax({ ...base, remainingAllowanceEuro: 100 }).taxBaseEuro).toBe(56.8)
  })

  it('applies fund-specific partial exemption and excludes negative basis rates', () => {
    expect(calculateAdvanceTax({ ...base, category: 'mixed' }).taxableAdvanceEuro).toBe(190.4)
    expect(calculateAdvanceTax({ ...base, category: 'other' }).taxableAdvanceEuro).toBe(224)
    expect(calculateAdvanceTax({ ...base, annualBasisRate: -0.001 }).advancePaymentEuro).toBe(0)
  })

  it('requires known basis rate and rejects invalid tax parameters', () => {
    expect(() => calculateAdvanceTax({ ...base, year: 2027 })).toThrow('verified')
    expect(() => calculateAdvanceTax({ ...base, acquisitionMonth: 0 })).toThrow()
    expect(() => calculateAdvanceTax({ ...base, remainingAllowanceEuro: -1 })).toThrow()
    expect(() => calculateAdvanceTax({ ...base, category: 'unsupported' as 'equity' })).toThrow()
  })

  it('deducts historical assessed advances before exemption on sale', () => {
    const result = calculateDisposalTax({
      category: 'equity', saleProceedsEuro: 15000, purchaseCostEuro: 10000,
      historicalAssessedAdvanceEuro: 400, remainingAllowanceEuro: 1000,
    })
    expect(result.adjustedGainEuro).toBe(4600)
    expect(result.taxableGainEuro).toBe(3220)
    expect(result.taxBaseEuro).toBe(2220)
    expect(result.estimatedTaxEuro).toBe(585.53)
  })

  it('does not manufacture a refund for a loss or excess historical advances', () => {
    const result = calculateDisposalTax({
      category: 'equity', saleProceedsEuro: 9000, purchaseCostEuro: 10000,
      historicalAssessedAdvanceEuro: 300, remainingAllowanceEuro: 0,
    })
    expect(result.estimatedTaxEuro).toBe(0)
    expect(result.lossForSeparateTreatmentEuro).toBe(1300)
  })
})
