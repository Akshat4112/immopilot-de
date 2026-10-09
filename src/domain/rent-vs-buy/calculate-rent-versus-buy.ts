import type Decimal from 'decimal.js'

import {
  addMoney,
  annualEffectiveToMonthlyRate,
  assertSafeInteger,
  decimal,
  FinancialValidationError,
  financialValidationErrorCodes,
  maxMoney,
  moneyCents,
  multiplyMoney,
  nonNegativeMoneyCents,
  proportionRate,
  roundHalfUpToInteger,
  subtractMoney,
  validationFailure,
  type MoneyCents,
} from '../shared'
import { maximumAmortizationMonths } from '../mortgage/amortization-types'
import type {
  AvailableRentVersusBuyResult,
  RentVersusBuyInput,
  RentVersusBuyMonth,
  RentVersusBuyResult,
} from './types'

function reportedCents(value: Decimal, field: string): MoneyCents {
  return moneyCents(roundHalfUpToInteger(value, field), field)
}

function calculateAvailable(input: RentVersusBuyInput): RentVersusBuyResult {
  if (input.financing.status === 'unavailable') {
    return { status: 'unavailable', reason: 'FINANCING_UNAVAILABLE', financing: input.financing }
  }
  if (input.amortization.status === 'unavailable') {
    return {
      status: 'unavailable',
      reason: 'AMORTIZATION_UNAVAILABLE',
      amortization: input.amortization,
    }
  }
  const { financing, amortization } = input
  if (financing.fundingStatus === 'underfunded') {
    return {
      status: 'unavailable',
      reason: 'UNDERFUNDED_SCENARIO',
      cashGapCents: financing.cashGapCents,
    }
  }
  if (financing.loanAmountCents !== amortization.principalCents) {
    return {
      status: 'unavailable',
      reason: 'FINANCING_SCHEDULE_MISMATCH',
      financingLoanCents: financing.loanAmountCents,
      schedulePrincipalCents: amortization.principalCents,
    }
  }

  const analysisMonths = assertSafeInteger(input.analysisMonths, 'analysisMonths')
  if (analysisMonths < 1 || analysisMonths > maximumAmortizationMonths) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      'analysisMonths',
      `analysisMonths must be between 1 and ${maximumAmortizationMonths}`,
      input.analysisMonths,
    )
  }
  const currentRent = nonNegativeMoneyCents(
    input.currentComparableRentCents,
    'currentComparableRentCents',
  )
  const initialOwnerCosts = nonNegativeMoneyCents(
    input.monthlyOwnerCostsCents,
    'monthlyOwnerCostsCents',
  )
  const monthlyRentGrowth = annualEffectiveToMonthlyRate(input.rentGrowthRate, 'rentGrowthRate')
  const monthlyOwnerGrowth = annualEffectiveToMonthlyRate(
    input.ownerCostGrowthRate,
    'ownerCostGrowthRate',
  )
  const monthlyAppreciation = annualEffectiveToMonthlyRate(
    input.propertyAppreciationRate,
    'propertyAppreciationRate',
  )
  const monthlyReturn = annualEffectiveToMonthlyRate(
    input.alternativeReturnRate,
    'alternativeReturnRate',
  )
  const sellingCostRate = proportionRate(input.sellingCostRate ?? 0, 'sellingCostRate')
  if (typeof input.includeAdditionalRepaymentsInMatchedBudget !== 'boolean') {
    return validationFailure(
      financialValidationErrorCodes.invalidType,
      'includeAdditionalRepaymentsInMatchedBudget',
      'includeAdditionalRepaymentsInMatchedBudget must be a boolean',
      input.includeAdditionalRepaymentsInMatchedBudget,
    )
  }

  const necessaryMonths = Math.min(analysisMonths, amortization.payoffMonth)
  for (let month = 1; month <= necessaryMonths; month += 1) {
    if (amortization.rows[month - 1]?.month !== month) {
      return { status: 'unavailable', reason: 'INCOMPLETE_MORTGAGE_SCHEDULE', month }
    }
  }
  if (
    !input.includeAdditionalRepaymentsInMatchedBudget &&
    amortization.rows.slice(0, analysisMonths).some((row) => row.additionalPrincipalCents > 0)
  ) {
    return { status: 'unavailable', reason: 'UNMATCHED_ADDITIONAL_REPAYMENTS' }
  }

  const zero = moneyCents(0)
  const rentGrowthFactor = monthlyRentGrowth.plus(1)
  const ownerGrowthFactor = monthlyOwnerGrowth.plus(1)
  const appreciationFactor = monthlyAppreciation.plus(1)
  const returnFactor = monthlyReturn.plus(1)
  const purchasePrice = decimal(financing.purchasePriceCents)
  let buyerPortfolio = decimal(0)
  let renterPortfolio = decimal(financing.requiredEquityCents)
  let firstBreakEvenMonth: number | null = null
  const rows: RentVersusBuyMonth[] = []

  for (let month = 1; month <= analysisMonths; month += 1) {
    const mortgageRow = amortization.rows[month - 1]
    const monthlyRentCents = multiplyMoney(
      currentRent,
      rentGrowthFactor.pow(month - 1),
      'monthlyRentCents',
    )
    const monthlyOwnerCostsCents = multiplyMoney(
      initialOwnerCosts,
      ownerGrowthFactor.pow(month - 1),
      'monthlyOwnerCostsCents',
    )
    const regularMortgagePaymentCents = mortgageRow?.regularPaymentCents ?? zero
    const additionalRepaymentCents = mortgageRow?.additionalPrincipalCents ?? zero
    const remainingMortgageDebtCents = mortgageRow?.closingBalanceCents ?? zero
    const buyerHousingOutflowCents = addMoney(
      addMoney(regularMortgagePaymentCents, monthlyOwnerCostsCents),
      input.includeAdditionalRepaymentsInMatchedBudget ? additionalRepaymentCents : zero,
    )
    const renterHousingOutflowCents = monthlyRentCents
    const commonBudgetCents = maxMoney(buyerHousingOutflowCents, renterHousingOutflowCents)
    const buyerInvestmentContributionCents = subtractMoney(
      commonBudgetCents,
      buyerHousingOutflowCents,
    )
    const renterInvestmentContributionCents = subtractMoney(
      commonBudgetCents,
      renterHousingOutflowCents,
    )
    buyerPortfolio = buyerPortfolio.times(returnFactor).plus(buyerInvestmentContributionCents)
    renterPortfolio = renterPortfolio.times(returnFactor).plus(renterInvestmentContributionCents)

    const propertyValue = purchasePrice.times(appreciationFactor.pow(month))
    const hypotheticalSellingCosts = propertyValue.times(sellingCostRate)
    const buyerNetWealth = propertyValue
      .minus(hypotheticalSellingCosts)
      .minus(remainingMortgageDebtCents)
      .plus(buyerPortfolio)
    const difference = buyerNetWealth.minus(renterPortfolio)
    if (firstBreakEvenMonth === null && difference.greaterThanOrEqualTo(0)) {
      firstBreakEvenMonth = month
    }
    rows.push({
      month,
      projectedPropertyValueCents: reportedCents(propertyValue, 'projectedPropertyValueCents'),
      hypotheticalSellingCostsCents: reportedCents(
        hypotheticalSellingCosts,
        'hypotheticalSellingCostsCents',
      ),
      remainingMortgageDebtCents,
      monthlyRentCents,
      monthlyOwnerCostsCents,
      regularMortgagePaymentCents,
      additionalRepaymentCents,
      buyerHousingOutflowCents,
      renterHousingOutflowCents,
      commonBudgetCents,
      buyerInvestmentContributionCents,
      renterInvestmentContributionCents,
      buyerAlternativePortfolioCents: reportedCents(
        buyerPortfolio,
        'buyerAlternativePortfolioCents',
      ),
      renterAlternativePortfolioCents: reportedCents(
        renterPortfolio,
        'renterAlternativePortfolioCents',
      ),
      buyerNetWealthCents: reportedCents(buyerNetWealth, 'buyerNetWealthCents'),
      renterNetWealthCents: reportedCents(renterPortfolio, 'renterNetWealthCents'),
      buyerMinusRenterCents: reportedCents(difference, 'buyerMinusRenterCents'),
    })
  }

  return {
    status: 'available',
    comparisonBasis: 'matched-budget-liquidation',
    analysisMonths,
    requiredEquityCents: financing.requiredEquityCents,
    appliedSellingCostRate: sellingCostRate,
    includeAdditionalRepaymentsInMatchedBudget: input.includeAdditionalRepaymentsInMatchedBudget,
    mortgageProjectionAssumption: amortization.cashPurchase
      ? 'cash-purchase'
      : analysisMonths <= amortization.fixedInterestMonths
        ? 'within-fixed-period'
        : amortization.payoffMonth <= amortization.fixedInterestMonths
          ? 'within-fixed-period-or-paid-off'
          : 'constant-initial-rate-beyond-fixed-period',
    rows,
    atAnalysisMonth: rows[rows.length - 1] as RentVersusBuyMonth,
    breakEven:
      firstBreakEvenMonth === null
        ? { status: 'not-reached-within-horizon', analysisMonths }
        : {
            status: 'reached',
            firstMonth: firstBreakEvenMonth,
            year: Math.ceil(firstBreakEvenMonth / 12),
          },
  } satisfies AvailableRentVersusBuyResult
}

export function calculateRentVersusBuy(input: RentVersusBuyInput): RentVersusBuyResult {
  try {
    return calculateAvailable(input)
  } catch (error) {
    if (!(error instanceof FinancialValidationError)) throw error
    return {
      status: 'unavailable',
      reason: 'VALIDATION_ERROR',
      error: { code: error.code, field: error.field, message: error.message, value: error.value },
    }
  }
}
