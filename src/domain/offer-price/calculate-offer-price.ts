import type Decimal from 'decimal.js'

import { calculateAcquisitionCosts } from '../acquisition-costs'
import { calculateFinancing } from '../financing'
import { calculateMortgagePayment } from '../mortgage'
import {
  addRates,
  decimal,
  FinancialValidationError,
  financialValidationErrorCodes,
  initialRepaymentRate,
  moneyCents,
  nominalAnnualRate,
  nonNegativeMoneyCents,
  proportionRate,
  rate,
  roundHalfUpToInteger,
  safeDivide,
  subtractMoney,
  validationFailure,
  type MoneyCents,
  type Rate,
} from '../shared'
import type {
  AffordabilityCeilingResult,
  AffordabilityOfferInput,
  ComparableOfferInput,
  ComparableOfferResult,
  OfferPriceInput,
  OfferPriceResult,
  PriceCeilingResult,
} from './types'
import { maximumOfferPriceSearchCents } from './types'

function positiveTarget(value: unknown, field: string): Rate {
  const target = rate(value as Parameters<typeof rate>[0], field)
  if (target.lessThanOrEqualTo(0)) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      field,
      `${field} must be positive`,
      value,
    )
  }
  return target
}

function positiveMoney(value: unknown, field: string): MoneyCents {
  const amount = nonNegativeMoneyCents(value, field)
  if (amount === 0) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      field,
      `${field} must be positive`,
      value,
    )
  }
  return amount
}

function rounded(value: Decimal, field: string): MoneyCents {
  return moneyCents(roundHalfUpToInteger(value, field), field)
}

/** The whole safe-search interval is searched. A handful of nearby cents is insufficient
 * for payment rounding: a one-cent payment step can span hundreds of purchase-price cents. */
function highestVerifiedCent(feasible: (priceCents: MoneyCents) => boolean): MoneyCents | null {
  const limit = moneyCents(maximumOfferPriceSearchCents)
  if (feasible(limit)) return null // Never assert an unverified finite ceiling at the limit.
  let low = 0
  let high = maximumOfferPriceSearchCents - 1
  while (low < high) {
    const candidate = Math.floor((low + high + 1) / 2)
    if (feasible(moneyCents(candidate))) low = candidate
    else high = candidate - 1
  }
  const ceiling = moneyCents(low)
  if (feasible(moneyCents(low + 1))) {
    throw new Error('Offer-price cent search failed to find the maximal feasible price')
  }
  return ceiling
}

function grossYieldCeiling(input: OfferPriceInput, templatePrice: MoneyCents): PriceCeilingResult {
  if (input.targetGrossYield === undefined) return { status: 'not-requested' }
  const target = positiveTarget(input.targetGrossYield, 'targetGrossYield')
  if (!input.rental) return { status: 'unavailable', reason: 'RENTAL_METRICS_MISSING' }
  if (input.rental.status === 'unavailable') {
    return { status: 'unavailable', reason: 'RENTAL_METRICS_UNAVAILABLE' }
  }
  if (input.rental.grossYieldBasis.denominatorCents !== templatePrice) {
    return { status: 'unavailable', reason: 'RENTAL_SCENARIO_MISMATCH' }
  }
  const rawPrice = safeDivide(input.rental.annualNetColdRentCents, target, 'grossYieldPriceCeiling')
  if (rawPrice.greaterThanOrEqualTo(maximumOfferPriceSearchCents)) {
    return { status: 'unavailable', reason: 'PRICE_SEARCH_LIMIT_EXCEEDED' }
  }
  const ceiling = moneyCents(rawPrice.floor().toNumber(), 'grossYieldPriceCeilingCents')
  return {
    status: 'available',
    priceCeilingCents: ceiling,
    verifiedAgainstRoundedAcquisitionCosts: false, // The gross denominator is purchase price alone.
    nextCentFails: true,
  }
}

function netYieldCeiling(
  input: OfferPriceInput,
  templatePrice: MoneyCents,
  templateTotalCost: MoneyCents,
  fixedCosts: MoneyCents,
  proportionalRate: Rate,
): PriceCeilingResult {
  if (input.targetNetYield === undefined) return { status: 'not-requested' }
  const target = positiveTarget(input.targetNetYield, 'targetNetYield')
  if (!input.rental) return { status: 'unavailable', reason: 'RENTAL_METRICS_MISSING' }
  if (input.rental.status === 'unavailable') {
    return { status: 'unavailable', reason: 'RENTAL_METRICS_UNAVAILABLE' }
  }
  if (
    input.rental.grossYieldBasis.denominatorCents !== templatePrice ||
    input.rental.investmentCostBasisCents !== templateTotalCost
  ) {
    return { status: 'unavailable', reason: 'RENTAL_SCENARIO_MISMATCH' }
  }
  const netOperatingIncome = input.rental.netOperatingIncomeCents
  const analytical = safeDivide(
    safeDivide(netOperatingIncome, target, 'netYieldTarget').minus(fixedCosts),
    proportionalRate.plus(1),
    'netYieldPriceCeiling',
  )
  if (analytical.lessThan(0)) {
    return { status: 'unavailable', reason: 'NEGATIVE_ANALYTICAL_CEILING' }
  }

  const ceiling = highestVerifiedCent((price) => {
    if (price === 0) return true // Zero is a limit, not a real purchase.
    const acquisition = calculateAcquisitionCosts({
      ...input.acquisitionTemplate,
      purchasePriceCents: price,
    })
    return (
      acquisition.status === 'available' &&
      decimal(netOperatingIncome)
        .dividedBy(acquisition.totalProjectCostCents)
        .greaterThanOrEqualTo(target)
    )
  })
  if (ceiling === null) return { status: 'unavailable', reason: 'PRICE_SEARCH_LIMIT_EXCEEDED' }
  return {
    status: 'available',
    priceCeilingCents: ceiling,
    verifiedAgainstRoundedAcquisitionCosts: true,
    nextCentFails: true,
  }
}

function affordabilityCeiling(
  input: OfferPriceInput,
  fixedCosts: MoneyCents,
  proportionalRate: Rate,
): AffordabilityCeilingResult {
  if (input.affordability === undefined) return { status: 'not-requested' }
  const assumptions: AffordabilityOfferInput = input.affordability
  const availableEquity = nonNegativeMoneyCents(
    assumptions.availableEquityCents,
    'availableEquityCents',
  )
  const maximumMonthlyPayment = nonNegativeMoneyCents(
    assumptions.maximumMonthlyPaymentCents,
    'maximumMonthlyPaymentCents',
  )
  const financedCostShare = proportionRate(
    assumptions.financedAcquisitionCostShare,
    'financedAcquisitionCostShare',
  )
  const nominalRate = nominalAnnualRate(assumptions.nominalAnnualRate, 'nominalAnnualRate')
  const repaymentRate = initialRepaymentRate(
    assumptions.initialRepaymentRate,
    'initialRepaymentRate',
  )
  if (availableEquity < fixedCosts) {
    return { status: 'unavailable', reason: 'UNDERFUNDED_FIXED_COSTS' }
  }
  const combinedAnnualRate = addRates([nominalRate, repaymentRate])
  const loanCapacity = safeDivide(
    decimal(maximumMonthlyPayment).times(12),
    combinedAnnualRate,
    'loanCapacity',
  )
  const cashCostRate = proportionalRate.times(decimal(1).minus(financedCostShare))
  const cashCostConstraint = cashCostRate.greaterThan(0) ? 'bounded' : 'unbounded'
  // Analytical payment and cash limits inform the domain; the exact limit is searched
  // against independently rounded acquisition, available-equity funding and CF-004 payment.
  const paymentAnalytical = safeDivide(
    loanCapacity.plus(availableEquity).minus(fixedCosts),
    proportionalRate.plus(1),
    'paymentBasedPriceCeiling',
  )
  const cashAnalytical =
    cashCostConstraint === 'bounded'
      ? safeDivide(
          decimal(availableEquity).minus(fixedCosts),
          cashCostRate,
          'cashBasedPriceCeiling',
        )
      : null
  if (paymentAnalytical.lessThan(0) || (cashAnalytical !== null && cashAnalytical.lessThan(0))) {
    return { status: 'unavailable', reason: 'UNDERFUNDED_FIXED_COSTS' }
  }

  const ceiling = highestVerifiedCent((price) => {
    if (price === 0) return true
    const acquisition = calculateAcquisitionCosts({
      ...input.acquisitionTemplate,
      purchasePriceCents: price,
    })
    if (acquisition.status !== 'available') return false
    const financing = calculateFinancing({
      mode: 'available-equity',
      acquisition,
      availableEquityCents: availableEquity,
      financedAcquisitionCostShare: financedCostShare,
    })
    if (financing.status !== 'available' || financing.fundingStatus !== 'funded') return false
    const payment = calculateMortgagePayment({
      paymentMode: 'initial-repayment-rate',
      financing,
      nominalAnnualRate: nominalRate,
      initialRepaymentRate: repaymentRate,
    })
    return payment.status === 'available' && payment.monthlyPaymentCents <= maximumMonthlyPayment
  })
  if (ceiling === null) return { status: 'unavailable', reason: 'PRICE_SEARCH_LIMIT_EXCEEDED' }
  const capacityCents = moneyCents(loanCapacity.floor().toNumber(), 'loanCapacityCents')
  return {
    status: 'available',
    priceCeilingCents: ceiling,
    verifiedAgainstRoundedAcquisitionCosts: true,
    nextCentFails: true,
    cashCostConstraint,
    loanCapacityCents: capacityCents,
    maximumMonthlyPaymentCents: maximumMonthlyPayment,
    availableEquityCents: availableEquity,
  }
}

function comparableOffer(input?: ComparableOfferInput): ComparableOfferResult {
  if (input === undefined) return { status: 'not-requested' }
  const asking = positiveMoney(input.askingPriceCents, 'askingPriceCents')
  const offered = nonNegativeMoneyCents(input.purchaseOfferCents, 'purchaseOfferCents')
  const area = decimal(input.livingAreaSquareMetres, 'livingAreaSquareMetres')
  if (area.lessThanOrEqualTo(0)) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      'livingAreaSquareMetres',
      'livingAreaSquareMetres must be positive',
      input.livingAreaSquareMetres,
    )
  }
  const lowPerMetre = nonNegativeMoneyCents(
    input.comparablePricePerSquareMetreLowCents,
    'comparablePricePerSquareMetreLowCents',
  )
  const highPerMetre = nonNegativeMoneyCents(
    input.comparablePricePerSquareMetreHighCents,
    'comparablePricePerSquareMetreHighCents',
  )
  if (lowPerMetre > highPerMetre) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      'comparablePricePerSquareMetreLowCents',
      'Comparable €/m² lower limit must not exceed upper limit',
      lowPerMetre,
    )
  }
  const offerDifferenceCents = subtractMoney(offered, asking)
  const differenceRate = rate(safeDivide(offerDifferenceCents, asking, 'offerDifferenceRate'))
  let openingOffer: Extract<ComparableOfferResult, { status: 'available' }>['openingOffer'] = {
    status: 'not-requested',
  }
  if (input.openingOffer !== undefined) {
    const reference = positiveMoney(input.openingOffer.referencePriceCents, 'referencePriceCents')
    const larger = proportionRate(input.openingOffer.largerDiscount, 'largerDiscount')
    const smaller = proportionRate(input.openingOffer.smallerDiscount, 'smallerDiscount')
    if (larger.greaterThanOrEqualTo(1) || smaller.greaterThan(larger)) {
      return validationFailure(
        financialValidationErrorCodes.outOfRange,
        'largerDiscount',
        'Require 0 ≤ smallerDiscount ≤ largerDiscount < 1',
        input.openingOffer.largerDiscount,
      )
    }
    openingOffer = {
      status: 'available',
      referencePriceCents: reference,
      largerDiscount: larger,
      smallerDiscount: smaller,
      lowCents: rounded(decimal(reference).times(decimal(1).minus(larger)), 'openingOfferLowCents'),
      highCents: rounded(
        decimal(reference).times(decimal(1).minus(smaller)),
        'openingOfferHighCents',
      ),
    }
  }
  return {
    status: 'available',
    comparableValueLowCents: rounded(area.times(lowPerMetre), 'comparableValueLowCents'),
    comparableValueHighCents: rounded(area.times(highPerMetre), 'comparableValueHighCents'),
    askingPriceCents: asking,
    purchaseOfferCents: offered,
    offerDifferenceCents,
    offerDifferenceRate: differenceRate,
    openingOffer,
  }
}

function calculateAvailable(input: OfferPriceInput): OfferPriceResult {
  const template = calculateAcquisitionCosts(input.acquisitionTemplate)
  if (template.status === 'unavailable') {
    return {
      status: 'unavailable',
      reason: 'ACQUISITION_TEMPLATE_UNAVAILABLE',
      acquisition: template,
    }
  }
  const assumptions = template.appliedAssumptions
  const proportionalRate = addRates([
    assumptions.transferTaxRate.value,
    assumptions.notaryRate.value,
    assumptions.landRegisterRate.value,
    ...(template.brokerInvolved ? [assumptions.buyerBrokerRate.value] : []),
  ])
  const fixedCosts = template.postPurchaseBudgetCents
  return {
    status: 'available',
    acquisitionTemplate: template,
    proportionalAcquisitionCostRate: proportionalRate,
    fixedInitialCostsCents: fixedCosts,
    grossYieldCeiling: grossYieldCeiling(input, template.purchasePriceCents),
    netYieldCeiling: netYieldCeiling(
      input,
      template.purchasePriceCents,
      template.totalProjectCostCents,
      fixedCosts,
      proportionalRate,
    ),
    affordabilityCeiling: affordabilityCeiling(input, fixedCosts, proportionalRate),
    comparableOffer: comparableOffer(input.comparables),
  }
}

export function calculateOfferPrice(input: OfferPriceInput): OfferPriceResult {
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
