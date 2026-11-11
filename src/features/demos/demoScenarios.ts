import ownerFixture from '../../../examples/scenarios/owner-occupier.json'
import rentalFixture from '../../../examples/scenarios/rental-investment.json'

import {
  initialFinancingDraft,
  initialPurchaseCostsDraft,
  initialScenarioAnalysisDraft,
  type ScenarioWorkspaceSnapshot,
} from '../../config/scenarioDrafts'
import { scenarioInputsSchema } from '../../storage/scenarioPersistence'

export type DemoScenarioId = 'owner-occupier' | 'rental-investment'

/**
 * Keep the published PD-010 JSON examples as the single source of demo values.
 * The UI uses editable draft strings rather than the canonical cent/rate document.
 * Parse the adapted draft through the same schema used by saved/imported scenarios.
 */
export function createDemoWorkspace(id: DemoScenarioId): ScenarioWorkspaceSnapshot {
  const source = id === 'owner-occupier' ? ownerFixture : rentalFixture

  if (
    source.documentType !== 'scenario' ||
    source.schemaVersion !== '1.0.0' ||
    source.assumptionSetVersion !== 'de-2026.09' ||
    source.calculationSpecificationVersion !== '1.0.0' ||
    source.mode !== id
  ) {
    throw new Error('Unexpected canonical demo document or version')
  }

  const euros = (cents: number, inputLocale: 'de' | 'canonical' = 'canonical') => {
    if (!Number.isSafeInteger(cents) || cents < 0) {
      throw new Error('Invalid canonical demo amount')
    }
    const whole = Math.floor(cents / 100)
    const fraction = cents % 100
    return fraction
      ? `${whole}${inputLocale === 'de' ? ',' : '.'}${String(fraction).padStart(2, '0')}`
      : String(whole)
  }

  const percentage = (decimalRate: number) => {
    if (!Number.isFinite(decimalRate)) throw new Error('Invalid canonical demo rate')
    return (decimalRate * 100).toFixed(4).replace(/0+$/u, '').replace(/\.$/u, '').replace('.', ',')
  }

  const years = (months: number) => {
    if (!Number.isSafeInteger(months) || months <= 0 || months % 12 !== 0) {
      throw new Error('Invalid canonical demo horizon')
    }
    return String(months / 12)
  }

  const futureRate = (scenarioId: string) => {
    const scenario = source.financing.refinancingScenarios.find((item) => item.id === scenarioId)
    if (!scenario) throw new Error(`Missing canonical refinancing scenario: ${scenarioId}`)
    return percentage(scenario.nominalAnnualRate)
  }

  if (source.financing.oneTimeAdditionalRepayments.length !== 0) {
    throw new Error('The published demos require a new one-time repayment mapping')
  }

  const analysis = {
    ...initialScenarioAnalysisDraft,
    propertyUse: source.mode,
    refinancingInitialRepaymentRate: percentage(
      source.financing.refinancingScenarios[0]!.initialRepaymentRate,
    ),
    refinancingLowerRate: futureRate('lower-rate'),
    refinancingBaseRate: futureRate('base-rate'),
    refinancingHigherRate: futureRate('higher-rate'),
    livingAreaSquareMetres: String(source.property.livingAreaSquareMetres),
    askingPrice: euros(source.offerAnalysis.askingPriceCents),
    // The draft's comparable-price calculator requires a proposed offer.
    // Use the fixture asking price as the neutral illustrative starting point.
    proposedOffer: euros(source.offerAnalysis.askingPriceCents),
    comparablePricePerSquareMetreLow: euros(
      source.offerAnalysis.comparablePricePerSquareMetreLowCents,
    ),
    comparablePricePerSquareMetreHigh: euros(
      source.offerAnalysis.comparablePricePerSquareMetreHighCents,
    ),
    openingOfferLargerDiscount: percentage(source.offerAnalysis.openingOfferLargerDiscount),
    openingOfferSmallerDiscount: percentage(source.offerAnalysis.openingOfferSmallerDiscount),
    ...(id === 'owner-occupier'
      ? {
          currentComparableRent: euros(ownerFixture.ownerOccupier.currentComparableRentCents),
          monthlyOwnerCosts: euros(ownerFixture.ownerOccupier.monthlyOwnerCostsCents),
          ownerAnalysisYears: years(ownerFixture.ownerOccupier.analysisMonths),
          ownerRentGrowthRate: percentage(ownerFixture.ownerOccupier.rentGrowthRate),
          ownerCostGrowthRate: percentage(ownerFixture.ownerOccupier.ownerCostGrowthRate),
          propertyAppreciationRate: percentage(
            ownerFixture.ownerOccupier.propertyAppreciationRate,
          ),
          alternativeReturnRate: percentage(ownerFixture.ownerOccupier.alternativeReturnRate),
          ownerSellingCostRate: percentage(ownerFixture.ownerOccupier.sellingCostRate),
        }
      : {
          monthlyNetColdRent: euros(rentalFixture.rentalInvestment.monthlyNetColdRentCents),
          vacancyRate: percentage(rentalFixture.rentalInvestment.vacancyRate),
          otherAnnualRentLoss: euros(rentalFixture.rentalInvestment.otherAnnualRentLossCents),
          monthlyNonRecoverableHausgeld: euros(
            rentalFixture.rentalInvestment.monthlyNonRecoverableHausgeldExcludingReserveCents,
          ),
          monthlyReserveContribution: euros(
            rentalFixture.rentalInvestment.monthlyReserveContributionCents,
          ),
          annualMaintenanceAllowance: euros(
            rentalFixture.rentalInvestment.annualMaintenanceAllowanceOutsideHausgeldCents,
          ),
          otherAnnualOwnerCosts: euros(rentalFixture.rentalInvestment.otherAnnualOwnerCostsCents),
          rentalRentGrowthRate: percentage(rentalFixture.rentalInvestment.rentGrowthRate),
          rentalOwnerCostGrowthRate: percentage(
            rentalFixture.rentalInvestment.ownerCostGrowthRate,
          ),
          rentalHoldingYears: years(rentalFixture.rentalInvestment.holdingPeriodMonths),
          rentalPropertyAppreciationRate: percentage(
            rentalFixture.rentalInvestment.propertyAppreciationRate,
          ),
          rentalSellingCostRate: percentage(rentalFixture.rentalInvestment.sellingCostRate),
          targetGrossYield: percentage(rentalFixture.offerAnalysis.targetGrossYield),
          targetNetYield: percentage(rentalFixture.offerAnalysis.targetNetYield),
        }),
  }

  return scenarioInputsSchema.parse({
    purchaseCosts: {
      ...initialPurchaseCostsDraft,
      purchasePrice: euros(source.property.purchasePriceCents, 'de'),
      stateId: source.property.stateId,
      brokerInvolved: source.acquisition.broker.involved,
      // Source-backed defaults remain defaults, not incorrectly flagged as user overrides.
      rateOverrides: {},
      renovationBudget: {
        amountCents: source.acquisition.renovationBudget.amountCents,
        budgetStatus: source.acquisition.renovationBudget.budgetStatus,
      },
      movingSetupCosts: {
        amountCents: source.acquisition.movingSetupCosts.amountCents,
        budgetStatus: source.acquisition.movingSetupCosts.budgetStatus,
      },
    },
    financing: {
      ...initialFinancingDraft,
      availableEquity: euros(source.financing.availableEquityCents, 'de'),
      downPayment: euros(source.financing.downPaymentCents, 'de'),
      financedAcquisitionCostShare: percentage(source.financing.financedAcquisitionCostShare),
      nominalAnnualRate: percentage(source.financing.nominalAnnualRate),
      initialRepaymentRate: percentage(source.financing.initialRepaymentRate),
      fixedInterestYears: years(source.financing.fixedInterestMonths),
      additionalRepayments: {
        annualAdditionalRepayment:
          source.financing.annualAdditionalRepaymentCents === 0
            ? ''
            : euros(source.financing.annualAdditionalRepaymentCents, 'de'),
        annualAdditionalRepaymentMonth: String(source.financing.annualAdditionalRepaymentMonth),
        oneTimeAdditionalRepayments: [],
      },
    },
    analysis,
  })
}
