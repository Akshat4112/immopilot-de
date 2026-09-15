import {
  addMoney,
  annualEffectiveToMonthlyRate,
  assertSafeInteger,
  decimal,
  FinancialValidationError,
  financialValidationErrorCodes,
  moneyCents,
  multiplyMoney,
  nonNegativeMoneyCents,
  proportionRate,
  rate,
  roundHalfUpToInteger,
  safeDivide,
  subtractMoney,
  sumMoney,
  validationFailure,
  type MoneyCents,
} from '../shared'
import { maximumAmortizationMonths } from '../mortgage/amortization-types'
import type {
  AvailableRentalInvestmentResult,
  ProjectedRentalSale,
  RentalCashFlowMonth,
  RentalInvestmentInput,
  RentalInvestmentResult,
} from './types'

function roundCents(value: ReturnType<typeof decimal>, field: string): MoneyCents {
  return moneyCents(roundHalfUpToInteger(value, field), field)
}

function calculateAvailable(input: RentalInvestmentInput): RentalInvestmentResult {
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

  const holdingPeriodMonths = assertSafeInteger(input.holdingPeriodMonths, 'holdingPeriodMonths')
  if (holdingPeriodMonths < 1 || holdingPeriodMonths > maximumAmortizationMonths) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      'holdingPeriodMonths',
      `holdingPeriodMonths must be between 1 and ${maximumAmortizationMonths}`,
      input.holdingPeriodMonths,
    )
  }
  const monthlyColdRent = nonNegativeMoneyCents(
    input.monthlyNetColdRentCents,
    'monthlyNetColdRentCents',
  )
  const vacancyRate = proportionRate(input.vacancyRate, 'vacancyRate')
  const otherAnnualRentLoss = nonNegativeMoneyCents(
    input.otherAnnualRentLossCents,
    'otherAnnualRentLossCents',
  )
  const monthlyHausgeld = nonNegativeMoneyCents(
    input.monthlyNonRecoverableHausgeldExcludingReserveCents,
    'monthlyNonRecoverableHausgeldExcludingReserveCents',
  )
  const monthlyReserve = nonNegativeMoneyCents(
    input.monthlyReserveContributionCents,
    'monthlyReserveContributionCents',
  )
  const annualMaintenance = nonNegativeMoneyCents(
    input.annualMaintenanceAllowanceOutsideHausgeldCents,
    'annualMaintenanceAllowanceOutsideHausgeldCents',
  )
  const otherAnnualOwnerCosts = nonNegativeMoneyCents(
    input.otherAnnualOwnerCostsCents,
    'otherAnnualOwnerCostsCents',
  )
  const monthlyRentGrowth = annualEffectiveToMonthlyRate(input.rentGrowthRate, 'rentGrowthRate')
  const monthlyOwnerGrowth = annualEffectiveToMonthlyRate(
    input.ownerCostGrowthRate,
    'ownerCostGrowthRate',
  )
  const saleRequested =
    input.propertyAppreciationRate !== undefined || input.sellingCostRate !== undefined
  if (saleRequested && input.propertyAppreciationRate === undefined) {
    return validationFailure(
      financialValidationErrorCodes.required,
      'propertyAppreciationRate',
      'propertyAppreciationRate is required for a projected sale',
      input.propertyAppreciationRate,
    )
  }
  if (saleRequested && input.sellingCostRate === undefined) {
    return validationFailure(
      financialValidationErrorCodes.required,
      'sellingCostRate',
      'sellingCostRate is required for a projected sale',
      input.sellingCostRate,
    )
  }
  const monthlyAppreciation = saleRequested
    ? annualEffectiveToMonthlyRate(input.propertyAppreciationRate!, 'propertyAppreciationRate')
    : null
  const sellingCostRate = saleRequested
    ? proportionRate(input.sellingCostRate!, 'sellingCostRate')
    : null

  const annualNetColdRentCents = multiplyMoney(monthlyColdRent, 12, 'annualNetColdRentCents')
  const rentAfterVacancy = multiplyMoney(
    annualNetColdRentCents,
    decimal(1).minus(vacancyRate),
    'rentAfterVacancyCents',
  )
  if (otherAnnualRentLoss > rentAfterVacancy) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      'otherAnnualRentLossCents',
      'Combined vacancy and other rent loss must not produce negative effective rent',
      otherAnnualRentLoss,
    )
  }
  const effectiveAnnualRentCents = subtractMoney(rentAfterVacancy, otherAnnualRentLoss)
  const annualOwnerCostsCents = sumMoney([
    multiplyMoney(monthlyHausgeld, 12, 'annualHausgeldCents'),
    multiplyMoney(monthlyReserve, 12, 'annualReserveCents'),
    annualMaintenance,
    otherAnnualOwnerCosts,
  ])
  const netOperatingIncomeCents = subtractMoney(effectiveAnnualRentCents, annualOwnerCostsCents)
  const purchasePrice = financing.purchasePriceCents
  const investmentCostBasisCents = financing.totalProjectCostCents
  const grossRentalYield = rate(
    safeDivide(annualNetColdRentCents, purchasePrice, 'grossRentalYield'),
  )
  const netRentalYield = rate(
    safeDivide(netOperatingIncomeCents, investmentCostBasisCents, 'netRentalYield'),
  )

  // First-year operating summary is defined for months 1..12 even when the holding period is shorter.
  const modeledMonths = Math.max(12, holdingPeriodMonths)
  const necessaryMortgageMonths = Math.min(modeledMonths, amortization.payoffMonth)
  for (let month = 1; month <= necessaryMortgageMonths; month += 1) {
    if (amortization.rows[month - 1]?.month !== month) {
      return { status: 'unavailable', reason: 'INCOMPLETE_MORTGAGE_SCHEDULE', month }
    }
  }

  const zero = moneyCents(0)
  const rentFactor = monthlyRentGrowth.plus(1)
  const ownerFactor = monthlyOwnerGrowth.plus(1)
  const initialMonthlyEffectiveRent = decimal(effectiveAnnualRentCents).dividedBy(12)
  const initialMonthlyOwnerCosts = decimal(annualOwnerCostsCents).dividedBy(12)
  let cumulative = zero
  let cumulativeAtHolding = zero
  const rows: RentalCashFlowMonth[] = []
  for (let month = 1; month <= modeledMonths; month += 1) {
    const mortgage = amortization.rows[month - 1]
    const effectiveRentCents = roundCents(
      initialMonthlyEffectiveRent.times(rentFactor.pow(month - 1)),
      'effectiveRentCents',
    )
    const ownerCostsCents = roundCents(
      initialMonthlyOwnerCosts.times(ownerFactor.pow(month - 1)),
      'ownerCostsCents',
    )
    const regularMortgagePaymentCents = mortgage?.regularPaymentCents ?? zero
    const additionalRepaymentCents = mortgage?.additionalPrincipalCents ?? zero
    const preTaxCashFlowBeforeExtraCents = subtractMoney(
      subtractMoney(effectiveRentCents, ownerCostsCents),
      regularMortgagePaymentCents,
    )
    const preTaxCashFlowAfterExtraCents = subtractMoney(
      preTaxCashFlowBeforeExtraCents,
      additionalRepaymentCents,
    )
    cumulative = addMoney(cumulative, preTaxCashFlowAfterExtraCents)
    if (month === holdingPeriodMonths) cumulativeAtHolding = cumulative
    rows.push({
      month,
      effectiveRentCents,
      ownerCostsCents,
      regularMortgagePaymentCents,
      additionalRepaymentCents,
      preTaxCashFlowBeforeExtraCents,
      preTaxCashFlowAfterExtraCents,
      cumulativePreTaxCashFlowAfterExtraCents: cumulative,
      remainingDebtCents: mortgage?.closingBalanceCents ?? zero,
    })
  }

  const firstYearPreTaxCashFlowBeforeExtraCents = sumMoney(
    rows.slice(0, 12).map((row) => row.preTaxCashFlowBeforeExtraCents),
  )
  const firstYearPreTaxCashFlowAfterExtraCents = sumMoney(
    rows.slice(0, 12).map((row) => row.preTaxCashFlowAfterExtraCents),
  )
  const requiredEquity = financing.requiredEquityCents
  const cashOnCash =
    requiredEquity === 0
      ? {
          status: 'unavailable' as const,
          reason: 'ZERO_REQUIRED_EQUITY' as const,
          numeratorCents: firstYearPreTaxCashFlowBeforeExtraCents,
          denominatorCents: requiredEquity,
        }
      : {
          status: 'available' as const,
          annualBeforeExtraReturn: rate(
            safeDivide(firstYearPreTaxCashFlowBeforeExtraCents, requiredEquity, 'cashOnCashReturn'),
          ),
          numeratorCents: firstYearPreTaxCashFlowBeforeExtraCents,
          denominatorCents: requiredEquity,
        }
  const remainingDebtAfterHoldingPeriodCents = rows[holdingPeriodMonths - 1]!.remainingDebtCents
  const debtReductionAfterHoldingPeriodCents = subtractMoney(
    amortization.principalCents,
    remainingDebtAfterHoldingPeriodCents,
  )

  let sale: ProjectedRentalSale = { status: 'not-requested' }
  if (monthlyAppreciation !== null && sellingCostRate !== null) {
    const projectedSalePriceCents = multiplyMoney(
      purchasePrice,
      monthlyAppreciation.plus(1).pow(holdingPeriodMonths),
      'projectedSalePriceCents',
    )
    const sellingCostsCents = multiplyMoney(
      projectedSalePriceCents,
      sellingCostRate,
      'sellingCostsCents',
    )
    const propertyEquityCents = subtractMoney(
      projectedSalePriceCents,
      remainingDebtAfterHoldingPeriodCents,
    )
    const netSaleProceedsCents = subtractMoney(propertyEquityCents, sellingCostsCents)
    sale = {
      status: 'available',
      holdingPeriodMonths,
      projectedSalePriceCents,
      sellingCostsCents,
      remainingDebtCents: remainingDebtAfterHoldingPeriodCents,
      propertyEquityCents,
      netSaleProceedsCents,
      cumulativeCashFlowCents: cumulativeAtHolding,
      estimatedProfitBeforeTaxCents: subtractMoney(
        addMoney(netSaleProceedsCents, cumulativeAtHolding),
        requiredEquity,
      ),
      propertyAppreciationRate: rate(input.propertyAppreciationRate!, 'propertyAppreciationRate'),
      sellingCostRate,
    }
  }

  return {
    status: 'available',
    annualNetColdRentCents,
    effectiveAnnualRentCents,
    annualOwnerCostsCents,
    netOperatingIncomeCents,
    investmentCostBasisCents,
    grossRentalYield,
    netRentalYield,
    grossYieldBasis: { numeratorCents: annualNetColdRentCents, denominatorCents: purchasePrice },
    netYieldBasis: {
      numeratorCents: netOperatingIncomeCents,
      denominatorCents: investmentCostBasisCents,
    },
    firstMonth: rows[0]!,
    firstYearPreTaxCashFlowBeforeExtraCents,
    firstYearPreTaxCashFlowAfterExtraCents,
    cashOnCash,
    holdingPeriodMonths,
    rows,
    remainingDebtAfterHoldingPeriodCents,
    debtReductionAfterHoldingPeriodCents,
    cumulativeCashFlowAfterHoldingPeriodCents: cumulativeAtHolding,
    mortgageProjectionAssumption: amortization.cashPurchase
      ? 'cash-purchase'
      : holdingPeriodMonths <= amortization.fixedInterestMonths ||
          amortization.payoffMonth <= amortization.fixedInterestMonths
        ? 'within-fixed-period-or-paid-off'
        : 'constant-initial-rate-beyond-fixed-period',
    sale,
  } satisfies AvailableRentalInvestmentResult
}

export function calculateRentalInvestment(input: RentalInvestmentInput): RentalInvestmentResult {
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
