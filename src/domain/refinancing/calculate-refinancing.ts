import {
  FinancialValidationError,
  addRates,
  assertSafeInteger,
  financialValidationErrorCodes,
  initialRepaymentRate,
  moneyCents,
  multiplyMoney,
  nominalAnnualRate,
  nonNegativeMoneyCents,
  rate,
  safeDivide,
  subtractMoney,
  validationFailure,
  type DecimalValue,
  type MoneyCents,
  type Rate,
} from '../shared'
import { fullyAmortizingMonthlyPayment } from '../mortgage/payment-formulas'

import type {
  ComparisonAssumptionsMismatchRefinancingResult,
  RefinancingPaymentMode,
  RefinancingScenarioInput,
  RefinancingScenarioResult,
  RefinancingStressInput,
  RefinancingStressResult,
} from './types'

interface NormalizedScenario {
  id: string
  paymentMode: RefinancingPaymentMode
  futureNominalAnnualRate: Rate
  futureInitialRepaymentRate: Rate | null
  repaymentTermMonths: number | null
}

function requiredValue(value: DecimalValue | undefined, field: string): DecimalValue {
  if (value === undefined) {
    return validationFailure(
      financialValidationErrorCodes.required,
      field,
      field + ' is required',
      value,
    )
  }

  return value
}

function positiveTerm(value: number | undefined, field: string): number {
  if (value === undefined) {
    return validationFailure(
      financialValidationErrorCodes.required,
      field,
      field + ' is required',
      value,
    )
  }

  const months = assertSafeInteger(value, field)

  if (months <= 0) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      field,
      field + ' must be a positive whole month',
      value,
    )
  }

  return months
}

function normalizeScenario(value: RefinancingScenarioInput, index: number): NormalizedScenario {
  const field = 'scenarios[' + index + ']'

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return validationFailure(
      financialValidationErrorCodes.invalidType,
      field,
      field + ' must be a scenario object',
      value,
    )
  }

  if (typeof value.id !== 'string' || value.id.trim().length === 0) {
    return validationFailure(
      financialValidationErrorCodes.invalidType,
      field + '.id',
      field + '.id must be a non-empty string',
      value.id,
    )
  }

  if (value.paymentMode !== 'initial-repayment-rate' && value.paymentMode !== 'selected-term') {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      field + '.paymentMode',
      field + '.paymentMode is not supported',
      value.paymentMode,
    )
  }

  const futureNominalAnnualRate = nominalAnnualRate(
    requiredValue(value.futureNominalAnnualRate, field + '.futureNominalAnnualRate'),
    field + '.futureNominalAnnualRate',
  )

  if (value.paymentMode === 'initial-repayment-rate') {
    if (value.repaymentTermMonths !== undefined) {
      return validationFailure(
        financialValidationErrorCodes.outOfRange,
        field + '.repaymentTermMonths',
        'selected-term months cannot be combined with an initial repayment rate',
        value.repaymentTermMonths,
      )
    }

    return {
      id: value.id,
      paymentMode: value.paymentMode,
      futureNominalAnnualRate,
      futureInitialRepaymentRate: initialRepaymentRate(
        requiredValue(value.futureInitialRepaymentRate, field + '.futureInitialRepaymentRate'),
        field + '.futureInitialRepaymentRate',
      ),
      repaymentTermMonths: null,
    }
  }

  if (value.futureInitialRepaymentRate !== undefined) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      field + '.futureInitialRepaymentRate',
      'initial repayment rate cannot be combined with a selected repayment term',
      value.futureInitialRepaymentRate,
    )
  }

  return {
    id: value.id,
    paymentMode: value.paymentMode,
    futureNominalAnnualRate,
    futureInitialRepaymentRate: null,
    repaymentTermMonths: positiveTerm(value.repaymentTermMonths, field + '.repaymentTermMonths'),
  }
}

function comparisonMismatch(
  scenarios: readonly NormalizedScenario[],
): ComparisonAssumptionsMismatchRefinancingResult | null {
  const first = scenarios[0]

  if (!first) {
    return null
  }

  for (const scenario of scenarios.slice(1)) {
    if (scenario.paymentMode !== first.paymentMode) {
      return {
        status: 'unavailable',
        reason: 'COMPARISON_ASSUMPTIONS_MISMATCH',
        scenarioId: scenario.id,
        field: 'paymentMode',
      }
    }

    if (
      first.futureInitialRepaymentRate !== null &&
      scenario.futureInitialRepaymentRate !== null &&
      !scenario.futureInitialRepaymentRate.equals(first.futureInitialRepaymentRate)
    ) {
      return {
        status: 'unavailable',
        reason: 'COMPARISON_ASSUMPTIONS_MISMATCH',
        scenarioId: scenario.id,
        field: 'futureInitialRepaymentRate',
      }
    }

    if (scenario.repaymentTermMonths !== first.repaymentTermMonths) {
      return {
        status: 'unavailable',
        reason: 'COMPARISON_ASSUMPTIONS_MISMATCH',
        scenarioId: scenario.id,
        field: 'repaymentTermMonths',
      }
    }
  }

  return null
}

function futurePayment(
  remainingDebtCents: MoneyCents,
  scenario: NormalizedScenario,
): { amountCents: MoneyCents; firstMonthInterestCents: MoneyCents } {
  const monthlyNominalRate = rate(
    safeDivide(scenario.futureNominalAnnualRate, 12, 'monthsPerYear'),
    'monthlyNominalRate',
  )
  const firstMonthInterestCents = multiplyMoney(
    remainingDebtCents,
    monthlyNominalRate,
    'firstMonthInterestCents',
  )

  if (scenario.paymentMode === 'initial-repayment-rate') {
    if (scenario.futureInitialRepaymentRate === null) {
      throw new Error('Normalized initial-repayment scenario requires a repayment rate')
    }

    return {
      amountCents: multiplyMoney(
        remainingDebtCents,
        safeDivide(
          addRates([scenario.futureNominalAnnualRate, scenario.futureInitialRepaymentRate]),
          12,
          'monthsPerYear',
        ),
        'futureMonthlyPaymentCents',
      ),
      firstMonthInterestCents,
    }
  }

  if (scenario.repaymentTermMonths === null) {
    throw new Error('Normalized selected-term scenario requires a repayment term')
  }

  return {
    amountCents: fullyAmortizingMonthlyPayment(
      remainingDebtCents,
      monthlyNominalRate,
      scenario.repaymentTermMonths,
    ),
    firstMonthInterestCents,
  }
}

function calculateRefinancingStressInternal(
  input: RefinancingStressInput,
): RefinancingStressResult {
  const fixedPeriod = input.fixedPeriod

  if (fixedPeriod.status !== 'available') {
    return { status: 'unavailable', reason: 'FIXED_PERIOD_UNAVAILABLE', fixedPeriod }
  }

  if (fixedPeriod.refinancing.status === 'not-applicable') {
    return { status: 'not-applicable', reason: fixedPeriod.refinancing.reason }
  }

  if (
    fixedPeriod.cashPurchase ||
    fixedPeriod.fixedInterestMonths === null ||
    fixedPeriod.fixedInterestMonths <= 0 ||
    fixedPeriod.remainingDebtCents !== fixedPeriod.refinancing.remainingDebtCents ||
    fixedPeriod.remainingDebtCents <= 0
  ) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      'fixedPeriod',
      'fixedPeriod must contain consistent positive refinancing debt and a fixed period',
      fixedPeriod,
    )
  }

  const currentPayment = nonNegativeMoneyCents(
    input.currentContractualMonthlyPaymentCents,
    'currentContractualMonthlyPaymentCents',
  )

  // Keep the typed readonly collection after the runtime check: Array.isArray narrows to any[].
  if (!Array.isArray(input.scenarios as unknown)) {
    return validationFailure(
      financialValidationErrorCodes.invalidType,
      'scenarios',
      'scenarios must be an array',
      input.scenarios,
    )
  }

  if (input.scenarios.length === 0) {
    return validationFailure(
      financialValidationErrorCodes.required,
      'scenarios',
      'at least one future-rate scenario is required',
      input.scenarios,
    )
  }

  const seenIds = new Set<string>()
  const normalized = input.scenarios.map((scenario, index) => {
    const parsed = normalizeScenario(scenario, index)

    if (seenIds.has(parsed.id)) {
      return validationFailure(
        financialValidationErrorCodes.outOfRange,
        'scenarios[' + index + '].id',
        'scenario IDs must be unique',
        parsed.id,
      )
    }

    seenIds.add(parsed.id)
    return parsed
  })

  const mismatch = comparisonMismatch(normalized)

  if (mismatch) {
    return mismatch
  }

  const results: RefinancingScenarioResult[] = []

  for (const scenario of normalized) {
    const future = futurePayment(fixedPeriod.refinancing.remainingDebtCents, scenario)

    if (future.amountCents <= future.firstMonthInterestCents) {
      return {
        status: 'unavailable',
        reason: 'FUTURE_PAYMENT_NOT_AMORTIZING',
        scenarioId: scenario.id,
        futureMonthlyPaymentCents: future.amountCents,
        firstMonthInterestCents: future.firstMonthInterestCents,
      }
    }

    const change = subtractMoney(future.amountCents, currentPayment)
    results.push({
      id: scenario.id,
      paymentMode: scenario.paymentMode,
      futureNominalAnnualRate: scenario.futureNominalAnnualRate,
      futureInitialRepaymentRate: scenario.futureInitialRepaymentRate,
      repaymentTermMonths: scenario.repaymentTermMonths,
      futureMonthlyPaymentCents: future.amountCents,
      monthlyPaymentChangeCents: change,
      monthlyPaymentChangeRate:
        currentPayment === 0
          ? null
          : safeDivide(change, currentPayment, 'currentContractualMonthlyPaymentCents'),
    })
  }

  const first = normalized[0]

  if (!first) {
    throw new Error('Nonempty normalized refinancing scenarios are required')
  }

  return {
    status: 'available',
    assumptionKind: 'user-selected-stress-not-forecast',
    remainingDebtCents: moneyCents(fixedPeriod.refinancing.remainingDebtCents),
    fixedInterestMonths: fixedPeriod.fixedInterestMonths,
    currentContractualMonthlyPaymentCents: currentPayment,
    paymentMode: first.paymentMode,
    scenarios: results,
  }
}

export function calculateRefinancingStress(input: RefinancingStressInput): RefinancingStressResult {
  try {
    return calculateRefinancingStressInternal(input)
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
