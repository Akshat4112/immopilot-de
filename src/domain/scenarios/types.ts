import type { AcquisitionCostResult, BudgetStatus, GermanStateId } from '../acquisition-costs'
import type { FinancingResult } from '../financing'
import type {
  AmortizationScheduleResult,
  FixedPeriodResult,
  MortgagePaymentResult,
} from '../mortgage'
import type { OfferPriceResult } from '../offer-price'
import type { RefinancingStressResult } from '../refinancing'
import type { RentVersusBuyInput, RentVersusBuyResult } from '../rent-vs-buy'
import type { RentalInvestmentInput, RentalInvestmentResult } from '../rental-investment'

/** The typed counterpart of schemas/scenario.schema.json; JSON Schema validation belongs at the input boundary. */
export interface TrackedScenarioRate {
  value: number
  origin: 'assumption-set' | 'user-override'
  sourceId?: string | null
}

export interface TrackedScenarioBudget {
  amountCents: number
  budgetStatus: BudgetStatus
  origin: 'assumption-set' | 'user-override'
  sourceId?: string | null
}

export interface ScenarioBase {
  $schema: string
  documentType: 'scenario'
  schemaVersion: string
  assumptionSetVersion: string
  calculationSpecificationVersion: string
  scenarioId: string
  name: string
  locale: 'de-DE' | 'en-GB'
  jurisdiction: 'DE'
  currency: 'EUR'
  createdAt: string
  updatedAt: string
  property: {
    purchasePriceCents: number
    stateId: GermanStateId
    propertyType: 'apartment' | 'house' | 'land' | 'multi-family' | 'other'
    livingAreaSquareMetres?: number
  }
  acquisition: {
    transferTaxRate: TrackedScenarioRate
    notaryRate: TrackedScenarioRate
    landRegisterRate: TrackedScenarioRate
    broker: {
      involved: boolean
      buyerCommissionRate: TrackedScenarioRate
      includesVat: boolean
    }
    renovationBudget: TrackedScenarioBudget
    movingSetupCosts: TrackedScenarioBudget
  }
  financing: {
    availableEquityCents: number
    downPaymentCents: number
    financedAcquisitionCostShare: number
    nominalAnnualRate: number
    initialRepaymentRate: number
    fixedInterestMonths: number
    annualAdditionalRepaymentCents: number
    annualAdditionalRepaymentMonth: number
    oneTimeAdditionalRepayments: readonly { paymentMonth: number; amountCents: number }[]
    refinancingScenarios: readonly {
      id: string
      nominalAnnualRate: number
      initialRepaymentRate: number
      fullRepaymentTermMonths?: number
    }[]
  }
  offerAnalysis?: {
    askingPriceCents: number
    targetGrossYield?: number
    targetNetYield?: number
    comparablePricePerSquareMetreLowCents?: number
    comparablePricePerSquareMetreHighCents?: number
    openingOfferLargerDiscount?: number
    openingOfferSmallerDiscount?: number
  }
}

export type PropertyScenario =
  | (ScenarioBase & {
      mode: 'owner-occupier'
      ownerOccupier: Omit<RentVersusBuyInput, 'financing' | 'amortization'>
      rentalInvestment?: never
    })
  | (ScenarioBase & {
      mode: 'rental-investment'
      rentalInvestment: Omit<RentalInvestmentInput, 'financing' | 'amortization'>
      ownerOccupier?: never
    })

export type ScenarioStage =
  | 'acquisition'
  | 'financing'
  | 'payment'
  | 'amortization'
  | 'fixedPeriod'
  | 'refinancing'
  | 'modeSpecific'
  | 'offerPrice'

export interface ScenarioResultBase {
  status: 'complete' | 'incomplete'
  scenarioId: string
  assumptionSetVersion: string
  calculationSpecificationVersion: string
  /** Underfunding is an incomplete scenario even if some mortgage calculations remain available. */
  unavailableStages: readonly ScenarioStage[]
  acquisition: AcquisitionCostResult
  financing: FinancingResult
  payment: MortgagePaymentResult
  amortization: AmortizationScheduleResult
  fixedPeriod: FixedPeriodResult
  refinancing: RefinancingStressResult
  offerPrice: OfferPriceResult | { status: 'not-requested' }
}

export type PropertyScenarioResult =
  | (ScenarioResultBase & {
      mode: 'owner-occupier'
      modeSpecific: { mode: 'owner-occupier'; rentVersusBuy: RentVersusBuyResult }
    })
  | (ScenarioResultBase & {
      mode: 'rental-investment'
      modeSpecific: { mode: 'rental-investment'; rentalInvestment: RentalInvestmentResult }
    })
