import { describe, expect, it } from 'vitest'
import { projectAfterTaxETF } from './etfProjection'

const baseline = {
  startYear: 2026,
  years: 1,
  category: 'equity' as const,
  initialValueEuro: 10000,
  initialCostBasisEuro: 10000,
  annualContributionEuro: 0,
  annualReturns: [0.1],
  annualBasisRates: [0.032],
  annualDistributionsEuro: [0],
  annualRemainingAllowancesEuro: [0],
}

describe('ETF-002 after-tax comparison ledger', () => {
  it('separates market value, advance-tax cash and liquidation value', () => {
    const [row] = projectAfterTaxETF(baseline)
    expect(row.valueBeforeSaleEuro).toBe(11000)
    expect(row.advanceEuro).toBe(224)
    expect(row.advanceTaxEuro).toBe(41.36)
    expect(row.hypotheticalSaleTaxEuro).toBe(143.26)
    expect(row.liquidationValueEuro).toBeCloseTo(10815.38, 2)
  })

  it('does not reuse the full allowance for advance and sale', () => {
    const [row] = projectAfterTaxETF({
      ...baseline,
      annualRemainingAllowancesEuro: [150],
    })
    expect(row.advanceTaxEuro).toBe(1.79)
    expect(row.hypotheticalSaleTaxEuro).toBe(143.26)
  })

  it('does not retrospectively tax end-of-year contributions', () => {
    const [row] = projectAfterTaxETF({
      ...baseline,
      annualContributionEuro: 1000,
    })
    expect(row.valueBeforeSaleEuro).toBe(12000)
    expect(row.investedCostEuro).toBe(11000)
    expect(row.advanceEuro).toBe(224)
  })

  it('requires externally supplied future tax basis rates', () => {
    expect(() =>
      projectAfterTaxETF({
        ...baseline,
        years: 2,
      }),
    ).toThrow('per year')
  })

  it('does not create tax on a portfolio with losses', () => {
    const [row] = projectAfterTaxETF({
      ...baseline,
      annualReturns: [-0.15],
    })
    expect(row.advanceEuro).toBe(0)
    expect(row.hypotheticalSaleTaxEuro).toBe(0)
    expect(row.liquidationValueEuro).toBe(8500)
  })

  it('rejects inconsistent accounting inputs', () => {
    expect(() =>
      projectAfterTaxETF({
        ...baseline,
        initialCostBasisEuro: 12000,
      }),
    ).toThrow('Invalid initial')
  })
})
