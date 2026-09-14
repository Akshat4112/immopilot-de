import { describe, expect, it } from 'vitest'

import { moneyCents, multiplyMoney } from '../shared'

import {
  acquisitionAssumptionSetVersion,
  getTransferTaxRate,
  germanStateIds,
  transferTaxRateSourceDate,
  type GermanStateId,
} from './tax-rates'

const expectedTaxCents: ReadonlyArray<readonly [GermanStateId, number]> = [
  ['DE-BW', 500_000],
  ['DE-BY', 350_000],
  ['DE-BE', 600_000],
  ['DE-BB', 650_000],
  ['DE-HB', 550_000],
  ['DE-HH', 550_000],
  ['DE-HE', 600_000],
  ['DE-MV', 600_000],
  ['DE-NI', 500_000],
  ['DE-NW', 650_000],
  ['DE-RP', 500_000],
  ['DE-SL', 650_000],
  ['DE-SN', 550_000],
  ['DE-ST', 500_000],
  ['DE-SH', 650_000],
  ['DE-TH', 500_000],
]

describe('German transfer-tax lookup', () => {
  it('contains every German state exactly once with version metadata', () => {
    expect(germanStateIds).toHaveLength(16)
    expect(new Set(germanStateIds).size).toBe(16)
    expect(acquisitionAssumptionSetVersion).toBe('de-2026.09')
    expect(transferTaxRateSourceDate).toBe('2026-01-28')
  })

  it.each(expectedTaxCents)('calculates the PD-007 tax vector for %s', (stateId, expected) => {
    const tax = multiplyMoney(moneyCents(10_000_000), getTransferTaxRate(stateId))

    expect(tax).toBe(expected)
  })

  it('rejects unknown and non-string identifiers with stable errors', () => {
    expect(() => getTransferTaxRate('DE-XX')).toThrowError(
      expect.objectContaining({ code: 'OUT_OF_RANGE', field: 'stateId' }),
    )
    expect(() => getTransferTaxRate(42)).toThrowError(
      expect.objectContaining({ code: 'INVALID_TYPE', field: 'stateId' }),
    )
  })
})
