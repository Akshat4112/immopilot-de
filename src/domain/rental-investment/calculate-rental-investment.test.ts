import { describe, expect, it } from 'vitest'

import { moneyCents } from '../shared'
import type { RentalInvestmentInput } from './types'
import { calculateRentalInvestment } from './calculate-rental-investment'

function example(overrides: Partial<RentalInvestmentInput> = {}): RentalInvestmentInput {
  const zero = moneyCents(0)
  return {
    financing: {
      status: 'available',
      fundingStatus: 'funded',
      cashGapCents: zero,
      purchasePriceCents: moneyCents(2_000),
      totalProjectCostCents: moneyCents(2_000),
      requiredEquityCents: moneyCents(1_000),
      loanAmountCents: moneyCents(1_000),
    } as unknown as RentalInvestmentInput['financing'],
    amortization: {
      status: 'available',
      cashPurchase: false,
      principalCents: moneyCents(1_000),
      fixedInterestMonths: 12,
      payoffMonth: 2,
      rows: [
        {
          month: 1,
          regularPaymentCents: moneyCents(500),
          additionalPrincipalCents: zero,
          closingBalanceCents: moneyCents(500),
        },
        {
          month: 2,
          regularPaymentCents: moneyCents(500),
          additionalPrincipalCents: zero,
          closingBalanceCents: zero,
        },
      ],
    } as unknown as RentalInvestmentInput['amortization'],
    monthlyNetColdRentCents: 1_000,
    vacancyRate: 0,
    otherAnnualRentLossCents: 0,
    monthlyNonRecoverableHausgeldExcludingReserveCents: 100,
    monthlyReserveContributionCents: 50,
    annualMaintenanceAllowanceOutsideHausgeldCents: 600,
    otherAnnualOwnerCostsCents: 0,
    rentGrowthRate: 0,
    ownerCostGrowthRate: 0,
    holdingPeriodMonths: 3,
    ...overrides,
  }
}

describe('rental-investment operating and financing metrics', () => {
  it('separates gross/net yields and operating cost categories from mortgage payments', () => {
    const result = calculateRentalInvestment(example())
    if (result.status !== 'available') throw new Error(result.reason)
    expect(result).toMatchObject({
      annualNetColdRentCents: 12_000,
      effectiveAnnualRentCents: 12_000,
      annualOwnerCostsCents: 2_400,
      netOperatingIncomeCents: 9_600,
      grossYieldBasis: { numeratorCents: 12_000, denominatorCents: 2_000 },
      netYieldBasis: { numeratorCents: 9_600, denominatorCents: 2_000 },
      firstYearPreTaxCashFlowBeforeExtraCents: 8_600,
      firstYearPreTaxCashFlowAfterExtraCents: 8_600,
      debtReductionAfterHoldingPeriodCents: 1_000,
      remainingDebtAfterHoldingPeriodCents: 0,
      cumulativeCashFlowAfterHoldingPeriodCents: 1_400,
      sale: { status: 'not-requested' },
    })
    expect(result.grossRentalYield.toNumber()).toBe(6)
    expect(result.netRentalYield.toNumber()).toBe(4.8)
    expect(
      result.cashOnCash.status === 'available'
        ? result.cashOnCash.annualBeforeExtraReturn.toNumber()
        : null,
    ).toBe(8.6)
    expect(result.rows[0]).toMatchObject({
      effectiveRentCents: 1_000,
      ownerCostsCents: 200,
      regularMortgagePaymentCents: 500,
      preTaxCashFlowBeforeExtraCents: 300,
      remainingDebtCents: 500,
    })
    expect(result.rows[2]).toMatchObject({
      regularMortgagePaymentCents: 0,
      preTaxCashFlowBeforeExtraCents: 800,
      remainingDebtCents: 0,
    })
    expect(result.rows).toHaveLength(12) // current-year summary even for a shorter holding period
  })

  it('treats modeled Sondertilgung as cash after extra, not operating performance', () => {
    const base = example()
    if (base.amortization.status !== 'available') throw new Error('Expected schedule')
    const rows = base.amortization.rows.map((row) => ({ ...row }))
    rows[0] = {
      ...rows[0]!,
      additionalPrincipalCents: moneyCents(100),
      closingBalanceCents: moneyCents(400),
    }
    rows[1] = { ...rows[1]!, regularPaymentCents: moneyCents(400) }
    const result = calculateRentalInvestment(
      example({
        amortization: { ...base.amortization, rows } as RentalInvestmentInput['amortization'],
      }),
    )
    if (result.status !== 'available') throw new Error(result.reason)
    expect(result.rows[0]).toMatchObject({
      preTaxCashFlowBeforeExtraCents: 300,
      additionalRepaymentCents: 100,
      preTaxCashFlowAfterExtraCents: 200,
      remainingDebtCents: 400,
    })
    expect(
      result.firstYearPreTaxCashFlowBeforeExtraCents -
        result.firstYearPreTaxCashFlowAfterExtraCents,
    ).toBe(100)
    expect(result.cashOnCash.status === 'available' ? result.cashOnCash.numeratorCents : null).toBe(
      result.firstYearPreTaxCashFlowBeforeExtraCents,
    )
    expect(result.debtReductionAfterHoldingPeriodCents).toBe(1_000)
  })

  it('offers a sale scenario with one-time subtraction of remaining debt and equity', () => {
    const result = calculateRentalInvestment(
      example({
        propertyAppreciationRate: 0,
        sellingCostRate: 0.2,
      }),
    )
    if (result.status !== 'available') throw new Error(result.reason)
    expect(result.sale).toMatchObject({
      status: 'available',
      projectedSalePriceCents: 2_000,
      sellingCostsCents: 400,
      propertyEquityCents: 2_000,
      netSaleProceedsCents: 1_600,
      cumulativeCashFlowCents: 1_400,
      estimatedProfitBeforeTaxCents: 2_000,
    })
  })

  it('keeps operating metrics available when cash-on-cash has no equity denominator', () => {
    const base = example()
    const result = calculateRentalInvestment(
      example({
        financing: {
          ...base.financing,
          requiredEquityCents: moneyCents(0),
        } as RentalInvestmentInput['financing'],
      }),
    )
    if (result.status !== 'available') throw new Error(result.reason)
    expect(result.cashOnCash).toMatchObject({
      status: 'unavailable',
      reason: 'ZERO_REQUIRED_EQUITY',
    })
    expect(result.netOperatingIncomeCents).toBe(9_600)
  })

  it('supports cash purchases without inventing mortgage payments', () => {
    const base = example()
    const result = calculateRentalInvestment(
      example({
        financing: {
          ...base.financing,
          loanAmountCents: moneyCents(0),
          requiredEquityCents: moneyCents(2_000),
        } as RentalInvestmentInput['financing'],
        amortization: {
          status: 'available',
          cashPurchase: true,
          principalCents: moneyCents(0),
          payoffMonth: 0,
          fixedInterestMonths: null,
          rows: [],
        } as unknown as RentalInvestmentInput['amortization'],
      }),
    )
    if (result.status !== 'available') throw new Error(result.reason)
    expect(result.mortgageProjectionAssumption).toBe('cash-purchase')
    expect(result.firstMonth).toMatchObject({
      regularMortgagePaymentCents: 0,
      preTaxCashFlowBeforeExtraCents: 800,
    })
    expect(result.remainingDebtAfterHoldingPeriodCents).toBe(0)
  })

  it('does not label a loan paid off before Zinsbindung as a post-period rate projection', () => {
    const result = calculateRentalInvestment(example({ holdingPeriodMonths: 18 }))
    if (result.status !== 'available') throw new Error(result.reason)
    expect(result.mortgageProjectionAssumption).toBe('within-fixed-period-or-paid-off')
  })

  it('projects rent/owner growth monthly while retaining cent-rounded monthly cash flow', () => {
    const result = calculateRentalInvestment(
      example({ rentGrowthRate: 0.12, ownerCostGrowthRate: 0.05 }),
    )
    if (result.status !== 'available') throw new Error(result.reason)
    expect(result.rows[1]!.effectiveRentCents).toBeGreaterThan(result.rows[0]!.effectiveRentCents)
    expect(result.rows[1]!.ownerCostsCents).toBeGreaterThan(result.rows[0]!.ownerCostsCents)
    expect(Number.isInteger(result.rows[1]!.preTaxCashFlowBeforeExtraCents)).toBe(true)
  })

  it.each([
    [{ holdingPeriodMonths: 0 }, 'holdingPeriodMonths', 'OUT_OF_RANGE'],
    [{ holdingPeriodMonths: 1201 }, 'holdingPeriodMonths', 'OUT_OF_RANGE'],
    [{ holdingPeriodMonths: 2.5 }, 'holdingPeriodMonths', 'NOT_INTEGER'],
    [{ monthlyNetColdRentCents: -1 }, 'monthlyNetColdRentCents', 'OUT_OF_RANGE'],
    [{ vacancyRate: 1.1 }, 'vacancyRate', 'OUT_OF_RANGE'],
    [{ otherAnnualRentLossCents: 12_001 }, 'otherAnnualRentLossCents', 'OUT_OF_RANGE'],
    [
      { monthlyNonRecoverableHausgeldExcludingReserveCents: -1 },
      'monthlyNonRecoverableHausgeldExcludingReserveCents',
      'OUT_OF_RANGE',
    ],
    [{ monthlyReserveContributionCents: -1 }, 'monthlyReserveContributionCents', 'OUT_OF_RANGE'],
    [
      { annualMaintenanceAllowanceOutsideHausgeldCents: -1 },
      'annualMaintenanceAllowanceOutsideHausgeldCents',
      'OUT_OF_RANGE',
    ],
    [{ otherAnnualOwnerCostsCents: -1 }, 'otherAnnualOwnerCostsCents', 'OUT_OF_RANGE'],
    [{ rentGrowthRate: -1 }, 'rentGrowthRate', 'OUT_OF_RANGE'],
    [{ ownerCostGrowthRate: -1 }, 'ownerCostGrowthRate', 'OUT_OF_RANGE'],
    [
      { propertyAppreciationRate: -1, sellingCostRate: 0 },
      'propertyAppreciationRate',
      'OUT_OF_RANGE',
    ],
    [{ propertyAppreciationRate: 0, sellingCostRate: 1.1 }, 'sellingCostRate', 'OUT_OF_RANGE'],
    [{ propertyAppreciationRate: 0 }, 'sellingCostRate', 'REQUIRED'],
    [{ sellingCostRate: 0 }, 'propertyAppreciationRate', 'REQUIRED'],
  ] as const)('returns stable validation for %o', (overrides, field, code) => {
    expect(
      calculateRentalInvestment(example(overrides as Partial<RentalInvestmentInput>)),
    ).toMatchObject({
      status: 'unavailable',
      reason: 'VALIDATION_ERROR',
      error: { field, code },
    })
  })

  it('propagates upstream failures, underfunding, principal mismatch and incomplete rows', () => {
    const base = example()
    expect(
      calculateRentalInvestment(
        example({
          financing: {
            status: 'unavailable',
            reason: 'VALIDATION_ERROR',
          } as RentalInvestmentInput['financing'],
        }),
      ),
    ).toMatchObject({ status: 'unavailable', reason: 'FINANCING_UNAVAILABLE' })
    expect(
      calculateRentalInvestment(
        example({
          amortization: {
            status: 'unavailable',
            reason: 'VALIDATION_ERROR',
          } as RentalInvestmentInput['amortization'],
        }),
      ),
    ).toMatchObject({ status: 'unavailable', reason: 'AMORTIZATION_UNAVAILABLE' })
    expect(
      calculateRentalInvestment(
        example({
          financing: {
            ...base.financing,
            fundingStatus: 'underfunded',
            cashGapCents: moneyCents(2),
          } as RentalInvestmentInput['financing'],
        }),
      ),
    ).toMatchObject({ status: 'unavailable', reason: 'UNDERFUNDED_SCENARIO' })
    expect(
      calculateRentalInvestment(
        example({
          financing: {
            ...base.financing,
            loanAmountCents: moneyCents(999),
          } as RentalInvestmentInput['financing'],
        }),
      ),
    ).toMatchObject({ status: 'unavailable', reason: 'FINANCING_SCHEDULE_MISMATCH' })
    if (base.amortization.status !== 'available') throw new Error('Expected schedule')
    expect(
      calculateRentalInvestment(
        example({
          amortization: {
            ...base.amortization,
            rows: base.amortization.rows.slice(0, 1),
          } as RentalInvestmentInput['amortization'],
        }),
      ),
    ).toMatchObject({ status: 'unavailable', reason: 'INCOMPLETE_MORTGAGE_SCHEDULE', month: 2 })
  })
})
