import { afterEach, describe, expect, it, vi } from 'vitest'

import assumptionSet from '../../../data/assumptions/de-2026.09.json'
import { calculationMetadata } from '../../config/releaseMetadata'
import { createSavedScenario, type SavedScenario } from '../../storage'
import * as workspace from '../scenario-workspace'
import { calculateSavedScenarioComparison, comparisonMetricIds } from '../comparison'
import {
  captureComparisonReport,
  capturePropertyReport,
  type ReportCaptureResult,
  type ReportOptions,
} from './reportSnapshot'

const options: ReportOptions = { language: 'en', generatedAt: '2026-10-08T12:00:00Z' }

function scenario(id = 'private-id', locale: SavedScenario['locale'] = 'de-DE') {
  return createSavedScenario(
    'Private address <script>alert(1)</script>',
    {
      purchaseCosts: {
        ...workspace.initialPurchaseCostsDraft,
        purchasePrice: locale === 'de-DE' ? '250.000,00' : '250,000.00',
        renovationBudget: { amountCents: 0, budgetStatus: 'confirmed-zero' },
        movingSetupCosts: { amountCents: 0, budgetStatus: 'confirmed-zero' },
      },
      financing: {
        ...structuredClone(workspace.initialFinancingDraft),
        availableEquity: locale === 'de-DE' ? '66.250,00' : '66,250.00',
        downPayment: locale === 'de-DE' ? '50.000,00' : '50,000.00',
      },
      analysis: {
        ...workspace.initialScenarioAnalysisDraft,
        currentComparableRent: '1000',
        monthlyOwnerCosts: '250',
        maximumMonthlyPayment: '1000',
        livingAreaSquareMetres: '60',
        askingPrice: '250000',
        proposedOffer: '230000',
        comparablePricePerSquareMetreLow: '3800',
        comparablePricePerSquareMetreHigh: '4300',
        openingOfferLargerDiscount: '12',
        openingOfferSmallerDiscount: '8',
      },
    },
    { id, locale, now: new Date('2026-10-01T00:00:00Z') },
  )
}

function snapshot(result: ReportCaptureResult) {
  if (result.status !== 'captured') throw new Error(JSON.stringify(result))
  return result.snapshot
}

function single(saved = scenario(), reportOptions = options) {
  return capturePropertyReport({ inputs: saved.inputs, inputLocale: saved.locale }, reportOptions)
}

function comparison(documents: unknown[], selectedIds = ['private-id'], reportOptions = options) {
  return captureComparisonReport({ documents, selectedIds }, reportOptions)
}

afterEach(() => vi.restoreAllMocks())

describe('recalculated report snapshots', () => {
  it('recalculates the full dashboard through the existing engine, retaining exact decimal strings', () => {
    const saved = scenario()
    const actual = snapshot(single(saved)).properties[0]!
    const dashboard = workspace.calculateScenarioDashboard(
      saved.inputs.purchaseCosts,
      saved.inputs.financing,
      saved.inputs.analysis,
      'de',
    )
    expect(actual.results).toEqual(JSON.parse(JSON.stringify(dashboard)))
    expect(actual.results.financing).toMatchObject({
      status: 'available',
      loanAmountCents: 20_000_000,
    })
    expect(actual.results.payment).toMatchObject({ status: 'available' })
    expect(JSON.stringify(actual.results)).toContain('0.035')
    expect(snapshot(single(saved)).status).toBe('complete')
  })

  it.each(['de', 'en'] as const)(
    'keeps stored input locales independent of %s report language',
    (language) => {
      const de = snapshot(single(scenario('de', 'de-DE'), { ...options, language }))
      const en = snapshot(single(scenario('en', 'en-GB'), { ...options, language }))
      expect(de.properties[0]!.results).toEqual(en.properties[0]!.results)
      expect(de.properties[0]!.inputLocale).toBe('de-DE')
      expect(en.properties[0]!.inputLocale).toBe('en-GB')
      expect(de.language).toBe(language)
    },
  )

  it('records schema, assumptions, effective/source dates and verified methodology metadata', () => {
    const actual = snapshot(
      single(scenario(), {
        ...options,
        buildIdentity: { commit: 'a'.repeat(40), workingTreeDirty: false },
      }),
    )
    expect(actual).toMatchObject({
      contractVersion: '1.0.0',
      currency: 'EUR',
      calculationMetadata,
      buildIdentity: { status: 'available', commit: 'a'.repeat(40), workingTreeDirty: false },
    })
    expect(actual.properties[0]).toMatchObject({
      schemaVersion: '1.1.0',
      sourceSchemaVersion: '1.1.0',
      migrated: false,
      provenance: {
        ...calculationMetadata,
        assumptionSchemaVersion: assumptionSet.schemaVersion,
        assumptionEffectiveFrom: assumptionSet.effectiveFrom,
        transferTaxRateSourceDate: assumptionSet.transferTax.rateSourceDate,
      },
    })
    expect(actual.properties[0]!.provenance.sources.length).toBeGreaterThan(0)
    expect(actual.properties[0]!.provenance.sources.every((source) => source.verifiedOn)).toBe(true)
    expect(actual.properties[0]!.provenance.appliedAcquisitionAssumptions).not.toBeNull()
    expect(snapshot(single()).buildIdentity).toEqual({ status: 'unavailable' })
  })

  it('uses a UTC timestamp and generic filename, independent of input names', () => {
    const actual = snapshot(
      comparison([scenario()], undefined, {
        ...options,
        generatedAt: '2026-10-08T00:30:00+02:00',
        includeScenarioNames: true,
      }),
    )
    expect(actual.generatedAt).toBe('2026-10-07T22:30:00.000Z')
    expect(actual.generationTimezone).toBe('UTC')
    expect(actual.suggestedFilename).toBe('immopilot-de-comparison-report-en-2026-10-07.pdf')
    expect(snapshot(single()).suggestedFilename).toBe(
      'immopilot-de-property-report-en-2026-10-08.pdf',
    )
  })

  it('omits names, IDs, saved timestamps, unselected scenarios and inactive financial inputs', () => {
    const selected = scenario()
    selected.inputs.analysis.monthlyNetColdRent = '987654321'
    selected.inputs.purchaseCosts.rateOverrides = { buyerBrokerRate: 'private-unused-value' }
    const actual = snapshot(comparison([selected, scenario('unselected-private-id')]))
    const serialized = JSON.stringify(actual)
    for (const excluded of [
      'Private address',
      'private-id',
      '2026-10-01',
      '987654321',
      'private-unused-value',
    ]) {
      expect(serialized).not.toContain(excluded)
    }
    expect(actual.properties[0]!.inputs.analysis).not.toHaveProperty('monthlyNetColdRent')
    expect(actual.properties[0]).not.toHaveProperty('name')
    expect(actual.properties[0]!.inputs.purchaseCosts.rateOverrides).not.toHaveProperty(
      'buyerBrokerRate',
    )
    selected.inputs.financing.mode = 'available-equity'
    selected.inputs.financing.downPayment = 'private-unused-value'
    expect(snapshot(single(selected)).properties[0]!.inputs.financing).not.toHaveProperty(
      'downPayment',
    )
  })

  it('includes explicitly opted-in names as plain text and records appendix intent', () => {
    const saved = scenario()
    const actual = snapshot(
      comparison([saved], undefined, {
        ...options,
        includeScenarioNames: true,
        includeMonthlyAppendix: true,
      }),
    )
    expect(actual.properties[0]!.name).toBe(saved.name)
    expect(actual.options).toEqual({ includeScenarioNames: true, includeMonthlyAppendix: true })
  })

  it('prevents inactive broker overrides and rental yield targets from changing owner report results', () => {
    const saved = scenario()
    const expected = snapshot(single(saved)).properties[0]!
    saved.inputs.analysis.targetGrossYield = '999'
    saved.inputs.analysis.targetNetYield = 'invalid inactive target'
    saved.inputs.purchaseCosts.rateOverrides = { buyerBrokerRate: '99' }
    const original = structuredClone(saved)
    const actual = snapshot(single(saved)).properties[0]!
    expect(actual.results).toEqual(expected.results)
    expect(actual.provenance).toEqual(expected.provenance)
    expect(snapshot(comparison([saved])).properties[0]!.results).toEqual(expected.results)
    expect(saved).toEqual(original)
  })

  it('isolates nested inputs, schedules, metadata and comparison values from subsequent mutations', () => {
    const saved = scenario()
    saved.inputs.financing.additionalRepayments.oneTimeAdditionalRepayments = [
      { amount: '1000', month: '12' },
    ]
    const original = structuredClone(saved)
    const actual = snapshot(comparison([saved]))
    const before = JSON.stringify(actual)
    expect(saved).toEqual(original)
    saved.inputs.financing.additionalRepayments.oneTimeAdditionalRepayments[0]!.amount = '9000'
    saved.inputs.purchaseCosts.purchasePrice = '999999'
    saved.name = 'Changed after preview'
    const assertFrozen = (value: unknown) => {
      if (value === null || typeof value !== 'object') return
      expect(Object.isFrozen(value)).toBe(true)
      for (const entry of Object.values(value)) assertFrozen(entry)
    }
    assertFrozen(actual)
    expect(Reflect.set(actual.properties[0]!.inputs.financing, 'availableEquity', '0')).toBe(false)
    expect(JSON.stringify(actual)).toBe(before)
    expect(JSON.stringify(snapshot(comparison([saved])))).not.toBe(before)
  })

  it('never reads or writes browser storage or sends report data over the network', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem')
    const set = vi.spyOn(Storage.prototype, 'setItem')
    const remove = vi.spyOn(Storage.prototype, 'removeItem')
    const fetch = vi.spyOn(globalThis, 'fetch')
    expect(single().status).toBe('captured')
    expect(comparison([scenario()]).status).toBe('captured')
    for (const spy of [get, set, remove, fetch]) expect(spy).not.toHaveBeenCalled()
  })

  it('migrates legacy saved inputs on copies, recording both schema versions', () => {
    const legacy = structuredClone(scenario()) as unknown as Record<string, unknown>
    legacy.schemaVersion = '1.0.0'
    const inputs = legacy.inputs as SavedScenario['inputs']
    Reflect.deleteProperty(inputs.financing, 'additionalRepayments')
    const before = JSON.stringify(legacy)
    const actual = snapshot(comparison([legacy])).properties[0]!
    expect(actual).toMatchObject({
      sourceSchemaVersion: '1.0.0',
      schemaVersion: '1.1.0',
      migrated: true,
    })
    expect(actual.inputs.financing.additionalRepayments).toEqual(
      workspace.initialFinancingDraft.additionalRepayments,
    )
    expect(actual.comparisonValues!.timeSaved).toMatchObject({ status: 'available', months: 0 })
    expect(JSON.stringify(legacy)).toBe(before)
  })

  it('recalculates 22 comparison metrics for up to three properties in selected order', () => {
    const documents = [scenario('a'), scenario('b'), scenario('c')]
    documents[0]!.inputs.financing.additionalRepayments.annualAdditionalRepayment = '5.000'
    const actual = snapshot(comparison(documents, ['c', 'a', 'b']))
    expect(actual.properties.map((item) => item.ordinal)).toEqual([1, 2, 3])
    actual.properties.forEach((item, index) => {
      const saved = documents[[2, 0, 1][index]!]!
      expect(Object.keys(item.comparisonValues!)).toEqual(comparisonMetricIds)
      expect(item.comparisonValues).toEqual(
        JSON.parse(JSON.stringify(calculateSavedScenarioComparison(saved).values)),
      )
    })
    expect(actual.properties[1]!.comparisonValues).toMatchObject({
      interestSaved: { cents: 881_096, basis: 'fixed:120' },
      projectedInterestSaved: { cents: 5_320_614, basis: 'constant-rate:loan-months' },
      timeSaved: { months: 145 },
    })
    expect(actual.properties[1]!.results.selectedAmortizationBasis).toBe('additional-repayments')
  })

  it('retains differing fixed-period and owner/rental projection bases with mixed-basis warnings', () => {
    const owner = scenario('owner')
    const rental = scenario('rental')
    rental.inputs.financing.fixedInterestYears = '15'
    Object.assign(rental.inputs.analysis, {
      propertyUse: 'rental-investment',
      monthlyNetColdRent: '1000',
      monthlyNonRecoverableHausgeld: '150',
      rentalHoldingYears: '15',
      rentalPropertyAppreciationRate: '2',
      rentalSellingCostRate: '3',
      targetGrossYield: '5',
      targetNetYield: '4',
    })
    const actual = snapshot(comparison([owner, rental], ['owner', 'rental']))
    expect(actual.mixedBasisMetrics).toContain('remainingDebt')
    expect(actual.mixedBasisMetrics).toContain('projectedReturn')
    expect(actual.properties[0]!.comparisonValues!.remainingDebt).toMatchObject({
      basis: 'fixed:120',
    })
    expect(actual.properties[1]!.comparisonValues!.remainingDebt).toMatchObject({
      basis: 'fixed:180',
    })
    expect(actual.properties[1]!.inputs.analysis).not.toHaveProperty('currentComparableRent')
  })

  it('preserves invalid repayment plans as unavailable without labeling baseline rows as selected', () => {
    const saved = scenario()
    saved.inputs.financing.additionalRepayments.oneTimeAdditionalRepayments = [
      { amount: '1000', month: '' },
    ]
    const actual = snapshot(comparison([saved]))
    expect(actual.status).toBe('incomplete')
    const item = actual.properties[0]!
    expect(item.results.amortization.status).toBe('available')
    expect(item.results.selectedAmortizationBasis).toBe('unavailable')
    expect(item.results.selectedAmortization.status).toBe('unavailable')
    expect(item.comparisonValues!.interestSaved.status).toBe('unavailable')
    expect(item.comparisonValues!.remainingDebt.status).toBe('unavailable')
    expect(JSON.stringify(actual)).not.toContain('"value":null')
  })

  it('retains missing requested inputs and underfunding as incomplete, without inventing zeros', () => {
    const saved = scenario()
    saved.inputs.analysis.currentComparableRent = ''
    const missing = snapshot(single(saved))
    expect(missing.status).toBe('incomplete')
    expect(missing.properties[0]!.results.modeSpecific.result).toMatchObject({
      status: 'not-configured',
      reason: 'missing-inputs',
    })
    saved.inputs.financing.availableEquity = '1000'
    expect(snapshot(single(saved)).properties[0]).toMatchObject({
      status: 'incomplete',
      results: { financing: { status: 'available', fundingStatus: 'underfunded' } },
    })
  })

  it('preserves cash purchase not-applicable states and genuine zero savings', () => {
    const cash = scenario()
    cash.inputs.financing.downPayment = '250000'
    cash.inputs.financing.availableEquity = '266250'
    const actual = snapshot(comparison([cash]))
    expect(actual.status).toBe('complete')
    expect(actual.properties[0]!.results.payment).toMatchObject({
      status: 'available',
      cashPurchase: true,
      monthlyPaymentCents: 0,
    })
    expect(actual.properties[0]!.comparisonValues!.remainingDebt.status).toBe('not-applicable')
    expect(actual.properties[0]!.comparisonValues!.interestSaved.status).toBe('not-applicable')
    const financed = snapshot(comparison([scenario()])).properties[0]!
    expect(financed.comparisonValues!.interestSaved).toMatchObject({
      status: 'available',
      cents: 0,
    })
    expect(financed.results.selectedAmortizationBasis).toBe('baseline')
  })

  it.each(['250000junk', '250.000,001', '250,000.00', 'NaN'])(
    'blocks malformed German money %s instead of coercing it',
    (value) => {
      const saved = scenario()
      saved.inputs.purchaseCosts.purchasePrice = value
      expect(single(saved)).toMatchObject({
        status: 'blocked',
        issue: 'invalid-input-format',
        fields: ['purchaseCosts.purchasePrice'],
      })
    },
  )

  it.each([
    'financing.availableEquity',
    'financing.nominalAnnualRate',
    'financing.fixedInterestYears',
    'analysis.monthlyOwnerCosts',
  ])('blocks missing or malformed active input %s', (path) => {
    const saved = scenario()
    const [section, field] = path.split('.') as ['financing' | 'analysis', string]
    Reflect.set(saved.inputs[section], field, path === 'financing.availableEquity' ? '' : 'invalid')
    expect(single(saved)).toMatchObject({ status: 'blocked', fields: [path] })
  })

  it('blocks missing mortgage rates, but preserves valid negative inputs as domain unavailable results', () => {
    const saved = scenario()
    saved.inputs.financing.nominalAnnualRate = ''
    expect(single(saved)).toMatchObject({
      status: 'blocked',
      issue: 'missing-required-inputs',
      fields: ['financing.nominalAnnualRate'],
    })
    saved.inputs.financing.nominalAnnualRate = '-3'
    expect(snapshot(single(saved))).toMatchObject({
      status: 'incomplete',
      properties: [{ results: { payment: { status: 'unavailable' } } }],
    })
  })

  it.each([[[]], [['private-id', 'private-id']], [['absent']], [['a', 'b', 'c', 'd']]])(
    'blocks invalid selection %j',
    (ids) => {
      expect(comparison([scenario()], ids)).toEqual({
        status: 'blocked',
        issue: 'invalid-selection',
      })
    },
  )

  it('blocks corrupt, unsupported, oversized and duplicate library documents before capture', () => {
    const saved = scenario()
    expect(comparison([{ ...saved, schemaVersion: '9.0.0' }])).toMatchObject({
      issue: 'unsupported-version',
    })
    expect(comparison([{ ...saved, inputs: {} }])).toMatchObject({ issue: 'invalid-schema' })
    expect(comparison([saved, saved])).toMatchObject({ issue: 'invalid-selection' })
    expect(comparison(Array.from({ length: 101 }, () => saved))).toMatchObject({
      issue: 'invalid-schema',
    })
    expect(
      captureComparisonReport(
        { documents: [saved], selectedIds: [saved.id], libraryIssue: 'corrupted' },
        options,
      ),
    ).toMatchObject({ issue: 'library-unavailable' })
    expect(single({ ...saved, inputs: {} } as SavedScenario)).toMatchObject({
      issue: 'invalid-schema',
    })
  })

  it('blocks invalid options and unexpected calculation failures without returning partial/private data', () => {
    expect(single(scenario(), { ...options, generatedAt: 'not-a-date' })).toEqual({
      status: 'blocked',
      issue: 'invalid-options',
    })
    expect(
      single(scenario(), { ...options, buildIdentity: { commit: 'bad', workingTreeDirty: false } }),
    ).toMatchObject({ issue: 'invalid-options' })
    vi.spyOn(workspace, 'calculateScenarioDashboard').mockImplementationOnce(() => {
      throw new Error('Private address')
    })
    expect(single()).toEqual({ status: 'blocked', issue: 'calculation-failed' })
  })
})
