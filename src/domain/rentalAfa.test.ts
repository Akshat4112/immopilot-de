import { describe, expect, it } from 'vitest'
import { calculateRentalBuildingAfa, linearResidentialAfaRate } from './rentalAfa'

const base = {
  purchasePriceEuro: 199000,
  acquisitionCostsEuro: 19900,
  buildingSharePercent: 80,
  completionYear: 1992,
  eligibleFromDate: '2026-01-01',
  taxYear: 2026,
  rentalUsePercent: 100,
}

describe('RENT-001: Residential rental building AfA under §7(4) EStG', () => {
  it.each([
    { completionYear: 1924, rate: 2.5 },
    { completionYear: 1925, rate: 2 },
    { completionYear: 2022, rate: 2 },
    { completionYear: 2023, rate: 3 },
    { completionYear: 2026, rate: 3 },
  ])('uses $rate% for building completed in $completionYear', ({ completionYear, rate }) => {
    expect(linearResidentialAfaRate(completionYear)).toBe(rate)
  })

  it('allocates acquisition costs to building and excludes land from depreciation', () => {
    const result = calculateRentalBuildingAfa(base)
    expect(result.totalAcquisitionCostEuro).toBe(218900)
    expect(result.depreciableBuildingBasisEuro).toBe(175120)
    expect(result.landAndOtherBasisEuro).toBe(43780)
    expect(result.fullYearAfaEuro).toBe(3502.4)
    expect(result.qualifyingMonths).toBe(12)
    expect(result.taxYearAfaEuro).toBe(3502.4)
  })

  it('prorates first eligible year by calendar month, inclusive of start month', () => {
    const result = calculateRentalBuildingAfa({ ...base, eligibleFromDate: '2026-03-21' })
    expect(result.qualifyingMonths).toBe(10)
    expect(result.taxYearAfaEuro).toBe(2918.67)
  })

  it('is zero before eligibility and full rate in subsequent years', () => {
    expect(
      calculateRentalBuildingAfa({
        ...base,
        eligibleFromDate: '2027-11-01',
        taxYear: 2026,
      }).taxYearAfaEuro,
    ).toBe(0)
    expect(
      calculateRentalBuildingAfa({
        ...base,
        eligibleFromDate: '2026-11-01',
        taxYear: 2027,
      }).taxYearAfaEuro,
    ).toBe(3502.4)
  })

  it('depreciates only the rental-use fraction, never the owner-occupied fraction', () => {
    const result = calculateRentalBuildingAfa({ ...base, rentalUsePercent: 50 })
    expect(result.rentalBuildingBasisEuro).toBe(87560)
    expect(result.taxYearAfaEuro).toBe(1751.2)
  })

  it('does not depend on purchase year for the historical building rate', () => {
    const result = calculateRentalBuildingAfa({
      ...base,
      eligibleFromDate: '2030-01-01',
      taxYear: 2030,
    })
    expect(result.annualRatePercent).toBe(2)
  })

  it('caps accumulated depreciation to the rental building basis in later years', () => {
    const result = calculateRentalBuildingAfa({ ...base, taxYear: 2080 })
    expect(result.taxYearAfaEuro).toBe(0)
  })

  it('rejects invalid dates, invalid allocations and buildings not ready for use', () => {
    expect(() => calculateRentalBuildingAfa({ ...base, eligibleFromDate: '2026-02-30' })).toThrow()
    expect(() => calculateRentalBuildingAfa({ ...base, buildingSharePercent: 110 })).toThrow()
    expect(() => calculateRentalBuildingAfa({ ...base, purchasePriceEuro: -1 })).toThrow()
    expect(() =>
      calculateRentalBuildingAfa({
        ...base,
        completionYear: 2028,
        eligibleFromDate: '2026-01-01',
      }),
    ).toThrow()
  })
})
