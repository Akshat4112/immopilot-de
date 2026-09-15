import { describe, expect, it } from 'vitest'

import pd010 from '../../../data/fixtures/pd010-expected-results.json'
import ownerJson from '../../../examples/scenarios/owner-occupier.json'
import rentalJson from '../../../examples/scenarios/rental-investment.json'
import { composePropertyScenario } from './compose-property-scenario'
import type { PropertyScenario } from './types'

const owner = ownerJson as unknown as Extract<PropertyScenario, { mode: 'owner-occupier' }>
const rental = rentalJson as unknown as Extract<PropertyScenario, { mode: 'rental-investment' }>
interface OwnerExpected {
  acquisition: {
    totalProjectCostCents: number
    requiredEquityCents: number
    loanAmountCents: number
  }
  mortgageBaseline: {
    contractualMonthlyPaymentCents: number
    remainingDebtAtFixedPeriodCents: number
  }
  refinancingBaseline: readonly { futureMonthlyPaymentCents: number }[]
  refinancingAfterSondertilgung: readonly { futureMonthlyPaymentCents: number }[]
  sondertilgungComparison: { withAdditionalRepayment: { remainingDebtAtFixedPeriodCents: number } }
  rentVersusBuy: {
    buyerNetWealthCents: number
    renterNetWealthCents: number
    buyerMinusRenterCents: number
    firstBreakEvenMonth: number
  }
}
interface RentalExpected {
  acquisition: { requiredEquityCents: number; loanAmountCents: number }
  mortgageBaseline: { remainingDebtAtFixedPeriodCents: number }
  rentalInvestment: {
    monthlyPreTaxCashFlowBeforeExtraCents: number
    netSaleProceedsCents: number
    estimatedProfitBeforeTaxCents: number
  }
}
const ownerExpected = pd010.cases.find((item) => item.id === 'demo-owner-occupier-bw')?.expected as
  OwnerExpected | undefined
const rentalExpected = pd010.cases.find((item) => item.id === 'demo-rental-investment-bw')
  ?.expected as RentalExpected | undefined

function withoutOffer(scenario: typeof owner): typeof owner {
  const copy = structuredClone(scenario)
  delete copy.offerAnalysis
  return copy
}

describe('CF-012 scenario composition', () => {
  it('composes the PD-010 owner property through all common stages and rent-versus-buy', () => {
    if (!ownerExpected?.rentVersusBuy) throw new Error('Missing owner fixture')
    const result = composePropertyScenario(owner)
    expect(result.status).toBe('complete')
    expect(result.unavailableStages).toEqual([])
    expect(result.acquisition).toMatchObject({
      status: 'available',
      totalProjectCostCents: ownerExpected.acquisition.totalProjectCostCents,
    })
    expect(result.financing).toMatchObject({
      status: 'available',
      requiredEquityCents: ownerExpected.acquisition.requiredEquityCents,
      loanAmountCents: ownerExpected.acquisition.loanAmountCents,
    })
    expect(result.payment).toMatchObject({
      status: 'available',
      monthlyPaymentCents: ownerExpected.mortgageBaseline.contractualMonthlyPaymentCents,
    })
    expect(result.amortization).toMatchObject({
      status: 'available',
      remainingDebtAtFixedPeriodCents:
        ownerExpected.mortgageBaseline.remainingDebtAtFixedPeriodCents,
    })
    expect(result.fixedPeriod).toMatchObject({
      status: 'available',
      fixedInterestMonths: 120,
      remainingDebtCents: ownerExpected.mortgageBaseline.remainingDebtAtFixedPeriodCents,
      refinancing: { status: 'applicable' },
    })
    expect(result.refinancing.status).toBe('available')
    if (result.refinancing.status === 'available') {
      expect(result.refinancing.scenarios.map((item) => item.futureMonthlyPaymentCents)).toEqual(
        ownerExpected.refinancingBaseline.map((item) => item.futureMonthlyPaymentCents),
      )
    }
    if (result.mode !== 'owner-occupier') throw new Error('Wrong scenario mode')
    expect(result.modeSpecific.rentVersusBuy).toMatchObject({
      status: 'available',
      atAnalysisMonth: {
        buyerNetWealthCents: ownerExpected.rentVersusBuy.buyerNetWealthCents,
        renterNetWealthCents: ownerExpected.rentVersusBuy.renterNetWealthCents,
        buyerMinusRenterCents: ownerExpected.rentVersusBuy.buyerMinusRenterCents,
      },
      breakEven: { status: 'reached', firstMonth: ownerExpected.rentVersusBuy.firstBreakEvenMonth },
    })
    expect(result.offerPrice).toMatchObject({
      status: 'available',
      comparableOffer: { status: 'available', openingOffer: { status: 'not-requested' } },
      affordabilityCeiling: { status: 'not-requested' },
    })
  })

  it('composes the PD-010 rental property, yield ceilings and projected sale', () => {
    if (!rentalExpected?.rentalInvestment) throw new Error('Missing rental fixture')
    const result = composePropertyScenario(rental)
    expect(result.status).toBe('complete')
    expect(result.financing).toMatchObject({
      status: 'available',
      requiredEquityCents: rentalExpected.acquisition.requiredEquityCents,
      loanAmountCents: rentalExpected.acquisition.loanAmountCents,
    })
    expect(result.amortization).toMatchObject({
      status: 'available',
      remainingDebtAtFixedPeriodCents:
        rentalExpected.mortgageBaseline.remainingDebtAtFixedPeriodCents,
    })
    if (result.mode !== 'rental-investment') throw new Error('Wrong scenario mode')
    expect(result.modeSpecific.rentalInvestment).toMatchObject({
      status: 'available',
      firstMonth: {
        preTaxCashFlowBeforeExtraCents:
          rentalExpected.rentalInvestment.monthlyPreTaxCashFlowBeforeExtraCents,
      },
      sale: {
        status: 'available',
        netSaleProceedsCents: rentalExpected.rentalInvestment.netSaleProceedsCents,
        estimatedProfitBeforeTaxCents:
          rentalExpected.rentalInvestment.estimatedProfitBeforeTaxCents,
      },
    })
    expect(result.offerPrice).toMatchObject({
      status: 'available',
      grossYieldCeiling: { status: 'available' },
      netYieldCeiling: { status: 'available', verifiedAgainstRoundedAcquisitionCosts: true },
      affordabilityCeiling: { status: 'not-requested' },
      comparableOffer: { status: 'available', openingOffer: { status: 'not-requested' } },
    })
  })

  it('applies annual Sondertilgung to the actual schedule and refinancing principal', () => {
    if (!ownerExpected?.sondertilgungComparison) throw new Error('Missing Sondertilgung fixture')
    const result = composePropertyScenario({
      ...withoutOffer(owner),
      financing: {
        ...owner.financing,
        annualAdditionalRepaymentCents: 500_000,
        annualAdditionalRepaymentMonth: 12,
      },
    })
    expect(result.status).toBe('complete')
    expect(result.fixedPeriod).toMatchObject({
      status: 'available',
      remainingDebtCents:
        ownerExpected.sondertilgungComparison.withAdditionalRepayment
          .remainingDebtAtFixedPeriodCents,
      additionalPrincipalPaidCents: 5_000_000,
    })
    if (result.refinancing.status !== 'available') throw new Error('Refinancing unavailable')
    expect(result.refinancing.scenarios.map((item) => item.futureMonthlyPaymentCents)).toEqual(
      ownerExpected.refinancingAfterSondertilgung.map((item) => item.futureMonthlyPaymentCents),
    )
  })

  it('keeps budget uncertainty and its downstream unavailable reasons visible', () => {
    const result = composePropertyScenario({
      ...withoutOffer(owner),
      acquisition: {
        ...owner.acquisition,
        renovationBudget: {
          amountCents: 0,
          budgetStatus: 'not-budgeted',
          origin: 'assumption-set',
          sourceId: 'bnotk-notary-costs',
        },
      },
    })
    expect(result.status).toBe('incomplete')
    expect(result.unavailableStages).toEqual([
      'acquisition',
      'financing',
      'payment',
      'amortization',
      'fixedPeriod',
      'refinancing',
      'modeSpecific',
    ])
    expect(result.acquisition).toMatchObject({
      status: 'unavailable',
      reason: 'POST_PURCHASE_BUDGET_NOT_CONFIRMED',
    })
    expect(result.financing).toMatchObject({
      status: 'unavailable',
      reason: 'ACQUISITION_COSTS_UNAVAILABLE',
    })
    expect(result.payment).toMatchObject({ status: 'unavailable', reason: 'FINANCING_UNAVAILABLE' })
    expect(result.fixedPeriod).toMatchObject({
      status: 'unavailable',
      reason: 'AMORTIZATION_SCHEDULE_UNAVAILABLE',
    })
    expect(result.refinancing).toMatchObject({
      status: 'unavailable',
      reason: 'FIXED_PERIOD_UNAVAILABLE',
    })
    expect(result.offerPrice.status).toBe('not-requested')
  })

  it('reports an underfunded scenario without replacing any individual calculator result', () => {
    const result = composePropertyScenario({
      ...withoutOffer(owner),
      financing: { ...owner.financing, availableEquityCents: 0 },
    })
    expect(result.status).toBe('incomplete')
    expect(result.unavailableStages).toContain('financing')
    expect(result.unavailableStages).toContain('modeSpecific')
    expect(result.financing).toMatchObject({ status: 'available', fundingStatus: 'underfunded' })
    if (result.mode !== 'owner-occupier') throw new Error('Wrong scenario mode')
    expect(result.modeSpecific.rentVersusBuy).toMatchObject({
      status: 'unavailable',
      reason: 'UNDERFUNDED_SCENARIO',
    })
  })

  it('preserves cash-purchase refinancing as not applicable', () => {
    const result = composePropertyScenario({
      ...withoutOffer(owner),
      financing: {
        ...owner.financing,
        availableEquityCents: 26_625_000,
        downPaymentCents: 25_000_000,
      },
    })
    expect(result.payment).toMatchObject({
      status: 'available',
      cashPurchase: true,
      monthlyPaymentCents: 0,
    })
    expect(result.amortization).toMatchObject({ status: 'available', cashPurchase: true, rows: [] })
    expect(result.refinancing).toEqual({ status: 'not-applicable', reason: 'CASH_PURCHASE' })
    expect(result.unavailableStages).not.toContain('refinancing')
  })

  it('preserves CF-008 comparison-mismatch errors for mixed refinancing repayment modes', () => {
    const result = composePropertyScenario({
      ...withoutOffer(owner),
      financing: {
        ...owner.financing,
        refinancingScenarios: [
          owner.financing.refinancingScenarios[0]!,
          { ...owner.financing.refinancingScenarios[1]!, fullRepaymentTermMonths: 240 },
        ],
      },
    })
    expect(result.refinancing).toMatchObject({
      status: 'unavailable',
      reason: 'COMPARISON_ASSUMPTIONS_MISMATCH',
    })
    expect(result.unavailableStages).toContain('refinancing')
    expect(result.status).toBe('incomplete')
  })
})
