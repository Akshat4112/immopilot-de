import type { ScenarioDashboardCalculationResult } from '../scenario-workspace'
import { calculateScenarioDashboard } from '../scenario-workspace'
import type { SavedScenario } from '../../storage'

export const comparisonMetricIds = [
  'purchasePrice',
  'acquisitionCosts',
  'equity',
  'loan',
  'monthlyPayment',
  'remainingDebt',
  'grossYield',
  'netYield',
  'monthlyCashFlow',
  'projectedReturn',
  'grossYieldCeiling',
  'netYieldCeiling',
  'affordabilityCeiling',
  'comparableValue',
  'openingOffer',
] as const

export type ComparisonMetricId = (typeof comparisonMetricIds)[number]

export type ComparisonMetricValue =
  | { status: 'available'; format: 'euro'; cents: number; basis?: string }
  | {
      status: 'available'
      format: 'percentage'
      rate: number
      numeratorCents?: number
      denominatorCents?: number
    }
  | { status: 'available'; format: 'euro-range'; lowCents: number; highCents: number }
  | { status: 'missing'; count: number }
  | { status: 'not-applicable' }
  | { status: 'unavailable' }

export interface ScenarioComparison {
  scenario: SavedScenario
  dashboard: ScenarioDashboardCalculationResult
  values: Record<ComparisonMetricId, ComparisonMetricValue>
}

function missing(count = 0): ComparisonMetricValue {
  return { status: 'missing', count }
}

function euro(cents: number, basis?: string): ComparisonMetricValue {
  return { status: 'available', format: 'euro', cents, ...(basis ? { basis } : {}) }
}

function acquisitionValue(
  dashboard: ScenarioDashboardCalculationResult,
  field: 'purchasePriceCents' | 'transactionAcquisitionCostsCents',
): ComparisonMetricValue {
  const acquisition = dashboard.acquisition
  if (!('purchasePriceCents' in acquisition)) return { status: 'unavailable' }
  return euro(
    field === 'purchasePriceCents'
      ? acquisition.purchasePriceCents
      : acquisition.transactionAcquisitionCostsCents,
  )
}

function financingValue(
  dashboard: ScenarioDashboardCalculationResult,
  field: 'requiredEquityCents' | 'loanAmountCents',
): ComparisonMetricValue {
  return dashboard.financing.status === 'available'
    ? euro(dashboard.financing[field])
    : { status: 'unavailable' }
}

function rentalMetric(
  dashboard: ScenarioDashboardCalculationResult,
  metric: 'grossYield' | 'netYield' | 'monthlyCashFlow',
): ComparisonMetricValue {
  if (dashboard.modeSpecific.mode !== 'rental-investment') return { status: 'not-applicable' }
  const result = dashboard.modeSpecific.result
  if (result.status === 'not-configured') return missing(result.missing.length)
  if (result.status !== 'available') return { status: 'unavailable' }

  if (metric === 'monthlyCashFlow') return euro(result.firstMonth.preTaxCashFlowBeforeExtraCents)
  const isGross = metric === 'grossYield'
  const basis = isGross ? result.grossYieldBasis : result.netYieldBasis
  return {
    status: 'available',
    format: 'percentage',
    rate: (isGross ? result.grossRentalYield : result.netRentalYield).toNumber(),
    numeratorCents: basis.numeratorCents,
    denominatorCents: basis.denominatorCents,
  }
}

function projectedReturn(dashboard: ScenarioDashboardCalculationResult): ComparisonMetricValue {
  if (dashboard.modeSpecific.mode === 'owner-occupier') {
    const modeResult = dashboard.modeSpecific.result
    if (modeResult.status === 'not-configured') return missing(modeResult.missing.length)
    if (modeResult.status !== 'available') return { status: 'unavailable' }
    return euro(
      modeResult.atAnalysisMonth.buyerMinusRenterCents,
      `owner:${modeResult.analysisMonths}`,
    )
  }
  const modeResult = dashboard.modeSpecific.result
  if (modeResult.status === 'not-configured') return missing(modeResult.missing.length)
  if (modeResult.status !== 'available') return { status: 'unavailable' }
  if (modeResult.sale.status !== 'available') return missing(2)
  return euro(
    modeResult.sale.estimatedProfitBeforeTaxCents,
    `rental:${modeResult.sale.holdingPeriodMonths}`,
  )
}

function offerMetric(
  dashboard: ScenarioDashboardCalculationResult,
  metric:
    | 'grossYieldCeiling'
    | 'netYieldCeiling'
    | 'affordabilityCeiling'
    | 'comparableValue'
    | 'openingOffer',
): ComparisonMetricValue {
  const offer = dashboard.offerPrice
  if (offer.status === 'not-configured') return missing(offer.missing.length)
  if (offer.status !== 'available') return { status: 'unavailable' }

  if (
    metric === 'grossYieldCeiling' ||
    metric === 'netYieldCeiling' ||
    metric === 'affordabilityCeiling'
  ) {
    const result = offer[metric]
    if (result.status === 'not-requested') return missing()
    return result.status === 'available'
      ? euro(result.priceCeilingCents)
      : { status: 'unavailable' }
  }

  const comparable = offer.comparableOffer
  if (comparable.status === 'not-requested') return missing()
  if (metric === 'comparableValue') {
    return {
      status: 'available',
      format: 'euro-range',
      lowCents: comparable.comparableValueLowCents,
      highCents: comparable.comparableValueHighCents,
    }
  }
  return comparable.openingOffer.status === 'available'
    ? {
        status: 'available',
        format: 'euro-range',
        lowCents: comparable.openingOffer.lowCents,
        highCents: comparable.openingOffer.highCents,
      }
    : missing()
}

export function calculateSavedScenarioComparison(scenario: SavedScenario): ScenarioComparison {
  const dashboard = calculateScenarioDashboard(
    scenario.inputs.purchaseCosts,
    scenario.inputs.financing,
    scenario.inputs.analysis,
    scenario.locale === 'en-GB' ? 'en' : 'de',
  )

  return {
    scenario,
    dashboard,
    values: {
      purchasePrice: acquisitionValue(dashboard, 'purchasePriceCents'),
      acquisitionCosts: acquisitionValue(dashboard, 'transactionAcquisitionCostsCents'),
      equity: financingValue(dashboard, 'requiredEquityCents'),
      loan: financingValue(dashboard, 'loanAmountCents'),
      monthlyPayment:
        dashboard.payment.status === 'available'
          ? euro(dashboard.payment.monthlyPaymentCents)
          : { status: 'unavailable' },
      remainingDebt:
        dashboard.baselineFixedPeriod.status === 'available' &&
        (dashboard.baselineFixedPeriod.cashPurchase ||
          dashboard.baselineFixedPeriod.fixedInterestMonths === null)
          ? { status: 'not-applicable' }
          : dashboard.baselineFixedPeriod.status === 'available'
            ? euro(
                dashboard.baselineFixedPeriod.remainingDebtCents,
                `fixed:${dashboard.baselineFixedPeriod.fixedInterestMonths}`,
              )
            : { status: 'unavailable' },
      grossYield: rentalMetric(dashboard, 'grossYield'),
      netYield: rentalMetric(dashboard, 'netYield'),
      monthlyCashFlow: rentalMetric(dashboard, 'monthlyCashFlow'),
      projectedReturn: projectedReturn(dashboard),
      grossYieldCeiling: offerMetric(dashboard, 'grossYieldCeiling'),
      netYieldCeiling: offerMetric(dashboard, 'netYieldCeiling'),
      affordabilityCeiling: offerMetric(dashboard, 'affordabilityCeiling'),
      comparableValue: offerMetric(dashboard, 'comparableValue'),
      openingOffer: offerMetric(dashboard, 'openingOffer'),
    },
  }
}

export function hasMixedComparisonBasis(
  comparisons: readonly ScenarioComparison[],
  metric: 'remainingDebt' | 'projectedReturn',
) {
  const bases = comparisons.flatMap((comparison) => {
    const value = comparison.values[metric]
    return value.status === 'available' && value.format === 'euro' && value.basis
      ? [value.basis]
      : []
  })
  return new Set(bases).size > 1
}
