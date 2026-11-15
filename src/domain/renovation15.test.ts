import { describe, expect, it } from 'vitest'
import { evaluateRenovation15Percent } from './renovation15'

const base = {
  acquisitionDate: '2026-01-15',
  workPerformedDate: '2027-06-01',
  buildingAcquisitionCostEuro: 160000,
  workGrossEuro: 23800,
  vatRatePercent: 19,
  category: 'modernization' as const,
}

describe('RENT-003 German three-year and 15% renovation classification', () => {
  it('uses 15% of building acquisition costs and net renovation costs', () => {
    const result = evaluateRenovation15Percent(base)
    expect(result.thresholdEuro).toBe(24000)
    expect(result.qualifyingNetEuro).toBe(20000)
    expect(result.disposition).toBe('deductible')
    expect(result.immediatelyDeductibleEuro).toBe(23800)
  })

  it('capitalizes the entire amount only when work exceeds, not equals, 15%', () => {
    const equal = evaluateRenovation15Percent({ ...base, workGrossEuro: 28560 })
    const above = evaluateRenovation15Percent({ ...base, workGrossEuro: 28561 })
    expect(equal.disposition).toBe('deductible')
    expect(above.disposition).toBe('capitalized')
    expect(above.totalCapitalizedEuro).toBe(28561)
    expect(above.immediatelyDeductibleEuro).toBe(0)
  })

  it('uses exact day boundaries from economic ownership transfer', () => {
    expect(evaluateRenovation15Percent({
      ...base, workPerformedDate: '2029-01-14', workGrossEuro: 30000,
    }).disposition).toBe('capitalized')
    const outside = evaluateRenovation15Percent({
      ...base, workPerformedDate: '2029-01-15', workGrossEuro: 30000,
    })
    expect(outside.withinThreeYears).toBe(false)
    expect(outside.disposition).toBe('deductible')
  })

  it('excludes routine maintenance and subsequent documented damage', () => {
    for (const category of ['annual-maintenance', 'subsequent-damage'] as const) {
      const result = evaluateRenovation15Percent({ ...base, category, workGrossEuro: 50000 })
      expect(result.disposition).toBe('deductible')
    }
  })

  it('capitalizes extensions and capital improvements independent of threshold', () => {
    for (const category of ['extension', 'capital-improvement'] as const) {
      const result = evaluateRenovation15Percent({ ...base, category, workGrossEuro: 1000 })
      expect(result.disposition).toBe('capitalized')
      expect(result.totalCapitalizedEuro).toBe(1000)
    }
  })

  it('prevents immediate tax deduction without dates', () => {
    const result = evaluateRenovation15Percent({ ...base, acquisitionDate: '' })
    expect(result.disposition).toBe('review')
    expect(result.immediatelyDeductibleEuro).toBe(0)
    expect(result.totalCapitalizedEuro).toBe(0)
  })

  it('rejects invalid dates, future work before acquisition and negative costs', () => {
    expect(() => evaluateRenovation15Percent({ ...base, workPerformedDate: '2026-02-30' })).toThrow()
    expect(evaluateRenovation15Percent({
      ...base, workPerformedDate: '2025-12-31',
    }).disposition).toBe('review')
    expect(() => evaluateRenovation15Percent({ ...base, workGrossEuro: -1 })).toThrow()
  })

  it('does not grant a renovation deduction for no work', () => {
    const result = evaluateRenovation15Percent({ ...base, workGrossEuro: 0 })
    expect(result.disposition).toBe('none')
  })
})
