import Decimal from 'decimal.js'
import { z } from 'zod'

import assumptionSet from '../../../data/assumptions/de-2026.09.json'
import { calculationMetadata } from '../../config/releaseMetadata'
import type { ScenarioAnalysisDraft, ScenarioWorkspaceSnapshot } from '../../config/scenarioDrafts'
import { parseScenarioJson, scenarioInputsSchema, SCENARIO_SCHEMA_VERSION } from '../../storage'
import type { SavedScenario, ScenarioLibraryIssue } from '../../storage'
import {
  calculateScenarioDashboard,
  type ScenarioDashboardCalculationResult,
} from '../scenario-workspace'
import {
  calculateSavedScenarioComparison,
  comparisonMetricIds,
  hasMixedComparisonBasis,
  type ComparisonMetricId,
  type ComparisonMetricValue,
} from '../comparison'

export const REPORT_CONTRACT_VERSION = '1.0.0'

/** Decimal rates remain exact strings; all other domain discriminants and cents retain their types. */
export type ReportValue<T> = T extends Decimal
  ? string
  : T extends string | number | boolean | null | undefined
    ? T
    : T extends readonly (infer Item)[]
      ? readonly ReportValue<Item>[]
      : T extends object
        ? { readonly [Key in keyof T]: ReportValue<T[Key]> }
        : unknown

const ownerFields = [
  'currentComparableRent',
  'monthlyOwnerCosts',
  'ownerAnalysisYears',
  'ownerRentGrowthRate',
  'ownerCostGrowthRate',
  'propertyAppreciationRate',
  'alternativeReturnRate',
  'ownerSellingCostRate',
] as const
const rentalFields = [
  'monthlyNetColdRent',
  'vacancyRate',
  'otherAnnualRentLoss',
  'monthlyNonRecoverableHausgeld',
  'monthlyReserveContribution',
  'annualMaintenanceAllowance',
  'otherAnnualOwnerCosts',
  'rentalRentGrowthRate',
  'rentalOwnerCostGrowthRate',
  'rentalHoldingYears',
  'rentalPropertyAppreciationRate',
  'rentalSellingCostRate',
] as const
const commonFields = [
  'refinancingInitialRepaymentRate',
  'refinancingLowerRate',
  'refinancingBaseRate',
  'refinancingHigherRate',
  'maximumMonthlyPayment',
  'livingAreaSquareMetres',
  'askingPrice',
  'proposedOffer',
  'comparablePricePerSquareMetreLow',
  'comparablePricePerSquareMetreHigh',
  'openingOfferLargerDiscount',
  'openingOfferSmallerDiscount',
] as const

type AnalysisField = Exclude<keyof ScenarioAnalysisDraft, 'propertyUse'>
type ActiveAnalysis = Pick<ScenarioAnalysisDraft, (typeof commonFields)[number]> &
  (
    | ({ propertyUse: 'owner-occupier' } & Pick<
        ScenarioAnalysisDraft,
        (typeof ownerFields)[number]
      >)
    | ({ propertyUse: 'rental-investment' } & Pick<
        ScenarioAnalysisDraft,
        (typeof rentalFields)[number] | 'targetGrossYield' | 'targetNetYield'
      >)
  )
type ReportInputs = Omit<ScenarioWorkspaceSnapshot, 'analysis' | 'financing'> & {
  analysis: ActiveAnalysis
  financing: Omit<ScenarioWorkspaceSnapshot['financing'], 'downPayment'> & { downPayment?: string }
}

const optionsSchema = z
  .object({
    language: z.enum(['de', 'en']),
    generatedAt: z.iso.datetime({ offset: true }).optional(),
    includeScenarioNames: z.boolean().default(false),
    includeMonthlyAppendix: z.boolean().default(false),
    buildIdentity: z
      .object({
        commit: z.string().regex(/^[a-f0-9]{40}$/u),
        workingTreeDirty: z.boolean(),
      })
      .strict()
      .optional(),
  })
  .strict()

export type ReportOptions = z.input<typeof optionsSchema>
export type ReportInputLocale = SavedScenario['locale']

export interface ReportProperty {
  ordinal: number
  /** Names are plain text only; renderers must escape them. No IDs or saved timestamps are retained. */
  name?: string
  inputLocale: ReportInputLocale
  sourceSchemaVersion: string
  schemaVersion: typeof SCENARIO_SCHEMA_VERSION
  migrated: boolean
  inputs: ReportValue<ReportInputs>
  results: ReportValue<ScenarioDashboardCalculationResult>
  comparisonValues?: ReportValue<Record<ComparisonMetricId, ComparisonMetricValue>>
  provenance: ReportValue<ReturnType<typeof propertyProvenance>>
  status: 'complete' | 'incomplete'
}

export interface ReportSnapshot {
  contractVersion: typeof REPORT_CONTRACT_VERSION
  kind: 'property' | 'comparison'
  language: 'de' | 'en'
  currency: 'EUR'
  generatedAt: string
  generationTimezone: 'UTC'
  suggestedFilename: string
  options: { includeScenarioNames: boolean; includeMonthlyAppendix: boolean }
  buildIdentity:
    { status: 'available'; commit: string; workingTreeDirty: boolean } | { status: 'unavailable' }
  calculationMetadata: typeof calculationMetadata
  properties: readonly ReportProperty[]
  mixedBasisMetrics: readonly ComparisonMetricId[]
  status: 'complete' | 'incomplete'
}

export type ReportCaptureResult =
  | { status: 'captured'; snapshot: ReportValue<ReportSnapshot> }
  | {
      status: 'blocked'
      issue:
        | 'invalid-options'
        | 'invalid-schema'
        | 'unsupported-version'
        | 'invalid-selection'
        | 'library-unavailable'
        | 'invalid-input-format'
        | 'missing-required-inputs'
        | 'calculation-failed'
      propertyOrdinal?: number
      fields?: readonly string[]
    }

function pick<Key extends keyof ScenarioAnalysisDraft>(
  draft: ScenarioAnalysisDraft,
  keys: readonly Key[],
) {
  return Object.fromEntries(keys.map((key) => [key, draft[key]])) as Pick<
    ScenarioAnalysisDraft,
    Key
  >
}

function activeAnalysis(draft: ScenarioAnalysisDraft): ActiveAnalysis {
  const common = pick(draft, commonFields)
  return draft.propertyUse === 'owner-occupier'
    ? { ...common, propertyUse: 'owner-occupier', ...pick(draft, ownerFields) }
    : {
        ...common,
        propertyUse: 'rental-investment',
        ...pick(draft, rentalFields),
        targetGrossYield: draft.targetGrossYield,
        targetNetYield: draft.targetNetYield,
      }
}

function reportInputs(inputs: ScenarioWorkspaceSnapshot): ReportInputs {
  const { downPayment, ...financing } = inputs.financing
  const purchaseCosts = structuredClone(inputs.purchaseCosts)
  if (!purchaseCosts.brokerInvolved && purchaseCosts.rateOverrides) {
    delete purchaseCosts.rateOverrides.buyerBrokerRate
  }
  return {
    purchaseCosts,
    financing: {
      ...financing,
      ...(financing.mode === 'selected-down-payment' ? { downPayment } : {}),
    },
    analysis: activeAnalysis(inputs.analysis),
  }
}

/** Clear inactive fields on schema-created copies before they can affect calculation provenance. */
function clearInactiveInputs(inputs: ScenarioWorkspaceSnapshot) {
  if (!inputs.purchaseCosts.brokerInvolved && inputs.purchaseCosts.rateOverrides)
    delete inputs.purchaseCosts.rateOverrides.buyerBrokerRate
  if (inputs.financing.mode === 'available-equity') inputs.financing.downPayment = ''
  const inactiveFields =
    inputs.analysis.propertyUse === 'owner-occupier'
      ? ([...rentalFields, 'targetGrossYield', 'targetNetYield'] as const)
      : ownerFields
  for (const field of inactiveFields) inputs.analysis[field] = ''
}

/** Syntax guard only: existing domain APIs still own units, bounds, rounding and financial validation. */
function invalidInputFields(
  inputs: ScenarioWorkspaceSnapshot,
  locale: ReportInputLocale,
): string[] {
  const money =
    locale === 'de-DE'
      ? /^-?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/u
      : /^-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?$/u
  const canonicalMoney = /^-?\d+(?:\.\d{1,2})?$/u
  const rate = /^-?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/u
  const integer = /^-?\d+$/u
  const invalid: string[] = []
  const check = (path: string, value: string | undefined, format: RegExp, decoration: RegExp) => {
    if (value?.trim() && !format.test(value.replace(decoration, ''))) invalid.push(path)
  }
  check('purchaseCosts.purchasePrice', inputs.purchaseCosts.purchasePrice, money, /[€\s]/gu)
  for (const [key, value] of Object.entries(inputs.purchaseCosts.rateOverrides ?? {})) {
    if (
      typeof value === 'string' &&
      (key !== 'buyerBrokerRate' || inputs.purchaseCosts.brokerInvolved)
    ) {
      check(`purchaseCosts.rateOverrides.${key}`, value, rate, /[%\s]/gu)
    }
  }
  const financing = inputs.financing
  for (const field of [
    'availableEquity',
    ...(financing.mode === 'selected-down-payment' ? (['downPayment'] as const) : []),
  ] as const) {
    check(`financing.${field}`, financing[field], money, /[€\s]/gu)
  }
  for (const field of [
    'financedAcquisitionCostShare',
    'nominalAnnualRate',
    'initialRepaymentRate',
  ] as const) {
    check(`financing.${field}`, financing[field], rate, /[%\s]/gu)
  }
  check('financing.fixedInterestYears', financing.fixedInterestYears, integer, /\s/gu)
  const analysis = activeAnalysis(inputs.analysis)
  for (const [field, value] of Object.entries(analysis)) {
    if (field === 'propertyUse') continue
    const key = field as AnalysisField
    const format = key.endsWith('Years')
      ? integer
      : key.endsWith('Rate') ||
          key.startsWith('refinancing') ||
          key.startsWith('target') ||
          key.startsWith('openingOffer')
        ? rate
        : key === 'livingAreaSquareMetres'
          ? rate
          : canonicalMoney
    check(`analysis.${key}`, value, format, /[€%\s]/gu)
  }
  // Additional-repayment adapters already validate syntax and preserve unavailable-plan results.
  return invalid
}

function requiredInputFields(inputs: ScenarioWorkspaceSnapshot): string[] {
  const fields: Array<[string, string]> = [
    ['purchaseCosts.purchasePrice', inputs.purchaseCosts.purchasePrice],
    ['financing.availableEquity', inputs.financing.availableEquity],
    ['financing.financedAcquisitionCostShare', inputs.financing.financedAcquisitionCostShare],
  ]
  if (inputs.financing.mode === 'selected-down-payment')
    fields.push(['financing.downPayment', inputs.financing.downPayment])
  return fields.filter(([, value]) => !value.trim()).map(([field]) => field)
}

function propertyProvenance(
  inputs: ScenarioWorkspaceSnapshot,
  dashboard: ScenarioDashboardCalculationResult,
) {
  const defaults = assumptionSet.acquisitionDefaults
  const ids = new Set([
    ...assumptionSet.transferTax.sourceIds,
    ...defaults.notaryRate.sourceIds,
    ...defaults.landRegisterRate.sourceIds,
    ...defaults.renovationBudget.sourceIds,
    ...defaults.movingSetupCosts.sourceIds,
    ...(inputs.purchaseCosts.brokerInvolved ? defaults.broker.buyerCommissionRate.sourceIds : []),
  ])
  return {
    ...calculationMetadata,
    assumptionSchemaVersion: assumptionSet.schemaVersion,
    assumptionEffectiveFrom: assumptionSet.effectiveFrom,
    stateTaxEffectiveFrom: assumptionSet.transferTax.states.find(
      (state) => state.id === inputs.purchaseCosts.stateId,
    )!.effectiveFrom,
    transferTaxRateSourceDate: assumptionSet.transferTax.rateSourceDate,
    appliedAcquisitionAssumptions:
      'appliedAssumptions' in dashboard.acquisition
        ? dashboard.acquisition.appliedAssumptions
        : null,
    sources: assumptionSet.sources.filter((source) => ids.has(source.id)),
  }
}

/** Known optional/not-applicable states are not failures. Nested requested-result failures remain visible. */
function incomplete(value: unknown): boolean {
  if (value === null || typeof value !== 'object' || Decimal.isDecimal(value)) return false
  if ('status' in value) {
    if (value.status === 'unavailable') return true
    if (value.status === 'not-configured' && 'reason' in value && value.reason === 'missing-inputs')
      return true
    if (
      value.status === 'missing' &&
      'count' in value &&
      typeof value.count === 'number' &&
      value.count > 0
    )
      return true
  }
  return Object.values(value).some(incomplete)
}

/** Copies rather than freezing domain instances, so later engine calls cannot mutate a captured preview. */
function immutableValue<T>(value: T): ReportValue<T> {
  function copy(item: unknown): unknown {
    if (Decimal.isDecimal(item)) return item.toString()
    if (typeof item === 'bigint') return item.toString()
    // Domain diagnostic values can contain NaN for invalid plans. Never emit non-finite JSON numbers.
    if (typeof item === 'number' && !Number.isFinite(item)) return String(item)
    if (Array.isArray(item)) return Object.freeze(item.map(copy))
    if (item !== null && typeof item === 'object') {
      return Object.freeze(
        Object.fromEntries(Object.entries(item).map(([key, entry]) => [key, copy(entry)])),
      )
    }
    if (typeof item === 'function' || typeof item === 'symbol')
      throw new Error('Unexpected result type')
    return item
  }
  return copy(value) as ReportValue<T>
}

function finish(
  kind: ReportSnapshot['kind'],
  properties: ReportProperty[],
  options: z.output<typeof optionsSchema>,
  mixedBasisMetrics: ComparisonMetricId[] = [],
): ReportCaptureResult {
  const generatedAt = new Date(options.generatedAt ?? new Date().toISOString()).toISOString()
  return {
    status: 'captured',
    snapshot: immutableValue({
      contractVersion: REPORT_CONTRACT_VERSION,
      kind,
      language: options.language,
      currency: 'EUR',
      generatedAt,
      generationTimezone: 'UTC',
      suggestedFilename: `immopilot-de-${kind === 'property' ? 'property-report' : 'comparison-report'}-${options.language}-${generatedAt.slice(0, 10)}.pdf`,
      options: {
        includeScenarioNames: options.includeScenarioNames,
        includeMonthlyAppendix: options.includeMonthlyAppendix,
      },
      buildIdentity: options.buildIdentity
        ? { status: 'available', ...options.buildIdentity }
        : { status: 'unavailable' },
      calculationMetadata,
      properties,
      mixedBasisMetrics,
      status: properties.some((property) => property.status === 'incomplete')
        ? 'incomplete'
        : 'complete',
    } satisfies ReportSnapshot),
  }
}

function property(
  inputs: ScenarioWorkspaceSnapshot,
  inputLocale: ReportInputLocale,
  ordinal: number,
  sourceSchemaVersion: string,
  dashboard: ScenarioDashboardCalculationResult,
  name?: string,
  comparisonValues?: Record<ComparisonMetricId, ComparisonMetricValue>,
): ReportProperty {
  const results = {
    ...dashboard,
    selectedAmortization:
      dashboard.additionalRepaymentComparison.status === 'available'
        ? dashboard.selectedAmortization
        : dashboard.additionalRepaymentComparison.schedule,
  }
  return {
    ordinal,
    ...(name === undefined ? {} : { name }),
    inputLocale,
    sourceSchemaVersion,
    schemaVersion: SCENARIO_SCHEMA_VERSION,
    migrated: sourceSchemaVersion !== SCENARIO_SCHEMA_VERSION,
    inputs: immutableValue(reportInputs(inputs)),
    results: immutableValue(results),
    ...(comparisonValues ? { comparisonValues: immutableValue(comparisonValues) } : {}),
    provenance: immutableValue(propertyProvenance(inputs, dashboard)),
    status:
      incomplete(results) ||
      incomplete(comparisonValues) ||
      (dashboard.financing.status === 'available' &&
        dashboard.financing.fundingStatus === 'underfunded')
        ? 'incomplete'
        : 'complete',
  }
}

function inputIssue(
  inputs: ScenarioWorkspaceSnapshot,
  locale: ReportInputLocale,
  ordinal: number,
): ReportCaptureResult | undefined {
  const fields = invalidInputFields(inputs, locale)
  if (fields.length)
    return { status: 'blocked', issue: 'invalid-input-format', propertyOrdinal: ordinal, fields }
  const missing = requiredInputFields(inputs)
  if (missing.length)
    return {
      status: 'blocked',
      issue: 'missing-required-inputs',
      propertyOrdinal: ordinal,
      fields: missing,
    }
}

function mortgageInputIssue(
  inputs: ScenarioWorkspaceSnapshot,
  dashboard: ScenarioDashboardCalculationResult,
  ordinal: number,
): ReportCaptureResult | undefined {
  if (dashboard.financing.status !== 'available' || dashboard.financing.loanAmountCents === 0)
    return
  const fields = ['nominalAnnualRate', 'initialRepaymentRate', 'fixedInterestYears'] as const
  const missing = fields
    .filter((field) => !inputs.financing[field].trim())
    .map((field) => `financing.${field}`)
  if (missing.length)
    return {
      status: 'blocked',
      issue: 'missing-required-inputs',
      propertyOrdinal: ordinal,
      fields: missing,
    }
}

export function capturePropertyReport(
  source: { inputs: unknown; inputLocale: ReportInputLocale },
  options: ReportOptions,
): ReportCaptureResult {
  try {
    const parsedOptions = optionsSchema.safeParse(options)
    if (!parsedOptions.success) return { status: 'blocked', issue: 'invalid-options' }
    if (!['de-DE', 'en-GB'].includes(source.inputLocale))
      return { status: 'blocked', issue: 'invalid-schema' }
    const parsed = scenarioInputsSchema.safeParse(source.inputs)
    if (!parsed.success) return { status: 'blocked', issue: 'invalid-schema' }
    const inputs = parsed.data
    clearInactiveInputs(inputs)
    const issue = inputIssue(inputs, source.inputLocale, 1)
    if (issue) return issue
    const dashboard = calculateScenarioDashboard(
      inputs.purchaseCosts,
      inputs.financing,
      inputs.analysis,
      source.inputLocale === 'en-GB' ? 'en' : 'de',
    )
    const mortgageIssue = mortgageInputIssue(inputs, dashboard, 1)
    if (mortgageIssue) return mortgageIssue
    return finish(
      'property',
      [property(inputs, source.inputLocale, 1, SCENARIO_SCHEMA_VERSION, dashboard)],
      parsedOptions.data,
    )
  } catch {
    return { status: 'blocked', issue: 'calculation-failed' }
  }
}

export function captureComparisonReport(
  source: {
    documents: readonly unknown[]
    selectedIds: readonly string[]
    libraryIssue?: ScenarioLibraryIssue
  },
  options: ReportOptions,
): ReportCaptureResult {
  try {
    const parsedOptions = optionsSchema.safeParse(options)
    if (!parsedOptions.success) return { status: 'blocked', issue: 'invalid-options' }
    if (source.libraryIssue) return { status: 'blocked', issue: 'library-unavailable' }
    if (
      source.selectedIds.length < 1 ||
      source.selectedIds.length > 3 ||
      new Set(source.selectedIds).size !== source.selectedIds.length
    )
      return { status: 'blocked', issue: 'invalid-selection' }
    if (source.documents.length > 100) return { status: 'blocked', issue: 'invalid-schema' }
    const saved = new Map<string, { scenario: SavedScenario; sourceVersion: string }>()
    for (const document of source.documents) {
      const parsed = parseScenarioJson(JSON.stringify(document))
      if (parsed.status !== 'valid')
        return {
          status: 'blocked',
          issue: parsed.issue === 'unsupported-version' ? 'unsupported-version' : 'invalid-schema',
        }
      if (saved.has(parsed.scenario.id)) return { status: 'blocked', issue: 'invalid-selection' }
      const original = document as { schemaVersion: string }
      saved.set(parsed.scenario.id, {
        scenario: parsed.scenario,
        sourceVersion: original.schemaVersion,
      })
    }
    const properties: ReportProperty[] = []
    const comparisons: ReturnType<typeof calculateSavedScenarioComparison>[] = []
    for (const [index, id] of source.selectedIds.entries()) {
      const entry = saved.get(id)
      if (!entry) return { status: 'blocked', issue: 'invalid-selection' }
      const { scenario } = entry
      clearInactiveInputs(scenario.inputs)
      const issue = inputIssue(scenario.inputs, scenario.locale, index + 1)
      if (issue) return issue
      const comparison = calculateSavedScenarioComparison(scenario)
      const mortgageIssue = mortgageInputIssue(scenario.inputs, comparison.dashboard, index + 1)
      if (mortgageIssue) return mortgageIssue
      comparisons.push(comparison)
      properties.push(
        property(
          scenario.inputs,
          scenario.locale,
          index + 1,
          entry.sourceVersion,
          comparison.dashboard,
          parsedOptions.data.includeScenarioNames ? scenario.name : undefined,
          comparison.values,
        ),
      )
    }
    return finish(
      'comparison',
      properties,
      parsedOptions.data,
      comparisonMetricIds.filter((metric) => hasMixedComparisonBasis(comparisons, metric)),
    )
  } catch {
    return { status: 'blocked', issue: 'calculation-failed' }
  }
}
