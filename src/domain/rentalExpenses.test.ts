import { describe, expect, it } from 'vitest'
import { calculateRentalExpenseBreakdown } from './rentalExpenses'

const sample = {
  collectedRentEuro: 12000,
  recoverableCostsEuro: 2160,
  nonrecoverableCostsEuro: 972,
  eligibleRepairsEuro: 480,
  wegReserveContributionEuro: 720,
  mortgageInterestEuro: 7000,
  mortgagePrincipalEuro: 2800,
  mortgagePaymentEuro: 9800,
  buildingAfaEuro: 3502.4,
  eligibleOneTimeMaintenanceEuro: 0,
}

describe('RENT-002: separate deductible rental expenses from cash financing', () => {
  it('does not deduct mortgage principal or WEG reserve contributions', () => {
    const r = calculateRentalExpenseBreakdown(sample)
    expect(r.deductibleOperatingEuro).toBe(3612)
    expect(r.annualRecurringTaxableEuro).toBeCloseTo(-2114.4, 2)
    expect(r.annualCashBeforeIncomeTaxEuro).toBe(-2132)
    expect(r.nonDeductiblePrincipalEuro).toBe(2800)
    expect(r.nonDeductibleReserveEuro).toBe(720)
  })

  it('does not deduct initial improvement cash unless explicitly classified as maintenance', () => {
    const r = calculateRentalExpenseBreakdown({
      ...sample,
      eligibleOneTimeMaintenanceEuro: 5000,
    })
    expect(r.annualRecurringTaxableEuro).toBeCloseTo(-2114.4, 2)
    expect(r.firstYearTaxableEuro).toBeCloseTo(-7114.4, 2)
    expect(r.annualCashBeforeIncomeTaxEuro).toBe(-2132)
  })

  it('interest reduces taxable income but principal only changes cash', () => {
    const withMorePrincipal = calculateRentalExpenseBreakdown({
      ...sample,
      mortgagePrincipalEuro: 3800,
      mortgagePaymentEuro: 10800,
    })
    const base = calculateRentalExpenseBreakdown(sample)
    expect(withMorePrincipal.annualRecurringTaxableEuro).toBe(base.annualRecurringTaxableEuro)
    expect(withMorePrincipal.annualCashBeforeIncomeTaxEuro).toBe(base.annualCashBeforeIncomeTaxEuro - 1000)
  })

  it('disallows unsupported negative amounts and inconsistent payment breakdowns', () => {
    expect(() => calculateRentalExpenseBreakdown({
      ...sample, wegReserveContributionEuro: -5,
    })).toThrow()
    expect(() => calculateRentalExpenseBreakdown({
      ...sample, mortgagePaymentEuro: 9000,
    })).toThrow()
  })
})
