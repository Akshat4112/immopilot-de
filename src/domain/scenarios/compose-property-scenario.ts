import { calculateAcquisitionCosts, type AcquisitionCostInput } from '../acquisition-costs'
import { calculateFinancing } from '../financing'
import {
  calculateAmortizationSchedule,
  calculateFixedPeriod,
  calculateMortgagePayment,
} from '../mortgage'
import { calculateOfferPrice, type ComparableOfferInput } from '../offer-price'
import { calculateRefinancingStress, type RefinancingScenarioInput } from '../refinancing'
import { calculateRentVersusBuy } from '../rent-vs-buy'
import { calculateRentalInvestment } from '../rental-investment'

import type { PropertyScenario, PropertyScenarioResult, ScenarioStage } from './types'

function acquisitionInput(scenario: PropertyScenario): AcquisitionCostInput {
  const { acquisition, property } = scenario
  return {
    purchasePriceCents: property.purchasePriceCents,
    stateId: property.stateId,
    brokerInvolved: acquisition.broker.involved,
    rateOverrides: {
      transferTaxRate: acquisition.transferTaxRate.value,
      notaryRate: acquisition.notaryRate.value,
      landRegisterRate: acquisition.landRegisterRate.value,
      buyerBrokerRate: acquisition.broker.buyerCommissionRate.value,
    },
    renovationBudget: {
      amountCents: acquisition.renovationBudget.amountCents,
      budgetStatus: acquisition.renovationBudget.budgetStatus,
    },
    movingSetupCosts: {
      amountCents: acquisition.movingSetupCosts.amountCents,
      budgetStatus: acquisition.movingSetupCosts.budgetStatus,
    },
  }
}

function refinancingInputs(scenario: PropertyScenario): RefinancingScenarioInput[] {
  return scenario.financing.refinancingScenarios.map((item) =>
    item.fullRepaymentTermMonths === undefined
      ? {
          id: item.id,
          paymentMode: 'initial-repayment-rate',
          futureNominalAnnualRate: item.nominalAnnualRate,
          futureInitialRepaymentRate: item.initialRepaymentRate,
        }
      : {
          id: item.id,
          paymentMode: 'selected-term',
          futureNominalAnnualRate: item.nominalAnnualRate,
          repaymentTermMonths: item.fullRepaymentTermMonths,
        },
  )
}

function comparableInputs(scenario: PropertyScenario): ComparableOfferInput | undefined {
  const analysis = scenario.offerAnalysis
  const area = scenario.property.livingAreaSquareMetres
  if (
    analysis === undefined ||
    area === undefined ||
    analysis.comparablePricePerSquareMetreLowCents === undefined ||
    analysis.comparablePricePerSquareMetreHighCents === undefined
  ) {
    return undefined
  }
  return {
    askingPriceCents: analysis.askingPriceCents,
    purchaseOfferCents: scenario.property.purchasePriceCents,
    livingAreaSquareMetres: area,
    comparablePricePerSquareMetreLowCents: analysis.comparablePricePerSquareMetreLowCents,
    comparablePricePerSquareMetreHighCents: analysis.comparablePricePerSquareMetreHighCents,
    // No explicit reference price exists in PD-008: do not infer one for an opening-offer range.
  }
}

/** Compose existing pure calculators; downstream results retain their own unavailable/not-applicable reasons. */
export function composePropertyScenario(scenario: PropertyScenario): PropertyScenarioResult {
  const template = acquisitionInput(scenario)
  const acquisition = calculateAcquisitionCosts(template)
  const financing = calculateFinancing({
    mode: 'selected-down-payment',
    acquisition,
    availableEquityCents: scenario.financing.availableEquityCents,
    downPaymentCents: scenario.financing.downPaymentCents,
    financedAcquisitionCostShare: scenario.financing.financedAcquisitionCostShare,
  })
  const payment = calculateMortgagePayment({
    paymentMode: 'initial-repayment-rate',
    financing,
    nominalAnnualRate: scenario.financing.nominalAnnualRate,
    initialRepaymentRate: scenario.financing.initialRepaymentRate,
  })
  const amortization = calculateAmortizationSchedule({
    payment,
    fixedInterestMonths: scenario.financing.fixedInterestMonths,
    additionalRepayments: {
      annualAdditionalRepaymentCents: scenario.financing.annualAdditionalRepaymentCents,
      annualAdditionalRepaymentMonth: scenario.financing.annualAdditionalRepaymentMonth,
      oneTimeAdditionalRepayments: scenario.financing.oneTimeAdditionalRepayments.map((event) => ({
        month: event.paymentMonth,
        amountCents: event.amountCents,
      })),
    },
  })
  const fixedPeriod = calculateFixedPeriod(amortization)
  const refinancing = calculateRefinancingStress({
    fixedPeriod,
    currentContractualMonthlyPaymentCents:
      payment.status === 'available' ? payment.monthlyPaymentCents : 0,
    scenarios: refinancingInputs(scenario),
  })

  const stages: ScenarioStage[] = []
  if (acquisition.status === 'unavailable') stages.push('acquisition')
  if (financing.status === 'unavailable' || financing.fundingStatus === 'underfunded')
    stages.push('financing')
  if (payment.status === 'unavailable') stages.push('payment')
  if (amortization.status === 'unavailable') stages.push('amortization')
  if (fixedPeriod.status === 'unavailable') stages.push('fixedPeriod')
  if (refinancing.status === 'unavailable') stages.push('refinancing')

  const common = {
    scenarioId: scenario.scenarioId,
    assumptionSetVersion: scenario.assumptionSetVersion,
    calculationSpecificationVersion: scenario.calculationSpecificationVersion,
    inputAcquisitionAssumptions: scenario.acquisition,
    acquisition,
    financing,
    payment,
    amortization,
    fixedPeriod,
    refinancing,
  }

  if (scenario.mode === 'owner-occupier') {
    const rentVersusBuy = calculateRentVersusBuy({
      financing,
      amortization,
      ...scenario.ownerOccupier,
    })
    if (rentVersusBuy.status === 'unavailable') stages.push('modeSpecific')
    const comparables = comparableInputs(scenario)
    const offerPrice = scenario.offerAnalysis
      ? calculateOfferPrice({
          acquisitionTemplate: template,
          ...(comparables ? { comparables } : {}),
        })
      : ({ status: 'not-requested' } as const)
    if (offerPrice.status === 'unavailable') stages.push('offerPrice')
    return {
      ...common,
      status: stages.length ? 'incomplete' : 'complete',
      unavailableStages: stages,
      mode: 'owner-occupier',
      modeSpecific: { mode: 'owner-occupier', rentVersusBuy },
      offerPrice,
    }
  }

  const rentalInvestment = calculateRentalInvestment({
    financing,
    amortization,
    ...scenario.rentalInvestment,
  })
  if (rentalInvestment.status === 'unavailable') stages.push('modeSpecific')
  const comparables = comparableInputs(scenario)
  const offerPrice = scenario.offerAnalysis
    ? calculateOfferPrice({
        acquisitionTemplate: template,
        rental: rentalInvestment,
        ...(scenario.offerAnalysis.targetGrossYield === undefined
          ? {}
          : { targetGrossYield: scenario.offerAnalysis.targetGrossYield }),
        ...(scenario.offerAnalysis.targetNetYield === undefined
          ? {}
          : { targetNetYield: scenario.offerAnalysis.targetNetYield }),
        ...(comparables ? { comparables } : {}),
      })
    : ({ status: 'not-requested' } as const)
  if (offerPrice.status === 'unavailable') stages.push('offerPrice')
  return {
    ...common,
    status: stages.length ? 'incomplete' : 'complete',
    unavailableStages: stages,
    mode: 'rental-investment',
    modeSpecific: { mode: 'rental-investment', rentalInvestment },
    offerPrice,
  }
}
