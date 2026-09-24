import { describe, expect, it } from 'vitest'

import {
  additionalRepaymentPlanFromDraft,
  calculateScenarioWorkspace,
  initialFinancingDraft,
  initialPurchaseCostsDraft,
} from './index'

function completePurchaseDraft(purchasePrice = '250000') {
  return {
    ...initialPurchaseCostsDraft,
    purchasePrice,
    renovationBudget: { amountCents: 0, budgetStatus: 'confirmed-zero' as const },
    movingSetupCosts: { amountCents: 0, budgetStatus: 'confirmed-zero' as const },
  }
}

function fundedFinancing() {
  return {
    ...initialFinancingDraft,
    availableEquity: '66250',
    downPayment: '50000',
  }
}

describe('workspace additional-repayment calculations', () => {
  it('converts German and English locale-formatted amounts to exact integer cents', () => {
    const german = additionalRepaymentPlanFromDraft({
      ...initialFinancingDraft,
      additionalRepayments: {
        annualAdditionalRepayment: '1.234,56',
        annualAdditionalRepaymentMonth: '12',
        oneTimeAdditionalRepayments: [{ amount: '2.500,05', month: '1200' }],
      },
    })
    const english = additionalRepaymentPlanFromDraft(
      {
        ...initialFinancingDraft,
        additionalRepayments: {
          annualAdditionalRepayment: '1,234.56',
          annualAdditionalRepaymentMonth: '12',
          oneTimeAdditionalRepayments: [{ amount: '2,500.05', month: '1200' }],
        },
      },
      'en',
    )

    expect(german).toEqual({
      annualAdditionalRepaymentCents: 123_456,
      annualAdditionalRepaymentMonth: 12,
      oneTimeAdditionalRepayments: [{ amountCents: 250_005, month: 1_200 }],
    })
    expect(english).toEqual(german)
  })

  it('keeps the baseline unchanged and selects the domain-engine Sondertilgung schedule', () => {
    const result = calculateScenarioWorkspace(completePurchaseDraft(), {
      ...fundedFinancing(),
      additionalRepayments: {
        annualAdditionalRepayment: '5.000',
        annualAdditionalRepaymentMonth: '12',
        oneTimeAdditionalRepayments: [{ amount: '2.500', month: '12' }],
      },
    })

    expect(result.amortization).toMatchObject({
      status: 'available',
      remainingDebtAtFixedPeriodCents: 15_218_873,
      payoffMonth: 348,
    })
    expect(result.additionalRepaymentComparison).toMatchObject({
      status: 'available',
      baseline: {
        remainingDebtAtFixedPeriodCents: 15_218_873,
        payoffMonth: 348,
      },
    })
    if (result.additionalRepaymentComparison.status !== 'available') {
      throw new Error('Expected an available comparison')
    }
    expect(result.additionalRepaymentComparison.withAdditionalRepayments.rows[11]).toMatchObject({
      month: 12,
      additionalPrincipalCents: 750_000,
    })
    expect(result.selectedAmortization).toBe(
      result.additionalRepaymentComparison.withAdditionalRepayments,
    )
    expect(result.selectedAmortizationBasis).toBe('additional-repayments')
  })

  it('keeps post-Zinsbindung repayments out of fixed-period savings', () => {
    const result = calculateScenarioWorkspace(completePurchaseDraft(), {
      ...fundedFinancing(),
      additionalRepayments: {
        annualAdditionalRepayment: '',
        annualAdditionalRepaymentMonth: '12',
        oneTimeAdditionalRepayments: [{ amount: '10.000', month: '121' }],
      },
    })

    expect(result.additionalRepaymentComparison).toMatchObject({
      status: 'available',
      interestSavedThroughFixedPeriodCents: 0,
      baseline: { remainingDebtAtFixedPeriodCents: 15_218_873 },
      withAdditionalRepayments: { remainingDebtAtFixedPeriodCents: 15_218_873 },
    })
    if (result.additionalRepaymentComparison.status !== 'available') {
      throw new Error('Expected an available comparison')
    }
    expect(
      result.additionalRepaymentComparison.projectedLifetimeInterestSavedCents,
    ).toBeGreaterThan(0)
    expect(result.additionalRepaymentComparison.timeSavedMonths).toBeGreaterThan(0)
  })

  it('caps an early payoff, stops the selected schedule, and preserves the baseline projection', () => {
    const result = calculateScenarioWorkspace(completePurchaseDraft(), {
      ...fundedFinancing(),
      additionalRepayments: {
        annualAdditionalRepayment: '',
        annualAdditionalRepaymentMonth: '12',
        oneTimeAdditionalRepayments: [{ amount: '999.999', month: '1' }],
      },
    })

    expect(result.amortization).toMatchObject({ status: 'available', payoffMonth: 348 })
    expect(result.selectedAmortization).toMatchObject({
      status: 'available',
      payoffMonth: 1,
      remainingDebtAtFixedPeriodCents: 0,
    })
    if (result.selectedAmortization.status !== 'available') {
      throw new Error('Expected an available selected schedule')
    }
    expect(result.selectedAmortization.rows).toHaveLength(1)
    const payoffRow = result.selectedAmortization.rows[0]
    if (!payoffRow) throw new Error('Expected a payoff row')
    expect(payoffRow).toMatchObject({
      month: 1,
      closingBalanceCents: 0,
    })
    expect(payoffRow.scheduledPrincipalCents + payoffRow.additionalPrincipalCents).toBe(20_000_000)
  })

  it('returns an unavailable comparison for incomplete, duplicate, or out-of-range rows', () => {
    const invalidRows = [
      [{ amount: '', month: '18' }],
      [
        { amount: '1.000', month: '18' },
        { amount: '2.000', month: '18' },
      ],
      [{ amount: '1.000', month: '1201' }],
    ]

    for (const oneTimeAdditionalRepayments of invalidRows) {
      const result = calculateScenarioWorkspace(completePurchaseDraft(), {
        ...fundedFinancing(),
        additionalRepayments: {
          annualAdditionalRepayment: '',
          annualAdditionalRepaymentMonth: '12',
          oneTimeAdditionalRepayments,
        },
      })

      expect(result.amortization.status).toBe('available')
      expect(result.additionalRepaymentComparison).toMatchObject({
        status: 'unavailable',
        reason: 'ADDITIONAL_REPAYMENT_SCHEDULE_UNAVAILABLE',
        schedule: { status: 'unavailable', reason: 'VALIDATION_ERROR' },
      })
      expect(result.selectedAmortization).toBe(result.amortization)
      expect(result.selectedAmortizationBasis).toBe('unavailable')
    }
  })

  it('keeps cash purchases at zero and ignores retained repayment values', () => {
    const result = calculateScenarioWorkspace(completePurchaseDraft(), {
      ...initialFinancingDraft,
      mode: 'available-equity',
      availableEquity: '266250',
      additionalRepayments: {
        annualAdditionalRepayment: '5.000',
        annualAdditionalRepaymentMonth: '6',
        oneTimeAdditionalRepayments: [{ amount: '10.000', month: '18' }],
      },
    })

    expect(result.additionalRepaymentComparison).toMatchObject({
      status: 'available',
      cashPurchase: true,
      interestSavedThroughFixedPeriodCents: 0,
      projectedLifetimeInterestSavedCents: 0,
      timeSavedMonths: 0,
      baseline: { rows: [], payoffMonth: 0 },
      withAdditionalRepayments: { rows: [], payoffMonth: 0 },
    })
    expect(result.selectedAmortization).toMatchObject({
      status: 'available',
      cashPurchase: true,
      rows: [],
    })
    expect(result.selectedAmortizationBasis).toBe('baseline')
  })
})
