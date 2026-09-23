import { describe, expect, it } from 'vitest'

import {
  initialFinancingDraft,
  initialPurchaseCostsDraft,
  initialScenarioAnalysisDraft,
} from '../config/scenarioDrafts'
import {
  SCENARIO_LIBRARY_STORAGE_KEY,
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
  financing: { ...initialFinancingDraft, downPayment: '80.000' },
  analysis: { ...initialScenarioAnalysisDraft, currentComparableRent: '1.250' },
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
    expect(scenario).not.toHaveProperty('results')
    expect(scenario.inputs).toEqual(inputs)
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

  it('round-trips unicode scenarios through a backend-free share URL', () => {
    const scenario = createSavedScenario('Grünes Haus 🏡', inputs, { id: 'shared' })
    const shareUrl = createScenarioShareUrl(scenario, 'https://example.test/#/results')
    const encoded = new URL(shareUrl).hash.split('scenario=')[1]

    expect(shareUrl).toContain('#/scenarios?scenario=')
    expect(encoded).toBeDefined()
    expect(parseSharedScenario(decodeURIComponent(encoded!))).toEqual({
      status: 'valid',
      scenario,
    })
  })

  it('creates a safe download filename', () => {
    expect(scenarioDownloadFilename('Grünes Haus / Köln')).toBe('immopilot-grunes-haus-koln.json')
  })
})
