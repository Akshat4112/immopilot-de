import type { DecimalValue, FinancialValidationErrorCode, MoneyCents, Rate } from '../shared'
import type { AvailableFinancingResult, FinancingResult } from '../financing'
import type {
  AmortizationScheduleResult,
  AvailableAmortizationScheduleResult,
} from '../mortgage/amortization-types'

export interface RentalInvestmentInput {
  financing: FinancingResult
  amortization: AmortizationScheduleResult
  monthlyNetColdRentCents: number
  vacancyRate: DecimalValue
  otherAnnualRentLossCents: number
  /** Excludes the separately entered reserve contribution. */
  monthlyNonRecoverableHausgeldExcludingReserveCents: number
  monthlyReserveContributionCents: number
  annualMaintenanceAllowanceOutsideHausgeldCents: number
  otherAnnualOwnerCostsCents: number
  rentGrowthRate: DecimalValue
  ownerCostGrowthRate: DecimalValue
  holdingPeriodMonths: number
  /** Both sale assumptions must be provided together; omit both for no sale scenario. */
  propertyAppreciationRate?: DecimalValue
  sellingCostRate?: DecimalValue
}

export interface RentalCashFlowMonth {
  month: number
  effectiveRentCents: MoneyCents
  ownerCostsCents: MoneyCents
  regularMortgagePaymentCents: MoneyCents
  additionalRepaymentCents: MoneyCents
  preTaxCashFlowBeforeExtraCents: MoneyCents
  preTaxCashFlowAfterExtraCents: MoneyCents
  cumulativePreTaxCashFlowAfterExtraCents: MoneyCents
  remainingDebtCents: MoneyCents
}

export type CashOnCashResult =
  | {
      status: 'available'
      annualBeforeExtraReturn: Rate
      numeratorCents: MoneyCents
      denominatorCents: MoneyCents
    }
  | {
      status: 'unavailable'
      reason: 'ZERO_REQUIRED_EQUITY'
      numeratorCents: MoneyCents
      denominatorCents: MoneyCents
    }

export type ProjectedRentalSale =
  | { status: 'not-requested' }
  | {
      status: 'available'
      holdingPeriodMonths: number
      projectedSalePriceCents: MoneyCents
      sellingCostsCents: MoneyCents
      remainingDebtCents: MoneyCents
      propertyEquityCents: MoneyCents
      netSaleProceedsCents: MoneyCents
      cumulativeCashFlowCents: MoneyCents
      estimatedProfitBeforeTaxCents: MoneyCents
      propertyAppreciationRate: Rate
      sellingCostRate: Rate
    }

export interface AvailableRentalInvestmentResult {
  status: 'available'
  annualNetColdRentCents: MoneyCents
  effectiveAnnualRentCents: MoneyCents
  annualOwnerCostsCents: MoneyCents
  netOperatingIncomeCents: MoneyCents
  investmentCostBasisCents: MoneyCents
  grossRentalYield: Rate
  netRentalYield: Rate
  grossYieldBasis: { numeratorCents: MoneyCents; denominatorCents: MoneyCents }
  netYieldBasis: { numeratorCents: MoneyCents; denominatorCents: MoneyCents }
  firstMonth: RentalCashFlowMonth
  firstYearPreTaxCashFlowBeforeExtraCents: MoneyCents
  firstYearPreTaxCashFlowAfterExtraCents: MoneyCents
  cashOnCash: CashOnCashResult
  holdingPeriodMonths: number
  rows: readonly RentalCashFlowMonth[]
  remainingDebtAfterHoldingPeriodCents: MoneyCents
  debtReductionAfterHoldingPeriodCents: MoneyCents
  cumulativeCashFlowAfterHoldingPeriodCents: MoneyCents
  mortgageProjectionAssumption:
    | 'cash-purchase'
    | 'within-fixed-period-or-paid-off'
    | 'constant-initial-rate-beyond-fixed-period'
  sale: ProjectedRentalSale
}

export type RentalInvestmentResult =
  | AvailableRentalInvestmentResult
  | {
      status: 'unavailable'
      reason: 'FINANCING_UNAVAILABLE'
      financing: Exclude<FinancingResult, AvailableFinancingResult>
    }
  | {
      status: 'unavailable'
      reason: 'AMORTIZATION_UNAVAILABLE'
      amortization: Exclude<AmortizationScheduleResult, AvailableAmortizationScheduleResult>
    }
  | { status: 'unavailable'; reason: 'UNDERFUNDED_SCENARIO'; cashGapCents: MoneyCents }
  | {
      status: 'unavailable'
      reason: 'FINANCING_SCHEDULE_MISMATCH'
      financingLoanCents: MoneyCents
      schedulePrincipalCents: MoneyCents
    }
  | { status: 'unavailable'; reason: 'INCOMPLETE_MORTGAGE_SCHEDULE'; month: number }
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
