import {
  FinancialValidationError,
  addMoney,
  financialValidationErrorCodes,
  maxMoney,
  minMoney,
  multiplyMoney,
  moneyCents,
  nonNegativeMoneyCents,
  proportionRate,
  rate,
  safeDivide,
  subtractMoney,
  sumMoney,
  validationFailure,
  type MoneyCents,
} from '../shared'

import type {
  AvailableFinancingResult,
  FinancingClassification,
  FinancingInput,
  FinancingResult,
} from './types'

function financingClassification(
  loanAmount: MoneyCents,
  purchasePrice: MoneyCents,
): FinancingClassification {
  if (loanAmount === purchasePrice) {
    return '100-percent'
  }

  return loanAmount > purchasePrice ? 'above-100-percent' : 'below-100-percent'
}

function selectedDownPayment(
  input: FinancingInput,
  purchasePrice: MoneyCents,
  availableEquity: MoneyCents,
  cashFundedTransactionCosts: MoneyCents,
  postPurchaseBudget: MoneyCents,
  financedAcquisitionCosts: MoneyCents,
): Pick<
  AvailableFinancingResult,
  | 'downPaymentCents'
  | 'requiredEquityCents'
  | 'loanAmountCents'
  | 'cashGapCents'
  | 'cashRemainingCents'
> {
  if (input.mode !== 'selected-down-payment') {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      'mode',
      'mode must be selected-down-payment',
      input.mode,
    )
  }

  const downPayment = nonNegativeMoneyCents(input.downPaymentCents, 'downPaymentCents')

  if (downPayment > purchasePrice) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      'downPaymentCents',
      'downPaymentCents must not exceed purchasePriceCents',
      input.downPaymentCents,
    )
  }

  const requiredEquity = sumMoney([downPayment, cashFundedTransactionCosts, postPurchaseBudget])
  const loanAmount = addMoney(subtractMoney(purchasePrice, downPayment), financedAcquisitionCosts)
  const zero = moneyCents(0)

  return {
    downPaymentCents: downPayment,
    requiredEquityCents: requiredEquity,
    loanAmountCents: loanAmount,
    cashGapCents: maxMoney(zero, subtractMoney(requiredEquity, availableEquity)),
    cashRemainingCents: maxMoney(zero, subtractMoney(availableEquity, requiredEquity)),
  }
}

function availableEquityAllocation(
  purchasePrice: MoneyCents,
  availableEquity: MoneyCents,
  cashFundedTransactionCosts: MoneyCents,
  postPurchaseBudget: MoneyCents,
  financedAcquisitionCosts: MoneyCents,
): Pick<
  AvailableFinancingResult,
  | 'downPaymentCents'
  | 'requiredEquityCents'
  | 'loanAmountCents'
  | 'cashGapCents'
  | 'cashRemainingCents'
> {
  const cashCostsBeforeDownPayment = addMoney(cashFundedTransactionCosts, postPurchaseBudget)
  const zero = moneyCents(0)
  const hasCashCostGap = availableEquity < cashCostsBeforeDownPayment
  const downPayment = hasCashCostGap
    ? zero
    : minMoney(purchasePrice, subtractMoney(availableEquity, cashCostsBeforeDownPayment))
  const cashGap = hasCashCostGap ? subtractMoney(cashCostsBeforeDownPayment, availableEquity) : zero
  const requiredEquity = sumMoney([downPayment, cashFundedTransactionCosts, postPurchaseBudget])
  const loanAmount = addMoney(subtractMoney(purchasePrice, downPayment), financedAcquisitionCosts)

  return {
    downPaymentCents: downPayment,
    requiredEquityCents: requiredEquity,
    loanAmountCents: loanAmount,
    cashGapCents: cashGap,
    cashRemainingCents: maxMoney(zero, subtractMoney(availableEquity, requiredEquity)),
  }
}

function calculateFinancingInternal(input: FinancingInput): FinancingResult {
  if (input.acquisition.status !== 'available') {
    return {
      status: 'unavailable',
      reason: 'ACQUISITION_COSTS_UNAVAILABLE',
      acquisition: input.acquisition,
    }
  }

  if (!financingModesInclude(input.mode)) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      'mode',
      'mode must be selected-down-payment or available-equity',
      input.mode,
    )
  }

  const acquisition = input.acquisition
  const purchasePrice = acquisition.purchasePriceCents
  const availableEquity = nonNegativeMoneyCents(input.availableEquityCents, 'availableEquityCents')
  const financedAcquisitionCostShare = proportionRate(
    input.financedAcquisitionCostShare,
    'financedAcquisitionCostShare',
  )
  const financedAcquisitionCosts = multiplyMoney(
    acquisition.transactionAcquisitionCostsCents,
    financedAcquisitionCostShare,
    'financedAcquisitionCostsCents',
  )
  const cashFundedTransactionCosts = subtractMoney(
    acquisition.transactionAcquisitionCostsCents,
    financedAcquisitionCosts,
  )
  const allocation =
    input.mode === 'selected-down-payment'
      ? selectedDownPayment(
          input,
          purchasePrice,
          availableEquity,
          cashFundedTransactionCosts,
          acquisition.postPurchaseBudgetCents,
          financedAcquisitionCosts,
        )
      : availableEquityAllocation(
          purchasePrice,
          availableEquity,
          cashFundedTransactionCosts,
          acquisition.postPurchaseBudgetCents,
          financedAcquisitionCosts,
        )
  const sourceOfFunds = addMoney(allocation.loanAmountCents, allocation.requiredEquityCents)

  if (sourceOfFunds !== acquisition.totalProjectCostCents) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      'sourceOfFunds',
      'loanAmountCents plus requiredEquityCents must equal totalProjectCostCents',
      sourceOfFunds,
    )
  }

  return {
    status: 'available',
    mode: input.mode,
    fundingStatus: allocation.cashGapCents > 0 ? 'underfunded' : 'funded',
    financingClassification: financingClassification(allocation.loanAmountCents, purchasePrice),
    acquisition,
    purchasePriceCents: purchasePrice,
    transactionAcquisitionCostsCents: acquisition.transactionAcquisitionCostsCents,
    postPurchaseBudgetCents: acquisition.postPurchaseBudgetCents,
    totalProjectCostCents: acquisition.totalProjectCostCents,
    availableEquityCents: availableEquity,
    financedAcquisitionCostShare,
    financedAcquisitionCostsCents: financedAcquisitionCosts,
    cashFundedTransactionCostsCents: cashFundedTransactionCosts,
    ...allocation,
    purchasePriceFinancingRatio: rate(
      safeDivide(allocation.loanAmountCents, purchasePrice, 'purchasePriceCents'),
      'purchasePriceFinancingRatio',
    ),
    sourceOfFundsBalanced: true,
  }
}

function financingModesInclude(value: unknown): value is FinancingInput['mode'] {
  return value === 'selected-down-payment' || value === 'available-equity'
}

export function calculateFinancing(input: FinancingInput): FinancingResult {
  try {
    return calculateFinancingInternal(input)
  } catch (error: unknown) {
    if (error instanceof FinancialValidationError) {
      return {
        status: 'unavailable',
        reason: 'VALIDATION_ERROR',
        error: {
          code: error.code,
          field: error.field,
          message: error.message,
          value: error.value,
        },
      }
    }

    throw error
  }
}
