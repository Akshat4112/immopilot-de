import { describe, expect, it } from 'vitest'
import { calculateAdvanceTax, calculateFifoSale, privateFundTaxableShare } from './etfTax'

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
    expect(calculateAdvanceTax({ ...base, closingPriceEuro: 101 }).advanceAmountEuro).toBe(100)
    expect(calculateAdvanceTax({ ...base, closingPriceEuro: 90 }).advanceAmountEuro).toBe(0)
  })
  it('subtracts distributions before tax and never creates negative advances', () => {
    expect(calculateAdvanceTax({ ...base, distributionsEuro: 100 }).advanceAmountEuro).toBe(124)
    expect(calculateAdvanceTax({ ...base, distributionsEuro: 500 }).advanceAmountEuro).toBe(0)
  })
  it('prorates by full preceding months in acquisition year', () => {
    expect(calculateAdvanceTax({ ...base, acquisitionMonth: 7 }).advanceAmountEuro).toBe(112)
    expect(calculateAdvanceTax({ ...base, acquisitionMonth: 12 }).advanceAmountEuro).toBe(18.67)
  })
  it('does not invent an advance for an explicitly supplied zero basis rate', () => {
    const result = calculateAdvanceTax({ ...base, basisInterestRate: 0 })
    expect(result.basicYieldEuro).toBe(0)
    expect(result.advanceAmountEuro).toBe(0)
    expect(result.taxableAdvanceEuro).toBe(0)
  })
  it('does not assess an advance when distributions exceed the capped yield', () => {
    const result = calculateAdvanceTax({
      ...base,
      closingPriceEuro: 101,
      distributionsEuro: 250,
    })
    expect(result.cappedBasicYieldEuro).toBe(224)
    expect(result.advanceAmountEuro).toBe(0)
    expect(result.taxableAdvanceEuro).toBe(0)
  })
  it('caps a falling-price fund with distributions at its total annual return', () => {
    const result = calculateAdvanceTax({
      ...base,
      closingPriceEuro: 99,
      distributionsEuro: 150,
    })
    expect(result.basicYieldEuro).toBe(224)
    expect(result.cappedBasicYieldEuro).toBe(50)
    expect(result.advanceAmountEuro).toBe(0)
    expect(result.taxableAdvanceEuro).toBe(0)
  })
  it('applies full-year January acquisition and December one-month proration', () => {
    const january = calculateAdvanceTax({ ...base, acquisitionMonth: 1 })
    const december = calculateAdvanceTax({ ...base, acquisitionMonth: 12 })
    expect(january.advanceAmountEuro).toBe(224)
    expect(december.advanceAmountEuro).toBe(18.67)
    expect(december.taxableAdvanceEuro).toBe(13.07)
  })
  it('keeps the pretax advance unchanged across fund partial-exemption categories', () => {
    const equity = calculateAdvanceTax(base)
    const mixed = calculateAdvanceTax({ ...base, category: 'mixed' })
    const other = calculateAdvanceTax({ ...base, category: 'other' })
    expect([equity.advanceAmountEuro, mixed.advanceAmountEuro, other.advanceAmountEuro]).toEqual([
      224, 224, 224,
    ])
    expect(mixed.taxableAdvanceEuro).toBe(190.4)
    expect(other.taxableAdvanceEuro).toBe(224)
  })
  it('uses applicable partial exemption for equity, mixed and other funds', () => {
    expect(privateFundTaxableShare('equity')).toBe(0.7)
    expect(privateFundTaxableShare('mixed')).toBe(0.85)
    expect(privateFundTaxableShare('other')).toBe(1)
  })
  it('rejects invalid or missing basis interest and acquisitions', () => {
    expect(() => calculateAdvanceTax({ ...base, basisInterestRate: Number.NaN })).toThrow()
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
  it('rejects sale fees without any sold units', () => {
    expect(() => calculateFifoSale({ ...base, soldUnits: 0, saleCostsEuro: 5 })).toThrow(
      'Sale costs require sold units',
    )
  })
  it('applies mixed-fund exemption to gains after FIFO offsets', () => {
    const result = calculateFifoSale({ ...base, category: 'mixed' })
    expect(result.gainBeforePartialExemptionEuro).toBe(600)
    expect(result.taxableGainEuro).toBe(510)
  })
  it('preserves advance offsets on remaining FIFO units across sequential sales', () => {
    const first = calculateFifoSale({ ...base, soldUnits: 12 })
    expect(first.totalAdvanceOffsetEuro).toBe(44)
    expect(first.remainingLots).toEqual([
      {
        lotId: '2025',
        units: 8,
        purchasePricePerUnitEuro: 120,
        previousAdvancePerUnitEuro: 2,
      },
    ])
    const second = calculateFifoSale({
      ...base,
      lotsOldestFirst: first.remainingLots,
      soldUnits: 8,
    })
    expect(second.totalAdvanceOffsetEuro).toBe(16)
    expect(second.remainingLots).toEqual([])
    expect(first.totalAdvanceOffsetEuro + second.totalAdvanceOffsetEuro).toBe(60)
  })
  it('rejects overselling, invalid amounts and duplicate lot IDs', () => {
    expect(() => calculateFifoSale({ ...base, soldUnits: 21 })).toThrow()
    expect(() => calculateFifoSale({ ...base, saleCostsEuro: -1 })).toThrow()
    expect(() =>
      calculateFifoSale({
        ...base,
        lotsOldestFirst: base.lotsOldestFirst.flatMap((lot) =>
          lot.lotId === '2024' ? [lot, lot] : [],
        ),
      }),
    ).toThrow()
  })
})
