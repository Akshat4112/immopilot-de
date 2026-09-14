import {
  FinancialValidationError,
  financialValidationErrorCodes,
  moneyCents,
  multiplyMoney,
  nonNegativeMoneyCents,
  proportionRate,
  sumMoney,
  validationFailure,
  type DecimalValue,
  type MoneyCents,
} from '../shared'

import {
  acquisitionAssumptionSetVersion,
  getTransferTaxRate,
  isGermanStateId,
  transferTaxRateSourceDate,
} from './tax-rates'
import type {
  AcquisitionAssumptionOrigin,
  AcquisitionCostInput,
  AcquisitionCostResult,
  AppliedAcquisitionRate,
  PostPurchaseBudgetInput,
  ResolvedPostPurchaseBudget,
  UnconfirmedBudgetField,
} from './types'

export const acquisitionCostDefaults = {
  notaryRate: '0.01',
  landRegisterRate: '0.005',
  buyerBrokerRate: '0.0357',
  brokerInvolved: false,
  renovationBudget: {
    amountCents: 0,
    budgetStatus: 'not-budgeted',
  },
  movingSetupCosts: {
    amountCents: 0,
    budgetStatus: 'not-budgeted',
  },
} as const

function resolvedRate(
  value: DecimalValue | undefined,
  fallback: DecimalValue,
  field: string,
  fallbackOrigin: AcquisitionAssumptionOrigin,
): AppliedAcquisitionRate {
  return {
    value: proportionRate(value === undefined ? fallback : value, field),
    origin: value === undefined ? fallbackOrigin : 'user-override',
  }
}

function resolvedBrokerInvolvement(value: boolean | undefined): boolean {
  if (value === undefined) {
    return acquisitionCostDefaults.brokerInvolved
  }

  if (typeof value !== 'boolean') {
    return validationFailure(
      financialValidationErrorCodes.invalidType,
      'brokerInvolved',
      'brokerInvolved must be a boolean',
      value,
    )
  }

  return value
}

function resolvedBudget(
  input: PostPurchaseBudgetInput | undefined,
  fallback: PostPurchaseBudgetInput,
  field: UnconfirmedBudgetField,
): ResolvedPostPurchaseBudget {
  const selected = input === undefined ? fallback : input

  if (typeof selected !== 'object' || selected === null) {
    return validationFailure(
      financialValidationErrorCodes.invalidType,
      field,
      field + ' must be an object',
      selected,
    )
  }

  const status = selected.budgetStatus

  if (!['not-budgeted', 'confirmed-zero', 'budgeted'].includes(status)) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      field + '.budgetStatus',
      field + '.budgetStatus is not supported',
      status,
    )
  }

  const amount = nonNegativeMoneyCents(selected.amountCents, field + '.amountCents')

  if (status === 'not-budgeted' && amount !== 0) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      field + '.amountCents',
      'A not-budgeted amount must be zero',
      amount,
    )
  }

  if (status === 'confirmed-zero' && amount !== 0) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      field + '.amountCents',
      'A confirmed-zero amount must be zero',
      amount,
    )
  }

  if (status === 'budgeted' && amount === 0) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      field + '.amountCents',
      'A budgeted amount must be greater than zero',
      amount,
    )
  }

  return {
    amountCents: amount,
    budgetStatus: status,
    origin: input === undefined ? 'assumption-default' : 'user-override',
  }
}

function requirePositivePurchasePrice(value: number): MoneyCents {
  const purchasePrice = nonNegativeMoneyCents(value, 'purchasePriceCents')

  if (purchasePrice === 0) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      'purchasePriceCents',
      'purchasePriceCents must be greater than zero',
      value,
    )
  }

  return purchasePrice
}

function calculateAcquisitionCostsInternal(input: AcquisitionCostInput): AcquisitionCostResult {
  const purchasePrice = requirePositivePurchasePrice(input.purchasePriceCents)
  const stateRate = getTransferTaxRate(input.stateId)

  if (!isGermanStateId(input.stateId)) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      'stateId',
      'stateId must identify one of the 16 German Bundeslaender',
      input.stateId,
    )
  }

  const transferTaxRate = resolvedRate(
    input.rateOverrides?.transferTaxRate,
    stateRate,
    'transferTaxRate',
    'state-lookup',
  )
  const notaryRate = resolvedRate(
    input.rateOverrides?.notaryRate,
    acquisitionCostDefaults.notaryRate,
    'notaryRate',
    'assumption-default',
  )
  const landRegisterRate = resolvedRate(
    input.rateOverrides?.landRegisterRate,
    acquisitionCostDefaults.landRegisterRate,
    'landRegisterRate',
    'assumption-default',
  )
  const buyerBrokerRate = resolvedRate(
    input.rateOverrides?.buyerBrokerRate,
    acquisitionCostDefaults.buyerBrokerRate,
    'buyerBrokerRate',
    'assumption-default',
  )
  const brokerInvolved = resolvedBrokerInvolvement(input.brokerInvolved)
  const renovationBudget = resolvedBudget(
    input.renovationBudget,
    acquisitionCostDefaults.renovationBudget,
    'renovationBudget',
  )
  const movingSetupCosts = resolvedBudget(
    input.movingSetupCosts,
    acquisitionCostDefaults.movingSetupCosts,
    'movingSetupCosts',
  )

  const transferTax = multiplyMoney(purchasePrice, transferTaxRate.value, 'transferTaxCents')
  const notaryCosts = multiplyMoney(purchasePrice, notaryRate.value, 'notaryCostsCents')
  const landRegisterCosts = multiplyMoney(
    purchasePrice,
    landRegisterRate.value,
    'landRegisterCostsCents',
  )
  const buyerBrokerCommission = brokerInvolved
    ? multiplyMoney(purchasePrice, buyerBrokerRate.value, 'buyerBrokerCommissionCents')
    : moneyCents(0)

  const transactionAcquisitionCosts = sumMoney([
    transferTax,
    notaryCosts,
    landRegisterCosts,
    buyerBrokerCommission,
  ])
  const appliedAssumptions = {
    assumptionSetVersion: acquisitionAssumptionSetVersion,
    transferTaxRateSourceDate,
    transferTaxRate,
    notaryRate,
    landRegisterRate,
    buyerBrokerRate,
    renovationBudget,
    movingSetupCosts,
  }
  const baseResult = {
    purchasePriceCents: purchasePrice,
    stateId: input.stateId,
    brokerInvolved,
    transferTaxCents: transferTax,
    notaryCostsCents: notaryCosts,
    landRegisterCostsCents: landRegisterCosts,
    buyerBrokerCommissionCents: buyerBrokerCommission,
    transactionAcquisitionCostsCents: transactionAcquisitionCosts,
    appliedAssumptions,
  }

  const unconfirmedBudgetFields: UnconfirmedBudgetField[] = []

  if (renovationBudget.budgetStatus === 'not-budgeted') {
    unconfirmedBudgetFields.push('renovationBudget')
  }

  if (movingSetupCosts.budgetStatus === 'not-budgeted') {
    unconfirmedBudgetFields.push('movingSetupCosts')
  }

  if (unconfirmedBudgetFields.length > 0) {
    return {
      ...baseResult,
      status: 'unavailable',
      reason: 'POST_PURCHASE_BUDGET_NOT_CONFIRMED',
      unconfirmedBudgetFields,
      postPurchaseBudgetCents: null,
      allAdditionalInitialOutlayCents: null,
      totalProjectCostCents: null,
    }
  }

  const postPurchaseBudget = sumMoney([renovationBudget.amountCents, movingSetupCosts.amountCents])
  const allAdditionalInitialOutlay = sumMoney([transactionAcquisitionCosts, postPurchaseBudget])

  return {
    ...baseResult,
    status: 'available',
    postPurchaseBudgetCents: postPurchaseBudget,
    allAdditionalInitialOutlayCents: allAdditionalInitialOutlay,
    totalProjectCostCents: sumMoney([purchasePrice, allAdditionalInitialOutlay]),
  }
}

export function calculateAcquisitionCosts(input: AcquisitionCostInput): AcquisitionCostResult {
  try {
    return calculateAcquisitionCostsInternal(input)
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
