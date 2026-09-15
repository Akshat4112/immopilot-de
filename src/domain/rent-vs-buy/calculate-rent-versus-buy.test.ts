import { describe, expect, it } from 'vitest'

import { moneyCents } from '../shared'
import type { RentVersusBuyInput } from './types'
import { calculateRentVersusBuy } from './calculate-rent-versus-buy'

function sample(overrides: Partial<RentVersusBuyInput> = {}): RentVersusBuyInput {
  const zero = moneyCents(0)
  const principal = moneyCents(10_000)
  return {
    financing: {
      status: 'available',
      fundingStatus: 'funded',
      cashGapCents: zero,
      loanAmountCents: principal,
      purchasePriceCents: moneyCents(20_000),
      requiredEquityCents: moneyCents(10_000),
    } as RentVersusBuyInput['financing'],
    amortization: {
      status: 'available',
      cashPurchase: false,
      principalCents: principal,
      fixedInterestMonths: 2,
      payoffMonth: 2,
      rows: [
        {
          month: 1,
          regularPaymentCents: moneyCents(5_000),
          additionalPrincipalCents: zero,
          closingBalanceCents: moneyCents(5_000),
        },
        {
          month: 2,
          regularPaymentCents: moneyCents(5_000),
          additionalPrincipalCents: zero,
          closingBalanceCents: zero,
        },
      ],
    } as unknown as RentVersusBuyInput['amortization'],
    analysisMonths: 3,
    currentComparableRentCents: 2_000,
    monthlyOwnerCostsCents: 1_000,
    rentGrowthRate: 0,
    ownerCostGrowthRate: 0,
    propertyAppreciationRate: 0,
    alternativeReturnRate: 0,
    includeAdditionalRepaymentsInMatchedBudget: false,
    ...overrides,
  }
}

describe('matched-budget rent-versus-buy', () => {
  it('starts the renter with the required equity and invests the cheaper monthly outflow', () => {
    const result = calculateRentVersusBuy(sample())
    if (result.status !== 'available') throw new Error(result.reason)
    expect(result.rows[0]).toMatchObject({
      regularMortgagePaymentCents: 5_000,
      remainingMortgageDebtCents: 5_000,
      buyerHousingOutflowCents: 6_000,
      renterHousingOutflowCents: 2_000,
      commonBudgetCents: 6_000,
      renterInvestmentContributionCents: 4_000,
      renterNetWealthCents: 14_000,
      buyerNetWealthCents: 15_000,
    })
    expect(result.rows[2]).toMatchObject({
      regularMortgagePaymentCents: 0,
      remainingMortgageDebtCents: 0,
      buyerInvestmentContributionCents: 1_000,
      buyerNetWealthCents: 21_000,
      renterNetWealthCents: 18_000,
    })
    expect(result.breakEven).toEqual({ status: 'reached', firstMonth: 1, year: 1 })
    expect(result.mortgageProjectionAssumption).toBe('constant-initial-rate-beyond-fixed-period')
  })

  it('applies optional hypothetical selling costs without charging principal as an expense', () => {
    const result = calculateRentVersusBuy(sample({ sellingCostRate: 0.2, analysisMonths: 2 }))
    if (result.status !== 'available') throw new Error(result.reason)
    expect(result.rows[0]).toMatchObject({
      hypotheticalSellingCostsCents: 4_000,
      buyerNetWealthCents: 11_000,
      buyerMinusRenterCents: -3_000,
    })
    expect(result.breakEven).toEqual({ status: 'not-reached-within-horizon', analysisMonths: 2 })
    expect(result.mortgageProjectionAssumption).toBe('within-fixed-period')
  })

  it('treats an empty cash-purchase schedule as debt-free', () => {
    const input = sample({
      financing: {
        ...sample().financing,
        loanAmountCents: moneyCents(0),
        requiredEquityCents: moneyCents(20_000),
      } as RentVersusBuyInput['financing'],
      amortization: {
        status: 'available',
        cashPurchase: true,
        principalCents: moneyCents(0),
        fixedInterestMonths: null,
        payoffMonth: 0,
        rows: [],
      } as unknown as RentVersusBuyInput['amortization'],
    })
    const result = calculateRentVersusBuy(input)
    if (result.status !== 'available') throw new Error(result.reason)
    expect(result.mortgageProjectionAssumption).toBe('cash-purchase')
    expect(result.rows[0]).toMatchObject({
      regularMortgagePaymentCents: 0,
      remainingMortgageDebtCents: 0,
      buyerInvestmentContributionCents: 1_000,
    })
  })

  it('matches explicitly modeled Sondertilgung to an equal household budget', () => {
    const original = sample()
    if (original.amortization.status !== 'available') throw new Error('Expected schedule')
    const rows = original.amortization.rows.map((row) => ({ ...row }))
    rows[0] = {
      ...rows[0]!,
      additionalPrincipalCents: moneyCents(1_000),
      closingBalanceCents: moneyCents(4_000),
    }
    rows[1] = { ...rows[1]!, regularPaymentCents: moneyCents(4_000) }
    const input = sample({
      amortization: { ...original.amortization, rows } as RentVersusBuyInput['amortization'],
    })
    expect(calculateRentVersusBuy(input)).toMatchObject({
      status: 'unavailable',
      reason: 'UNMATCHED_ADDITIONAL_REPAYMENTS',
    })
    const matched = calculateRentVersusBuy({
      ...input,
      includeAdditionalRepaymentsInMatchedBudget: true,
    })
    if (matched.status !== 'available') throw new Error(matched.reason)
    expect(matched.rows[0]).toMatchObject({
      additionalRepaymentCents: 1_000,
      buyerHousingOutflowCents: 7_000,
      renterInvestmentContributionCents: 5_000,
    })
  })

  it.each([
    [{ analysisMonths: 0 }, 'analysisMonths', 'OUT_OF_RANGE'],
    [{ analysisMonths: 1.5 }, 'analysisMonths', 'NOT_INTEGER'],
    [{ analysisMonths: 1201 }, 'analysisMonths', 'OUT_OF_RANGE'],
    [{ currentComparableRentCents: -1 }, 'currentComparableRentCents', 'OUT_OF_RANGE'],
    [{ monthlyOwnerCostsCents: Number.NaN }, 'monthlyOwnerCostsCents', 'NOT_FINITE'],
    [{ rentGrowthRate: -1 }, 'rentGrowthRate', 'OUT_OF_RANGE'],
    [{ ownerCostGrowthRate: -1 }, 'ownerCostGrowthRate', 'OUT_OF_RANGE'],
    [{ propertyAppreciationRate: -1 }, 'propertyAppreciationRate', 'OUT_OF_RANGE'],
    [{ alternativeReturnRate: -1 }, 'alternativeReturnRate', 'OUT_OF_RANGE'],
    [{ sellingCostRate: 1.01 }, 'sellingCostRate', 'OUT_OF_RANGE'],
    [
      { includeAdditionalRepaymentsInMatchedBudget: undefined },
      'includeAdditionalRepaymentsInMatchedBudget',
      'INVALID_TYPE',
    ],
  ] as const)('reports a stable validation error for %o', (overrides, field, code) => {
    expect(calculateRentVersusBuy(sample(overrides as Partial<RentVersusBuyInput>))).toMatchObject({
      status: 'unavailable',
      reason: 'VALIDATION_ERROR',
      error: { field, code },
    })
  })

  it('propagates unavailable upstream results and underfunded scenarios', () => {
    const financingFailure = {
      status: 'unavailable',
      reason: 'VALIDATION_ERROR',
    } as RentVersusBuyInput['financing']
    expect(calculateRentVersusBuy(sample({ financing: financingFailure }))).toMatchObject({
      status: 'unavailable',
      reason: 'FINANCING_UNAVAILABLE',
    })
    const amortizationFailure = {
      status: 'unavailable',
      reason: 'VALIDATION_ERROR',
    } as RentVersusBuyInput['amortization']
    expect(calculateRentVersusBuy(sample({ amortization: amortizationFailure }))).toMatchObject({
      status: 'unavailable',
      reason: 'AMORTIZATION_UNAVAILABLE',
    })
    const base = sample()
    expect(
      calculateRentVersusBuy(
        sample({
          financing: {
            ...base.financing,
            fundingStatus: 'underfunded',
            cashGapCents: moneyCents(10),
          } as RentVersusBuyInput['financing'],
        }),
      ),
    ).toMatchObject({
      status: 'unavailable',
      reason: 'UNDERFUNDED_SCENARIO',
      cashGapCents: 10,
    })
  })

  it('rejects mismatched principal and incomplete schedule instead of fabricating a balance', () => {
    const base = sample()
    expect(
      calculateRentVersusBuy(
        sample({
          financing: {
            ...base.financing,
            loanAmountCents: moneyCents(9_999),
          } as RentVersusBuyInput['financing'],
        }),
      ),
    ).toMatchObject({
      status: 'unavailable',
      reason: 'FINANCING_SCHEDULE_MISMATCH',
    })
    if (base.amortization.status !== 'available') throw new Error('Expected schedule')
    expect(
      calculateRentVersusBuy(
        sample({
          amortization: {
            ...base.amortization,
            rows: base.amortization.rows.slice(0, 1),
          } as RentVersusBuyInput['amortization'],
        }),
      ),
    ).toMatchObject({
      status: 'unavailable',
      reason: 'INCOMPLETE_MORTGAGE_SCHEDULE',
      month: 2,
    })
  })
})
