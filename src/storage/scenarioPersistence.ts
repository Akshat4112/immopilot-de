import { z } from 'zod'

import type { ScenarioWorkspaceSnapshot } from '../config/scenarioDrafts'

export const SCENARIO_SCHEMA_VERSION = '1.0.0'
export const SCENARIO_LIBRARY_STORAGE_KEY = 'immopilot-de.scenarios.v1'
const MAX_INPUT_LENGTH = 1_000
const MAX_SHARE_PAYLOAD_LENGTH = 100_000
const MAX_SCENARIO_JSON_LENGTH = 250_000
const inputStringSchema = z.string().max(MAX_INPUT_LENGTH)

const germanStateSchema = z.enum([
  'DE-BW',
  'DE-BY',
  'DE-BE',
  'DE-BB',
  'DE-HB',
  'DE-HH',
  'DE-HE',
  'DE-MV',
  'DE-NI',
  'DE-NW',
  'DE-RP',
  'DE-SL',
  'DE-SN',
  'DE-ST',
  'DE-SH',
  'DE-TH',
])

const rateOverridesSchema = z
  .object({
    transferTaxRate: inputStringSchema.optional(),
    notaryRate: inputStringSchema.optional(),
    landRegisterRate: inputStringSchema.optional(),
    buyerBrokerRate: inputStringSchema.optional(),
  })
  .strict()

const budgetSchema = z
  .object({
    amountCents: z.number().int().nonnegative().safe(),
    budgetStatus: z.enum(['not-budgeted', 'confirmed-zero', 'budgeted']),
  })
  .strict()

const purchaseCostsSchema = z
  .object({
    purchasePrice: inputStringSchema,
    stateId: germanStateSchema,
    brokerInvolved: z.boolean(),
    rateOverrides: rateOverridesSchema.optional(),
    renovationBudget: budgetSchema.optional(),
    movingSetupCosts: budgetSchema.optional(),
  })
  .strict()

const financingSchema = z
  .object({
    mode: z.enum(['available-equity', 'selected-down-payment']),
    availableEquity: inputStringSchema,
    downPayment: inputStringSchema,
    financedAcquisitionCostShare: inputStringSchema,
    nominalAnnualRate: inputStringSchema,
    initialRepaymentRate: inputStringSchema,
    fixedInterestYears: inputStringSchema,
  })
  .strict()

const analysisSchema = z
  .object({
    propertyUse: z.enum(['owner-occupier', 'rental-investment']),
    refinancingInitialRepaymentRate: inputStringSchema,
    refinancingLowerRate: inputStringSchema,
    refinancingBaseRate: inputStringSchema,
    refinancingHigherRate: inputStringSchema,
    currentComparableRent: inputStringSchema,
    monthlyOwnerCosts: inputStringSchema,
    ownerAnalysisYears: inputStringSchema,
    ownerRentGrowthRate: inputStringSchema,
    ownerCostGrowthRate: inputStringSchema,
    propertyAppreciationRate: inputStringSchema,
    alternativeReturnRate: inputStringSchema,
    ownerSellingCostRate: inputStringSchema,
    monthlyNetColdRent: inputStringSchema,
    vacancyRate: inputStringSchema,
    otherAnnualRentLoss: inputStringSchema,
    monthlyNonRecoverableHausgeld: inputStringSchema,
    monthlyReserveContribution: inputStringSchema,
    annualMaintenanceAllowance: inputStringSchema,
    otherAnnualOwnerCosts: inputStringSchema,
    rentalRentGrowthRate: inputStringSchema,
    rentalOwnerCostGrowthRate: inputStringSchema,
    rentalHoldingYears: inputStringSchema,
    rentalPropertyAppreciationRate: inputStringSchema,
    rentalSellingCostRate: inputStringSchema,
    maximumMonthlyPayment: inputStringSchema,
    targetGrossYield: inputStringSchema,
    targetNetYield: inputStringSchema,
    livingAreaSquareMetres: inputStringSchema,
    askingPrice: inputStringSchema,
    proposedOffer: inputStringSchema,
    comparablePricePerSquareMetreLow: inputStringSchema,
    comparablePricePerSquareMetreHigh: inputStringSchema,
    openingOfferLargerDiscount: inputStringSchema,
    openingOfferSmallerDiscount: inputStringSchema,
  })
  .strict()

export const scenarioInputsSchema = z
  .object({
    purchaseCosts: purchaseCostsSchema,
    financing: financingSchema,
    analysis: analysisSchema,
  })
  .strict()

export const savedScenarioSchema = z
  .object({
    documentType: z.literal('immopilot-workspace-scenario'),
    schemaVersion: z.literal(SCENARIO_SCHEMA_VERSION),
    id: z.string().min(1).max(120),
    name: z.string().trim().min(1).max(120),
    locale: z.enum(['de-DE', 'en-GB']),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    inputs: scenarioInputsSchema,
  })
  .strict()

const scenarioLibrarySchema = z
  .object({
    documentType: z.literal('immopilot-scenario-library'),
    schemaVersion: z.literal(SCENARIO_SCHEMA_VERSION),
    scenarios: z.array(savedScenarioSchema).max(100),
  })
  .strict()

export type ScenarioInputs = ScenarioWorkspaceSnapshot

export type SavedScenario = z.infer<typeof savedScenarioSchema>
export type ScenarioLibraryIssue = 'corrupted' | 'storage-unavailable' | 'unsupported-version'

export interface ScenarioLibraryLoadResult {
  scenarios: SavedScenario[]
  issue?: ScenarioLibraryIssue
}

export type ScenarioParseResult =
  | { status: 'valid'; scenario: SavedScenario }
  | { status: 'invalid'; issue: 'corrupted' | 'unsupported-version' }

function hasUnsupportedVersion(value: unknown) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'schemaVersion' in value &&
    value.schemaVersion !== SCENARIO_SCHEMA_VERSION
  )
}

function createScenarioId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `scenario-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function cloneInputs(inputs: ScenarioInputs): ScenarioInputs {
  return structuredClone(inputs)
}

export function createSavedScenario(
  name: string,
  inputs: ScenarioInputs,
  options: { id?: string; locale?: SavedScenario['locale']; now?: Date } = {},
): SavedScenario {
  const timestamp = (options.now ?? new Date()).toISOString()
  return savedScenarioSchema.parse({
    documentType: 'immopilot-workspace-scenario',
    schemaVersion: SCENARIO_SCHEMA_VERSION,
    id: options.id ?? createScenarioId(),
    name,
    locale: options.locale ?? 'de-DE',
    createdAt: timestamp,
    updatedAt: timestamp,
    inputs: cloneInputs(inputs),
  })
}

export function renameSavedScenario(scenario: SavedScenario, name: string, now = new Date()) {
  return savedScenarioSchema.parse({ ...scenario, name, updatedAt: now.toISOString() })
}

export function duplicateSavedScenario(
  scenario: SavedScenario,
  options: { id?: string; name: string; now?: Date },
) {
  return createSavedScenario(options.name.trim().slice(0, 120), scenario.inputs, {
    id: options.id,
    locale: scenario.locale,
    now: options.now,
  })
}

export function serializeScenario(scenario: SavedScenario) {
  return `${JSON.stringify(savedScenarioSchema.parse(scenario), null, 2)}\n`
}

export function parseScenarioJson(json: string): ScenarioParseResult {
  if (json.length > MAX_SCENARIO_JSON_LENGTH) {
    return { status: 'invalid', issue: 'corrupted' }
  }
  try {
    const value: unknown = JSON.parse(json)
    if (hasUnsupportedVersion(value)) return { status: 'invalid', issue: 'unsupported-version' }
    const parsed = savedScenarioSchema.safeParse(value)
    return parsed.success
      ? { status: 'valid', scenario: parsed.data }
      : { status: 'invalid', issue: 'corrupted' }
  } catch {
    return { status: 'invalid', issue: 'corrupted' }
  }
}

export function readScenarioLibrary(storage: Pick<Storage, 'getItem'>): ScenarioLibraryLoadResult {
  let raw: string | null
  try {
    raw = storage.getItem(SCENARIO_LIBRARY_STORAGE_KEY)
  } catch {
    return { scenarios: [], issue: 'storage-unavailable' }
  }

  if (raw === null) return { scenarios: [] }

  try {
    const value: unknown = JSON.parse(raw)
    if (hasUnsupportedVersion(value)) return { scenarios: [], issue: 'unsupported-version' }
    const parsed = scenarioLibrarySchema.safeParse(value)
    return parsed.success
      ? { scenarios: parsed.data.scenarios }
      : { scenarios: [], issue: 'corrupted' }
  } catch {
    return { scenarios: [], issue: 'corrupted' }
  }
}

export function writeScenarioLibrary(
  storage: Pick<Storage, 'setItem'>,
  scenarios: SavedScenario[],
) {
  try {
    const library = scenarioLibrarySchema.parse({
      documentType: 'immopilot-scenario-library',
      schemaVersion: SCENARIO_SCHEMA_VERSION,
      scenarios,
    })
    storage.setItem(SCENARIO_LIBRARY_STORAGE_KEY, JSON.stringify(library))
    return true
  } catch {
    return false
  }
}

function encodeUtf8(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}

function decodeUtf8(value: string) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)))
}

export function createScenarioShareUrl(scenario: SavedScenario, currentUrl: string) {
  const url = new URL(currentUrl)
  const encodedScenario = encodeUtf8(serializeScenario(scenario))
  url.hash = `/scenarios?scenario=${encodeURIComponent(encodedScenario)}`
  return url.toString()
}

export function parseSharedScenario(encodedScenario: string): ScenarioParseResult {
  try {
    if (encodedScenario.length > MAX_SHARE_PAYLOAD_LENGTH) {
      return { status: 'invalid', issue: 'corrupted' }
    }
    return parseScenarioJson(decodeUtf8(encodedScenario))
  } catch {
    return { status: 'invalid', issue: 'corrupted' }
  }
}

export function scenarioDownloadFilename(name: string) {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '')
    .slice(0, 64)
  return `immopilot-${slug || 'scenario'}.json`
}
