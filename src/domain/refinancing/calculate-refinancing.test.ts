import { describe, expect, it } from 'vitest'

import { moneyCents } from '../shared'
import type { AvailableFixedPeriodResult, FixedPeriodResult } from '../mortgage/fixed-period-types'

import { calculateRefinancingStress } from './calculate-refinancing'
import type { RefinancingScenarioInput } from './types'

function fixedPeriod(remainingDebtCents = 15_218_873): AvailableFixedPeriodResult {
  const debt = moneyCents(remainingDebtCents)

  return {
    status: 'available',
    cashPurchase: false,
    fixedInterestMonths: 120,
    remainingDebtCents: debt,
    interestPaidCents: moneyCents(0),
    scheduledPrincipalPaidCents: moneyCents(0),
    additionalPrincipalPaidCents: moneyCents(0),
    refinancing: { status: 'applicable', remainingDebtCents: debt },
    projectedPayoffMonth: 348,
    projectionAssumption: 'constant-initial-rate',
  }
}

function initialScenarios(): readonly RefinancingScenarioInput[] {
  return [
    {
      id: 'lower-rate',
      paymentMode: 'initial-repayment-rate',
      futureNominalAnnualRate: 0.02,
      futureInitialRepaymentRate: 0.02,
    },
    {
      id: 'base-rate',
      paymentMode: 'initial-repayment-rate',
      futureNominalAnnualRate: 0.04,
      futureInitialRepaymentRate: 0.02,
    },
    {
      id: 'higher-rate',
      paymentMode: 'initial-repayment-rate',
      futureNominalAnnualRate: 0.06,
      futureInitialRepaymentRate: 0.02,
    },
  ]
}

describe('refinancing stress scenarios', () => {
  it('calculates the three PD-007 rounded interest-rate stress payments', () => {
    const result = calculateRefinancingStress({
      fixedPeriod: fixedPeriod(),
      currentContractualMonthlyPaymentCents: 91_667,
      scenarios: initialScenarios(),
    })

    if (result.status !== 'available') {
      throw new Error('Expected available refinancing stress results')
    }

    expect(result).toMatchObject({
      remainingDebtCents: 15_218_873,
      fixedInterestMonths: 120,
      assumptionKind: 'user-selected-stress-not-forecast',
      paymentMode: 'initial-repayment-rate',
      scenarios: [
        { id: 'lower-rate', futureMonthlyPaymentCents: 50_730, monthlyPaymentChangeCents: -40_937 },
        { id: 'base-rate', futureMonthlyPaymentCents: 76_094, monthlyPaymentChangeCents: -15_573 },
        { id: 'higher-rate', futureMonthlyPaymentCents: 101_459, monthlyPaymentChangeCents: 9_792 },
      ],
    })
    expect(result.scenarios[0]?.monthlyPaymentChangeRate?.toNumber()).toBeCloseTo(
      -40_937 / 91_667,
      12,
    )
    expect(result.scenarios[2]?.monthlyPaymentChangeRate?.toNumber()).toBeCloseTo(
      9_792 / 91_667,
      12,
    )
  })

  it('uses the CF-004 full-term formula for zero- and nonzero-interest scenarios', () => {
    const zeroInterest = calculateRefinancingStress({
      fixedPeriod: fixedPeriod(12_000),
      currentContractualMonthlyPaymentCents: 800,
      scenarios: [
        {
          id: 'zero',
          paymentMode: 'selected-term',
          futureNominalAnnualRate: 0,
          repaymentTermMonths: 12,
        },
      ],
    })
    const withInterest = calculateRefinancingStress({
      fixedPeriod: fixedPeriod(1_200_000),
      currentContractualMonthlyPaymentCents: 10_000,
      scenarios: [
        {
          id: 'six-percent',
          paymentMode: 'selected-term',
          futureNominalAnnualRate: 0.06,
          repaymentTermMonths: 120,
        },
      ],
    })

    expect(zeroInterest).toMatchObject({
      status: 'available',
      scenarios: [
        {
          futureMonthlyPaymentCents: 1_000,
          monthlyPaymentChangeCents: 200,
          repaymentTermMonths: 12,
        },
      ],
    })
    expect(withInterest).toMatchObject({
      status: 'available',
      scenarios: [{ futureMonthlyPaymentCents: 13_322, monthlyPaymentChangeCents: 3_322 }],
    })

    if (zeroInterest.status !== 'available') {
      throw new Error('Expected zero-interest refinancing result')
    }

    expect(zeroInterest.scenarios[0]?.monthlyPaymentChangeRate?.toNumber()).toBe(0.25)
  })

  it('returns an unavailable percentage change when the current payment is zero', () => {
    const result = calculateRefinancingStress({
      fixedPeriod: fixedPeriod(12_000),
      currentContractualMonthlyPaymentCents: 0,
      scenarios: [
        {
          id: 'zero',
          paymentMode: 'selected-term',
          futureNominalAnnualRate: 0,
          repaymentTermMonths: 12,
        },
      ],
    })

    expect(result).toMatchObject({
      status: 'available',
      scenarios: [
        {
          futureMonthlyPaymentCents: 1_000,
          monthlyPaymentChangeCents: 1_000,
          monthlyPaymentChangeRate: null,
        },
      ],
    })
  })

  it.each([
    ['cash purchase', 'CASH_PURCHASE'],
    ['paid off', 'PAID_OFF'],
  ] as const)('returns not-applicable for %s', (_description, reason) => {
    const zero = moneyCents(0)
    const fixed: FixedPeriodResult = {
      ...fixedPeriod(0),
      cashPurchase: reason === 'CASH_PURCHASE',
      fixedInterestMonths: reason === 'CASH_PURCHASE' ? null : 120,
      refinancing: { status: 'not-applicable', reason },
      remainingDebtCents: zero,
    }

    expect(
      calculateRefinancingStress({
        fixedPeriod: fixed,
        currentContractualMonthlyPaymentCents: 0,
        scenarios: [],
      }),
    ).toEqual({ status: 'not-applicable', reason })
  })

  it('propagates an unavailable CF-007 result before accepting any rate assumptions', () => {
    const upstream: FixedPeriodResult = {
      status: 'unavailable',
      reason: 'AMORTIZATION_SCHEDULE_UNAVAILABLE',
      schedule: {
        status: 'unavailable',
        reason: 'VALIDATION_ERROR',
        error: {
          code: 'REQUIRED',
          field: 'fixedInterestMonths',
          message: 'Required',
          value: undefined,
        },
      },
    }

    expect(
      calculateRefinancingStress({
        fixedPeriod: upstream,
        currentContractualMonthlyPaymentCents: 0,
        scenarios: [],
      }),
    ).toEqual({ status: 'unavailable', reason: 'FIXED_PERIOD_UNAVAILABLE', fixedPeriod: upstream })
  })

  it.each([
    [[], 'scenarios', 'REQUIRED'],
    [
      [{ ...initialScenarios()[0], futureNominalAnnualRate: -0.01 }],
      'scenarios[0].futureNominalAnnualRate',
      'OUT_OF_RANGE',
    ],
    [
      [{ ...initialScenarios()[0], futureInitialRepaymentRate: undefined }],
      'scenarios[0].futureInitialRepaymentRate',
      'REQUIRED',
    ],
    [
      [
        {
          id: 'term',
          paymentMode: 'selected-term',
          futureNominalAnnualRate: 0.04,
          repaymentTermMonths: 0,
        },
      ],
      'scenarios[0].repaymentTermMonths',
      'OUT_OF_RANGE',
    ],
    [
      [
        {
          id: 'term',
          paymentMode: 'selected-term',
          futureNominalAnnualRate: 0.04,
          repaymentTermMonths: 12.5,
        },
      ],
      'scenarios[0].repaymentTermMonths',
      'NOT_INTEGER',
    ],
    [
      [
        {
          id: 'repeat',
          paymentMode: 'initial-repayment-rate',
          futureNominalAnnualRate: 0.02,
          futureInitialRepaymentRate: 0.02,
        },
        {
          id: 'repeat',
          paymentMode: 'initial-repayment-rate',
          futureNominalAnnualRate: 0.06,
          futureInitialRepaymentRate: 0.02,
        },
      ],
      'scenarios[1].id',
      'OUT_OF_RANGE',
    ],
  ] as const)('rejects invalid scenario input at %s', (scenarios, field, code) => {
    const result = calculateRefinancingStress({
      fixedPeriod: fixedPeriod(),
      currentContractualMonthlyPaymentCents: 91_667,
      scenarios: scenarios as unknown as readonly RefinancingScenarioInput[],
    })

    expect(result).toMatchObject({
      status: 'unavailable',
      reason: 'VALIDATION_ERROR',
      error: { field, code },
    })
  })

  it('validates the current payment and consistency of CF-007 refinancing debt', () => {
    const invalidPayment = calculateRefinancingStress({
      fixedPeriod: fixedPeriod(),
      currentContractualMonthlyPaymentCents: -1,
      scenarios: initialScenarios(),
    })
    const inconsistent = calculateRefinancingStress({
      fixedPeriod: { ...fixedPeriod(), remainingDebtCents: moneyCents(1) },
      currentContractualMonthlyPaymentCents: 91_667,
      scenarios: initialScenarios(),
    })

    expect(invalidPayment).toMatchObject({
      status: 'unavailable',
      reason: 'VALIDATION_ERROR',
      error: { field: 'currentContractualMonthlyPaymentCents' },
    })
    expect(inconsistent).toMatchObject({
      status: 'unavailable',
      reason: 'VALIDATION_ERROR',
      error: { field: 'fixedPeriod' },
    })
  })

  it.each([
    [
      [initialScenarios()[0], { ...initialScenarios()[1], futureInitialRepaymentRate: 0.03 }],
      'futureInitialRepaymentRate',
    ],
    [
      [
        initialScenarios()[0],
        {
          id: 'term',
          paymentMode: 'selected-term',
          futureNominalAnnualRate: 0.04,
          repaymentTermMonths: 120,
        },
      ],
      'paymentMode',
    ],
    [
      [
        {
          id: 'one',
          paymentMode: 'selected-term',
          futureNominalAnnualRate: 0.02,
          repaymentTermMonths: 120,
        },
        {
          id: 'two',
          paymentMode: 'selected-term',
          futureNominalAnnualRate: 0.04,
          repaymentTermMonths: 180,
        },
      ],
      'repaymentTermMonths',
    ],
  ] as const)('rejects mixed comparison assumptions for %s', (scenarios, field) => {
    const result = calculateRefinancingStress({
      fixedPeriod: fixedPeriod(),
      currentContractualMonthlyPaymentCents: 91_667,
      scenarios: scenarios as unknown as readonly RefinancingScenarioInput[],
    })

    expect(result).toMatchObject({
      status: 'unavailable',
      reason: 'COMPARISON_ASSUMPTIONS_MISMATCH',
      field,
    })
  })

  it('does not report a misleading payment when cent rounding prevents amortization', () => {
    expect(
      calculateRefinancingStress({
        fixedPeriod: fixedPeriod(1),
        currentContractualMonthlyPaymentCents: 1,
        scenarios: [
          {
            id: 'tiny',
            paymentMode: 'selected-term',
            futureNominalAnnualRate: 0,
            repaymentTermMonths: 120,
          },
        ],
      }),
    ).toMatchObject({
      status: 'unavailable',
      reason: 'FUTURE_PAYMENT_NOT_AMORTIZING',
      scenarioId: 'tiny',
    })
  })
})
