import {
  calculateAcquisitionCosts,
  type AcquisitionCostInput,
  type AcquisitionCostResult,
} from '../../domain/acquisition-costs'
import {
  calculateFinancing,
  type FinancingInput,
  type FinancingResult,
} from '../../domain/financing'
import {
  calculateAmortizationSchedule,
  calculateFixedPeriod,
  calculateMortgagePayment,
  type AmortizationScheduleResult,
  type FixedPeriodResult,
  type MortgagePaymentInput,
  type MortgagePaymentResult,
} from '../../domain/mortgage'
import { calculateOfferPrice, type OfferPriceResult } from '../../domain/offer-price'
import { calculateRefinancingStress, type RefinancingStressResult } from '../../domain/refinancing'
import { calculateRentVersusBuy, type RentVersusBuyResult } from '../../domain/rent-vs-buy'
import {
  calculateRentalInvestment,
  type RentalInvestmentResult,
} from '../../domain/rental-investment'

import type { FinancingDraft, PurchaseCostsDraft, ScenarioAnalysisDraft } from './scenarioStore'

export type NumericInputLocale = 'de' | 'en'

function parseEuroInput(value: string, locale: NumericInputLocale = 'de'): number {
  const withoutCurrency = value.replace(/[€\s]/g, '')
  const cleaned =
    locale === 'en'
      ? withoutCurrency.replace(/,/g, '')
      : withoutCurrency.replace(/\./g, '').replace(',', '.')

  if (!cleaned) {
    return 0
  }

  const euros = Number.parseFloat(cleaned)
  return Number.isFinite(euros) ? Math.round(euros * 100) : 0
}

function parseRateInput(value: string): number {
  const cleaned = value.replace(/[%\s]/g, '').replace(',', '.')

  if (!cleaned) {
    return 0
  }

  const percentage = Number.parseFloat(cleaned)
  return Number.isFinite(percentage) ? percentage / 100 : 0
}

function parseOptionalRateInput(value: string | undefined): number | undefined {
  return value?.trim() ? parseRateInput(value) : undefined
}

function hasInput(value: string) {
  return value.trim().length > 0
}

function missingInputs(
  draft: ScenarioAnalysisDraft,
  fields: readonly (keyof ScenarioAnalysisDraft)[],
) {
  return fields.filter((field) => !hasInput(draft[field]))
}

function yearsToMonths(value: string) {
  const years = Number.parseInt(value, 10)
  return Number.isSafeInteger(years) ? years * 12 : 0
}

export function acquisitionCostInputFromDraft(
  draft: PurchaseCostsDraft,
  locale: NumericInputLocale = 'de',
): AcquisitionCostInput {
  const rateOverrides = {
    transferTaxRate: parseOptionalRateInput(draft.rateOverrides?.transferTaxRate),
    notaryRate: parseOptionalRateInput(draft.rateOverrides?.notaryRate),
    landRegisterRate: parseOptionalRateInput(draft.rateOverrides?.landRegisterRate),
    buyerBrokerRate: parseOptionalRateInput(draft.rateOverrides?.buyerBrokerRate),
  }

  return {
    purchasePriceCents: parseEuroInput(draft.purchasePrice, locale),
    stateId: draft.stateId,
    brokerInvolved: draft.brokerInvolved,
    rateOverrides: Object.values(rateOverrides).some((rate) => rate !== undefined)
      ? rateOverrides
      : undefined,
    renovationBudget: draft.renovationBudget,
    movingSetupCosts: draft.movingSetupCosts,
  }
}

export function financingInputFromDraft(
  draft: FinancingDraft,
  acquisition: AcquisitionCostResult,
  locale: NumericInputLocale = 'de',
): FinancingInput {
  const sharedInput = {
    acquisition,
    availableEquityCents: parseEuroInput(draft.availableEquity, locale),
    financedAcquisitionCostShare: parseRateInput(draft.financedAcquisitionCostShare),
  }

  return draft.mode === 'available-equity'
    ? {
        ...sharedInput,
        mode: 'available-equity',
      }
    : {
        ...sharedInput,
        mode: 'selected-down-payment',
        downPaymentCents: parseEuroInput(draft.downPayment, locale),
      }
}

export function mortgagePaymentInputFromDraft(
  draft: FinancingDraft,
  financing: FinancingResult,
): MortgagePaymentInput {
  return {
    paymentMode: 'initial-repayment-rate',
    financing,
    nominalAnnualRate: parseRateInput(draft.nominalAnnualRate),
    initialRepaymentRate: parseRateInput(draft.initialRepaymentRate),
  }
}

function fixedInterestMonthsFromDraft(draft: FinancingDraft): number {
  const years = Number.parseInt(draft.fixedInterestYears, 10)
  return Number.isSafeInteger(years) ? years * 12 : 0
}

export interface ScenarioWorkspaceCalculationResult {
  acquisition: AcquisitionCostResult
  financing: FinancingResult
  payment: MortgagePaymentResult
  amortization: AmortizationScheduleResult
}

export interface NotConfiguredDashboardResult {
  status: 'not-configured'
  missing: readonly (keyof ScenarioAnalysisDraft)[]
}

export type ConfigurableDashboardResult<Result> = Result | NotConfiguredDashboardResult

export type ModeSpecificDashboardResult =
  | {
      mode: 'owner-occupier'
      result: ConfigurableDashboardResult<RentVersusBuyResult>
    }
  | {
      mode: 'rental-investment'
      result: ConfigurableDashboardResult<RentalInvestmentResult>
    }

export interface ScenarioDashboardCalculationResult extends ScenarioWorkspaceCalculationResult {
  fixedPeriod: FixedPeriodResult
  refinancing: ConfigurableDashboardResult<RefinancingStressResult>
  modeSpecific: ModeSpecificDashboardResult
  offerPrice: ConfigurableDashboardResult<OfferPriceResult>
}

export function calculateScenarioWorkspace(
  purchaseCosts: PurchaseCostsDraft,
  financingDraft: FinancingDraft,
  locale: NumericInputLocale = 'de',
): ScenarioWorkspaceCalculationResult {
  const acquisition = calculateAcquisitionCosts(acquisitionCostInputFromDraft(purchaseCosts, locale))
  const financing = calculateFinancing(financingInputFromDraft(financingDraft, acquisition, locale))
  const payment = calculateMortgagePayment(mortgagePaymentInputFromDraft(financingDraft, financing))
  const amortization = calculateAmortizationSchedule({
    payment,
    fixedInterestMonths: fixedInterestMonthsFromDraft(financingDraft),
  })

  return {
    acquisition,
    financing,
    payment,
    amortization,
  }
}

function calculateRefinancingFromDraft(
  fixedPeriod: FixedPeriodResult,
  payment: MortgagePaymentResult,
  draft: ScenarioAnalysisDraft,
): ConfigurableDashboardResult<RefinancingStressResult> {
  const required = [
    'refinancingInitialRepaymentRate',
    'refinancingLowerRate',
    'refinancingBaseRate',
    'refinancingHigherRate',
  ] as const
  const missing = missingInputs(draft, required)
  if (missing.length) return { status: 'not-configured', missing }

  return calculateRefinancingStress({
    fixedPeriod,
    currentContractualMonthlyPaymentCents:
      payment.status === 'available' ? payment.monthlyPaymentCents : 0,
    scenarios: [
      {
        id: 'lower',
        paymentMode: 'initial-repayment-rate',
        futureNominalAnnualRate: parseRateInput(draft.refinancingLowerRate),
        futureInitialRepaymentRate: parseRateInput(draft.refinancingInitialRepaymentRate),
      },
      {
        id: 'base',
        paymentMode: 'initial-repayment-rate',
        futureNominalAnnualRate: parseRateInput(draft.refinancingBaseRate),
        futureInitialRepaymentRate: parseRateInput(draft.refinancingInitialRepaymentRate),
      },
      {
        id: 'higher',
        paymentMode: 'initial-repayment-rate',
        futureNominalAnnualRate: parseRateInput(draft.refinancingHigherRate),
        futureInitialRepaymentRate: parseRateInput(draft.refinancingInitialRepaymentRate),
      },
    ],
  })
}

function calculateOwnerOccupierFromDraft(
  financing: FinancingResult,
  amortization: AmortizationScheduleResult,
  draft: ScenarioAnalysisDraft,
  locale: NumericInputLocale,
): ConfigurableDashboardResult<RentVersusBuyResult> {
  const required = [
    'currentComparableRent',
    'monthlyOwnerCosts',
    'ownerAnalysisYears',
    'ownerRentGrowthRate',
    'ownerCostGrowthRate',
    'propertyAppreciationRate',
    'alternativeReturnRate',
    'ownerSellingCostRate',
  ] as const
  const missing = missingInputs(draft, required)
  if (missing.length) return { status: 'not-configured', missing }

  return calculateRentVersusBuy({
    financing,
    amortization,
    analysisMonths: yearsToMonths(draft.ownerAnalysisYears),
    currentComparableRentCents: parseEuroInput(draft.currentComparableRent, locale),
    monthlyOwnerCostsCents: parseEuroInput(draft.monthlyOwnerCosts, locale),
    rentGrowthRate: parseRateInput(draft.ownerRentGrowthRate),
    ownerCostGrowthRate: parseRateInput(draft.ownerCostGrowthRate),
    propertyAppreciationRate: parseRateInput(draft.propertyAppreciationRate),
    alternativeReturnRate: parseRateInput(draft.alternativeReturnRate),
    sellingCostRate: parseRateInput(draft.ownerSellingCostRate),
    includeAdditionalRepaymentsInMatchedBudget: true,
  })
}

function calculateRentalFromDraft(
  financing: FinancingResult,
  amortization: AmortizationScheduleResult,
  draft: ScenarioAnalysisDraft,
  locale: NumericInputLocale,
): ConfigurableDashboardResult<RentalInvestmentResult> {
  const required = [
    'monthlyNetColdRent',
    'vacancyRate',
    'otherAnnualRentLoss',
    'monthlyNonRecoverableHausgeld',
    'monthlyReserveContribution',
    'annualMaintenanceAllowance',
    'otherAnnualOwnerCosts',
    'rentalRentGrowthRate',
    'rentalOwnerCostGrowthRate',
    'rentalHoldingYears',
  ] as const
  const saleFields = ['rentalPropertyAppreciationRate', 'rentalSellingCostRate'] as const
  const missing = missingInputs(draft, required)
  const suppliedSaleFields = saleFields.filter((field) => hasInput(draft[field]))
  if (suppliedSaleFields.length === 1) {
    missing.push(saleFields.find((field) => !hasInput(draft[field]))!)
  }
  if (missing.length) return { status: 'not-configured', missing }

  const includeSale = suppliedSaleFields.length === saleFields.length
  return calculateRentalInvestment({
    financing,
    amortization,
    monthlyNetColdRentCents: parseEuroInput(draft.monthlyNetColdRent, locale),
    vacancyRate: parseRateInput(draft.vacancyRate),
    otherAnnualRentLossCents: parseEuroInput(draft.otherAnnualRentLoss, locale),
    monthlyNonRecoverableHausgeldExcludingReserveCents: parseEuroInput(
      draft.monthlyNonRecoverableHausgeld,
      locale,
    ),
    monthlyReserveContributionCents: parseEuroInput(draft.monthlyReserveContribution, locale),
    annualMaintenanceAllowanceOutsideHausgeldCents: parseEuroInput(
      draft.annualMaintenanceAllowance,
      locale,
    ),
    otherAnnualOwnerCostsCents: parseEuroInput(draft.otherAnnualOwnerCosts, locale),
    rentGrowthRate: parseRateInput(draft.rentalRentGrowthRate),
    ownerCostGrowthRate: parseRateInput(draft.rentalOwnerCostGrowthRate),
    holdingPeriodMonths: yearsToMonths(draft.rentalHoldingYears),
    ...(includeSale
      ? {
          propertyAppreciationRate: parseRateInput(draft.rentalPropertyAppreciationRate),
          sellingCostRate: parseRateInput(draft.rentalSellingCostRate),
        }
      : {}),
  })
}

function calculateOfferPriceFromDraft(
  purchaseCosts: PurchaseCostsDraft,
  financingDraft: FinancingDraft,
  rental: ConfigurableDashboardResult<RentalInvestmentResult> | undefined,
  draft: ScenarioAnalysisDraft,
  locale: NumericInputLocale,
): ConfigurableDashboardResult<OfferPriceResult> {
  const targetGrossYield = parseOptionalRateInput(draft.targetGrossYield)
  const targetNetYield = parseOptionalRateInput(draft.targetNetYield)
  const hasAffordability = hasInput(draft.maximumMonthlyPayment)
  const comparableFields = [
    'livingAreaSquareMetres',
    'askingPrice',
    'proposedOffer',
    'comparablePricePerSquareMetreLow',
    'comparablePricePerSquareMetreHigh',
  ] as const
  const suppliedComparableFields = comparableFields.filter((field) => hasInput(draft[field]))
  const hasComparables = suppliedComparableFields.length === comparableFields.length
  const hasAnyRequest =
    targetGrossYield !== undefined ||
    targetNetYield !== undefined ||
    hasAffordability ||
    suppliedComparableFields.length > 0
  if (!hasAnyRequest) return { status: 'not-configured', missing: [] }
  if (suppliedComparableFields.length > 0 && !hasComparables) {
    return { status: 'not-configured', missing: missingInputs(draft, comparableFields) }
  }

  const openingOfferFields = ['openingOfferLargerDiscount', 'openingOfferSmallerDiscount'] as const
  const suppliedOpeningOfferFields = openingOfferFields.filter((field) => hasInput(draft[field]))
  if (suppliedOpeningOfferFields.length === 1) {
    return { status: 'not-configured', missing: missingInputs(draft, openingOfferFields) }
  }

  const rentalResult = rental?.status === 'not-configured' ? undefined : rental
  return calculateOfferPrice({
    acquisitionTemplate: acquisitionCostInputFromDraft(purchaseCosts),
    ...(rentalResult ? { rental: rentalResult } : {}),
    ...(targetGrossYield === undefined ? {} : { targetGrossYield }),
    ...(targetNetYield === undefined ? {} : { targetNetYield }),
    ...(hasAffordability
      ? {
          affordability: {
            availableEquityCents: parseEuroInput(financingDraft.availableEquity, locale),
            maximumMonthlyPaymentCents: parseEuroInput(draft.maximumMonthlyPayment, locale),
            financedAcquisitionCostShare: parseRateInput(
              financingDraft.financedAcquisitionCostShare,
            ),
            nominalAnnualRate: parseRateInput(financingDraft.nominalAnnualRate),
            initialRepaymentRate: parseRateInput(financingDraft.initialRepaymentRate),
          },
        }
      : {}),
    ...(hasComparables
      ? {
          comparables: {
            askingPriceCents: parseEuroInput(draft.askingPrice, locale),
            purchaseOfferCents: parseEuroInput(draft.proposedOffer, locale),
            livingAreaSquareMetres: Number.parseFloat(
              draft.livingAreaSquareMetres.replace(',', '.'),
            ),
            comparablePricePerSquareMetreLowCents: parseEuroInput(
              draft.comparablePricePerSquareMetreLow,
              locale,
            ),
            comparablePricePerSquareMetreHighCents: parseEuroInput(
              draft.comparablePricePerSquareMetreHigh,
              locale,
            ),
            ...(suppliedOpeningOfferFields.length === openingOfferFields.length
              ? {
                  openingOffer: {
                    referencePriceCents: parseEuroInput(draft.askingPrice, locale),
                    largerDiscount: parseRateInput(draft.openingOfferLargerDiscount),
                    smallerDiscount: parseRateInput(draft.openingOfferSmallerDiscount),
                  },
                }
              : {}),
          },
        }
      : {}),
  })
}

export function calculateScenarioDashboard(
  purchaseCosts: PurchaseCostsDraft,
  financingDraft: FinancingDraft,
  analysisDraft: ScenarioAnalysisDraft,
  locale: NumericInputLocale = 'de',
): ScenarioDashboardCalculationResult {
  const workspace = calculateScenarioWorkspace(purchaseCosts, financingDraft, locale)
  const fixedPeriod = calculateFixedPeriod(workspace.amortization)
  const refinancing = calculateRefinancingFromDraft(fixedPeriod, workspace.payment, analysisDraft)
  const modeSpecific =
    analysisDraft.propertyUse === 'owner-occupier'
      ? {
          mode: 'owner-occupier' as const,
          result: calculateOwnerOccupierFromDraft(
            workspace.financing,
            workspace.amortization,
            analysisDraft,
            locale,
          ),
        }
      : {
          mode: 'rental-investment' as const,
          result: calculateRentalFromDraft(
            workspace.financing,
            workspace.amortization,
            analysisDraft,
            locale,
          ),
        }
  const rental = modeSpecific.mode === 'rental-investment' ? modeSpecific.result : undefined
  const offerPrice = calculateOfferPriceFromDraft(
    purchaseCosts,
    financingDraft,
    rental,
    analysisDraft,
    locale,
  )

  return {
    ...workspace,
    fixedPeriod,
    refinancing,
    modeSpecific,
    offerPrice,
  }
}
