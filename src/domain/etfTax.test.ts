import { describe, expect, it } from 'vitest'
import {
  calculateAdvanceTax,
  calculateFifoSale,
  privateFundTaxableShare,
} from './etfTax'

describe('ETF-001: explicit year-based German Vorabpauschale primitives', () => {
  const base = {
    taxYear: 2026,
    basisInterestRate: 0.032,
    units: 100,
    openingPriceEuro: 100,
    closingPriceEuro: 110,
    distributionsEuro: 0,
    category: 'equity' as const,
  }
  it('uses verified 2026 3.20% basis rate and 30% equity partial exemption', () => {
    const result = calculateAdvanceTax(base)
    expect(result.basicYieldEuro).toBe(224)
    expect(result.advanceAmountEuro).toBe(224)
    expect(result.taxableAdvanceEuro).toBe(156.8)
    expect(result.deemedReceiptTaxYear).toBe(2027)
  })
  it('caps advance by actual annual market gain plus distributions', () => {
    expect(calculateAdvanceTax({ ...base, closingPriceEuro: 101 }).advanceAmountEuro).toBe(
      100,
    )
    expect(calculateAdvanceTax({ ...base, closingPriceEuro: 90 }).advanceAmountEuro).toBe(0)
  })
  it('subtracts distributions before tax and never creates negative advances', () => {
    expect(calculateAdvanceTax({ ...base, distributionsEuro: 100 }).advanceAmountEuro).toBe(
      124,
    )
    expect(calculateAdvanceTax({ ...base, distributionsEuro: 500 }).advanceAmountEuro).toBe(0)
  })
  it('prorates by full preceding months in acquisition year', () => {
    expect(calculateAdvanceTax({ ...base, acquisitionMonth: 7 }).advanceAmountEuro).toBe(112)
    expect(calculateAdvanceTax({ ...base, acquisitionMonth: 12 }).advanceAmountEuro).toBe(
      18.67,
    )
  })
  it('uses applicable partial exemption for equity, mixed and other funds', () => {
    expect(privateFundTaxableShare('equity')).toBe(0.7)
    expect(privateFundTaxableShare('mixed')).toBe(0.85)
    expect(privateFundTaxableShare('other')).toBe(1)
  })
  it('rejects invalid or missing basis interest and acquisitions', () => {
    expect(() =>
      calculateAdvanceTax({ ...base, basisInterestRate: Number.NaN }),
    ).toThrow()
    expect(() => calculateAdvanceTax({ ...base, acquisitionMonth: 0 })).toThrow()
    expect(() => calculateAdvanceTax({ ...base, units: -1 })).toThrow()
  })
})

describe('ETF-002: FIFO sale and previously taxed advance offsets', () => {
  const base = {
    lotsOldestFirst: [
      {
        lotId: '2024',
        units: 10,
        purchasePricePerUnitEuro: 100,
        previousAdvancePerUnitEuro: 4,
      },
      {
        lotId: '2025',
        units: 10,
        purchasePricePerUnitEuro: 120,
        previousAdvancePerUnitEuro: 2,
      },
    ],
    soldUnits: 15,
    salePricePerUnitEuro: 150,
    saleCostsEuro: 0,
    category: 'equity' as const,
  }
  it('sells FIFO and preserves purchase basis of remaining shares', () => {
    const r = calculateFifoSale(base)
    expect(r.lines.map((line) => [line.lotId, line.units])).toEqual([
      ['2024', 10],
      ['2025', 5],
    ])
    expect(r.totalProceedsEuro).toBe(2250)
    expect(r.totalCostBasisEuro).toBe(1600)
    expect(r.totalAdvanceOffsetEuro).toBe(50)
    expect(r.gainBeforePartialExemptionEuro).toBe(600)
    expect(r.taxableGainEuro).toBe(420)
    expect(r.remainingLots).toEqual([
      {
        lotId: '2025',
        units: 5,
        purchasePricePerUnitEuro: 120,
        previousAdvancePerUnitEuro: 2,
      },
    ])
  })
  it('uses actual costs and only reduces gain once for previously assessed advances', () => {
    const r = calculateFifoSale({ ...base, saleCostsEuro: 30 })
    expect(r.gainBeforePartialExemptionEuro).toBe(570)
    expect(r.taxableGainEuro).toBe(399)
  })
  it('keeps losses signed instead of treating them as taxable gains', () => {
    const r = calculateFifoSale({ ...base, salePricePerUnitEuro: 80 })
    expect(r.taxableGainEuro).toBeLessThan(0)
  })
  it('makes an empty sale leave lots untouched', () => {
    const r = calculateFifoSale({ ...base, soldUnits: 0 })
    expect(r.remainingLots).toEqual(base.lotsOldestFirst)
    expect(r.totalProceedsEuro).toBe(0)
  })
  it('rejects overselling, invalid amounts and duplicate lot IDs', () => {
    expect(() => calculateFifoSale({ ...base, soldUnits: 21 })).toThrow()
    expect(() => calculateFifoSale({ ...base, saleCostsEuro: -1 })).toThrow()
    expect(() =>
      calculateFifoSale({
        ...base,
        lotsOldestFirst: [base.lotsOldestFirst[0], base.lotsOldestFirst[0]],
      }),
    ).toThrow()
  })
})
