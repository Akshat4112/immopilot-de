import type { AcquisitionCostInput, AcquisitionCostResult } from '../acquisition-costs'
import type { RentalInvestmentResult } from '../rental-investment'
import type { DecimalValue, FinancialValidationErrorCode, MoneyCents, Rate } from '../shared'

export const maximumOfferPriceSearchCents = 1_000_000_000_000

export interface AffordabilityOfferInput {
  availableEquityCents: number
  maximumMonthlyPaymentCents: number
  financedAcquisitionCostShare: DecimalValue
  nominalAnnualRate: DecimalValue
  initialRepaymentRate: DecimalValue
}

export interface ComparableOfferInput {
  askingPriceCents: number
  purchaseOfferCents: number
  livingAreaSquareMetres: DecimalValue
  comparablePricePerSquareMetreLowCents: number
  comparablePricePerSquareMetreHighCents: number
  openingOffer?: {
    /** A deliberate reference price, never silently inferred from asking/comparable values. */
    referencePriceCents: number
    largerDiscount: DecimalValue
    smallerDiscount: DecimalValue
  }
}

export interface OfferPriceInput {
  /** Current property's confirmed assumptions; candidate prices replace only purchasePriceCents. */
  acquisitionTemplate: AcquisitionCostInput
  rental?: RentalInvestmentResult | undefined
  targetGrossYield?: DecimalValue | undefined
  targetNetYield?: DecimalValue | undefined
  affordability?: AffordabilityOfferInput | undefined
  comparables?: ComparableOfferInput | undefined
}

export type PriceCeilingResult =
  | { status: 'not-requested' }
  | {
      status: 'available'
      priceCeilingCents: MoneyCents
      verifiedAgainstRoundedAcquisitionCosts: boolean
      nextCentFails: true
    }
  | {
      status: 'unavailable'
      reason:
        | 'RENTAL_METRICS_MISSING'
        | 'RENTAL_METRICS_UNAVAILABLE'
        | 'RENTAL_SCENARIO_MISMATCH'
        | 'NEGATIVE_ANALYTICAL_CEILING'
        | 'UNDERFUNDED_FIXED_COSTS'
        | 'PRICE_SEARCH_LIMIT_EXCEEDED'
    }

export type AffordabilityCeilingResult =
  | { status: 'not-requested' }
  | {
      status: 'available'
      priceCeilingCents: MoneyCents
      verifiedAgainstRoundedAcquisitionCosts: true
      nextCentFails: true
      cashCostConstraint: 'bounded' | 'unbounded'
      loanCapacityCents: MoneyCents
      maximumMonthlyPaymentCents: MoneyCents
      availableEquityCents: MoneyCents
    }
  | { status: 'unavailable'; reason: 'UNDERFUNDED_FIXED_COSTS' | 'PRICE_SEARCH_LIMIT_EXCEEDED' }

export type ComparableOfferResult =
  | { status: 'not-requested' }
  | {
      status: 'available'
      comparableValueLowCents: MoneyCents
      comparableValueHighCents: MoneyCents
      askingPriceCents: MoneyCents
      purchaseOfferCents: MoneyCents
      offerDifferenceCents: MoneyCents
      offerDifferenceRate: Rate
      openingOffer:
        | { status: 'not-requested' }
        | {
            status: 'available'
            referencePriceCents: MoneyCents
            largerDiscount: Rate
            smallerDiscount: Rate
            lowCents: MoneyCents
            highCents: MoneyCents
          }
    }

export interface AvailableOfferPriceResult {
  status: 'available'
  acquisitionTemplate: Extract<AcquisitionCostResult, { status: 'available' }>
  proportionalAcquisitionCostRate: Rate
  fixedInitialCostsCents: MoneyCents
  grossYieldCeiling: PriceCeilingResult
  netYieldCeiling: PriceCeilingResult
  affordabilityCeiling: AffordabilityCeilingResult
  comparableOffer: ComparableOfferResult
}

export type OfferPriceResult =
  | AvailableOfferPriceResult
  | {
      status: 'unavailable'
      reason: 'ACQUISITION_TEMPLATE_UNAVAILABLE'
      acquisition: Exclude<AcquisitionCostResult, { status: 'available' }>
    }
  | {
      status: 'unavailable'
      reason: 'VALIDATION_ERROR'
      error: {
        code: FinancialValidationErrorCode
        field: string
        message: string
        value: unknown
      }
    }
