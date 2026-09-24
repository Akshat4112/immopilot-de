import { describe, expect, it } from 'vitest'

import {
  initialFinancingDraft,
  initialPurchaseCostsDraft,
  initialScenarioAnalysisDraft,
} from '../config/scenarioDrafts'
import {
  SCENARIO_LIBRARY_STORAGE_KEY,
  SCENARIO_SCHEMA_VERSION,
  clearScenarioLibrary,
  createSavedScenario,
  createScenarioShareUrl,
  duplicateSavedScenario,
  parseScenarioJson,
  parseSharedScenario,
  readScenarioLibrary,
  renameSavedScenario,
  scenarioDownloadFilename,
  serializeScenario,
  writeScenarioLibrary,
} from './scenarioPersistence'

const inputs = {
  purchaseCosts: { ...initialPurchaseCostsDraft, purchasePrice: '350.000' },
  financing: {
    ...initialFinancingDraft,
    downPayment: '80.000',
    additionalRepayments: {
      annualAdditionalRepayment: '5.000',
      annualAdditionalRepaymentMonth: '12',
      oneTimeAdditionalRepayments: [{ month: '18', amount: '2.500' }],
    },
  },
  analysis: { ...initialScenarioAnalysisDraft, currentComparableRent: '1.250' },
}

function legacyInputs() {
  return {
    purchaseCosts: inputs.purchaseCosts,
    financing: {
      mode: inputs.financing.mode,
      availableEquity: inputs.financing.availableEquity,
      downPayment: inputs.financing.downPayment,
      financedAcquisitionCostShare: inputs.financing.financedAcquisitionCostShare,
      nominalAnnualRate: inputs.financing.nominalAnnualRate,
      initialRepaymentRate: inputs.financing.initialRepaymentRate,
      fixedInterestYears: inputs.financing.fixedInterestYears,
    },
    analysis: inputs.analysis,
  }
}

function legacyScenario() {
  return {
    documentType: 'immopilot-workspace-scenario',
    schemaVersion: '1.0.0',
    id: 'legacy',
    name: 'Legacy scenario',
    locale: 'en-GB',
    createdAt: '2026-09-23T12:00:00.000Z',
    updatedAt: '2026-09-23T13:00:00.000Z',
    inputs: legacyInputs(),
  }
}

function encodeShareDocument(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}

const emptyAdditionalRepayments = {
  annualAdditionalRepayment: '',
  annualAdditionalRepaymentMonth: '12',
  oneTimeAdditionalRepayments: [],
}

describe('scenario persistence', () => {
  it('round-trips versioned user inputs without calculated results', () => {
    const scenario = createSavedScenario('Altbau Köln', inputs, {
      id: 'scenario-1',
      locale: 'de-DE',
      now: new Date('2026-09-23T12:00:00.000Z'),
    })

    const parsed = parseScenarioJson(serializeScenario(scenario))

    expect(parsed).toEqual({ status: 'valid', scenario })
    expect(scenario.schemaVersion).toBe('1.1.0')
    expect(scenario).not.toHaveProperty('results')
    expect(scenario.inputs).toEqual(inputs)
  })

  it('migrates a valid 1.0.0 JSON scenario to empty additional repayments', () => {
    const parsed = parseScenarioJson(JSON.stringify(legacyScenario()))

    expect(parsed.status).toBe('valid')
    if (parsed.status !== 'valid') return
    expect(parsed.scenario).toMatchObject({
      schemaVersion: SCENARIO_SCHEMA_VERSION,
      id: 'legacy',
      name: 'Legacy scenario',
      createdAt: '2026-09-23T12:00:00.000Z',
      updatedAt: '2026-09-23T13:00:00.000Z',
    })
    expect(parsed.scenario.inputs.financing.additionalRepayments).toEqual(emptyAdditionalRepayments)
  })

  it('renames and duplicates without mutating the source scenario', () => {
    const source = createSavedScenario('Original', inputs, {
      id: 'source',
      now: new Date('2026-09-23T12:00:00.000Z'),
    })
    const renamed = renameSavedScenario(source, 'Renamed', new Date('2026-09-23T13:00:00.000Z'))
    const duplicate = duplicateSavedScenario(source, {
      id: 'copy',
      name: 'Original copy',
      now: new Date('2026-09-23T14:00:00.000Z'),
    })

    expect(source.name).toBe('Original')
    expect(renamed).toMatchObject({ id: 'source', name: 'Renamed' })
    expect(renamed.updatedAt).toBe('2026-09-23T13:00:00.000Z')
    expect(duplicate).toMatchObject({ id: 'copy', name: 'Original copy' })
    expect(duplicate.createdAt).toBe(duplicate.updatedAt)
    expect(duplicate.inputs).toEqual(source.inputs)
    expect(duplicate.inputs).not.toBe(source.inputs)
    expect(duplicate.inputs.financing.additionalRepayments).not.toBe(
      source.inputs.financing.additionalRepayments,
    )
    expect(duplicate.inputs.financing.additionalRepayments.oneTimeAdditionalRepayments).not.toBe(
      source.inputs.financing.additionalRepayments.oneTimeAdditionalRepayments,
    )
  })

  it('keeps generated duplicate names within the validated limit', () => {
    const source = createSavedScenario('A'.repeat(120), inputs, { id: 'source' })

    const duplicate = duplicateSavedScenario(source, {
      id: 'copy',
      name: `${source.name} (copy)`,
    })

    expect(duplicate.name).toHaveLength(120)
  })

  it('reads and writes the local scenario library', () => {
    const memory = new Map<string, string>()
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
    }
    const scenario = createSavedScenario('Saved', inputs, { id: 'saved' })

    expect(writeScenarioLibrary(storage, [scenario])).toBe(true)
    expect(readScenarioLibrary(storage)).toEqual({ scenarios: [scenario] })
    expect(memory.has(SCENARIO_LIBRARY_STORAGE_KEY)).toBe(true)
    expect(SCENARIO_LIBRARY_STORAGE_KEY).toBe('immopilot-de.scenarios.v1')

    expect(clearScenarioLibrary({ removeItem: (key) => memory.delete(key) })).toBe(true)
    expect(readScenarioLibrary(storage)).toEqual({ scenarios: [] })
  })

  it('migrates an entire 1.0.0 local library without rewriting the storage key', () => {
    const legacyLibrary = JSON.stringify({
      documentType: 'immopilot-scenario-library',
      schemaVersion: '1.0.0',
      scenarios: [legacyScenario()],
    })
    const storage = {
      getItem: (key: string) => (key === SCENARIO_LIBRARY_STORAGE_KEY ? legacyLibrary : null),
    }

    const loaded = readScenarioLibrary(storage)

    expect(loaded.issue).toBeUndefined()
    expect(loaded.scenarios).toHaveLength(1)
    expect(loaded.scenarios[0]?.schemaVersion).toBe(SCENARIO_SCHEMA_VERSION)
    expect(loaded.scenarios[0]?.inputs.financing.additionalRepayments).toEqual(
      emptyAdditionalRepayments,
    )
  })

  it('distinguishes corrupted, unsupported, and unavailable local data', () => {
    expect(readScenarioLibrary({ getItem: () => '{not json' })).toEqual({
      scenarios: [],
      issue: 'corrupted',
    })
    expect(
      readScenarioLibrary({
        getItem: () => JSON.stringify({ schemaVersion: '2.0.0' }),
      }),
    ).toEqual({ scenarios: [], issue: 'unsupported-version' })
    expect(
      readScenarioLibrary({
        getItem: () => {
          throw new Error('blocked')
        },
      }),
    ).toEqual({ scenarios: [], issue: 'storage-unavailable' })
  })

  it('rejects malformed and outdated imported scenarios', () => {
    expect(parseScenarioJson('{not json')).toEqual({ status: 'invalid', issue: 'corrupted' })
    expect(parseScenarioJson(JSON.stringify({ schemaVersion: '0.9.0' }))).toEqual({
      status: 'invalid',
      issue: 'unsupported-version',
    })
    expect(parseScenarioJson('x'.repeat(250_001))).toEqual({
      status: 'invalid',
      issue: 'corrupted',
    })
  })

  it('rejects malformed 1.1.0 repayment data instead of applying defaults', () => {
    const scenario = createSavedScenario('Malformed', inputs, { id: 'malformed' })
    const malformed = JSON.parse(serializeScenario(scenario)) as {
      inputs: { financing: { additionalRepayments: Record<string, unknown> } }
    }
    malformed.inputs.financing.additionalRepayments.oneTimeAdditionalRepayments = [{ month: '18' }]

    expect(parseScenarioJson(JSON.stringify(malformed))).toEqual({
      status: 'invalid',
      issue: 'corrupted',
    })
  })

  it('round-trips unicode scenarios through a backend-free share URL', () => {
    const scenario = createSavedScenario('Grünes Haus 🏡', inputs, { id: 'shared' })
    const shareUrl = createScenarioShareUrl(scenario, 'https://example.test/#/results')
    const encoded = new URL(shareUrl).hash.split('scenario=')[1]

    expect(shareUrl).toContain('#/scenarios?scenario=')
    expect(encoded).toBeDefined()
    const parsed = parseSharedScenario(decodeURIComponent(encoded!))

    expect(parsed.status).toBe('valid')
    if (parsed.status !== 'valid') return
    expect(parsed.scenario).toMatchObject({
      name: 'Geteiltes Szenario',
      locale: scenario.locale,
      inputs: scenario.inputs,
    })
    expect(parsed.scenario.id).not.toBe(scenario.id)
    const base64 = decodeURIComponent(encoded!).replaceAll('-', '+').replaceAll('_', '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const shareDocument = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(padded), (character) => character.charCodeAt(0)),
      ),
    ) as Record<string, unknown>
    expect(shareDocument).not.toHaveProperty('name')
    expect(shareDocument).not.toHaveProperty('id')
    expect(shareDocument).not.toHaveProperty('createdAt')
  })

  it('migrates a valid 1.0.0 share payload', () => {
    const encoded = encodeShareDocument({
      documentType: 'immopilot-workspace-share',
      schemaVersion: '1.0.0',
      locale: 'en-GB',
      inputs: legacyInputs(),
    })

    const parsed = parseSharedScenario(encoded)

    expect(parsed.status).toBe('valid')
    if (parsed.status !== 'valid') return
    expect(parsed.scenario).toMatchObject({
      schemaVersion: SCENARIO_SCHEMA_VERSION,
      name: 'Shared scenario',
      locale: 'en-GB',
    })
    expect(parsed.scenario.inputs.financing.additionalRepayments).toEqual(emptyAdditionalRepayments)
  })

  it('creates a safe download filename', () => {
    expect(scenarioDownloadFilename('Grünes Haus / Köln')).toBe('immopilot-grunes-haus-koln.json')
  })
})
