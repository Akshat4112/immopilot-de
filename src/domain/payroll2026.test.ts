import { describe, expect, it } from 'vitest'
import { payroll2026 } from './payroll2026'

const base = {
  monthlyGrossEuro: 5000,
  taxClass: 1 as const,
  healthInsurance: 'gkv' as const,
  gkvSupplementPercent: 2.5,
  childlessCareSurcharge: true,
  saxony: false,
  pkvBasicPremiumMonthlyEuro: 0,
  pkvEmployerSubsidyMonthlyEuro: 0,
  pensionInsured: true,
  unemploymentInsured: true,
  childAllowances: 0,
}

describe('2026 BMF PAP wage-tax adapter', () => {
  it('matches a published BMF external API vector', () => {
    const result = payroll2026(base)
    expect(result.wageTaxEuro).toBe(785.83)
    expect(result.solidarityEuro).toBe(0)
    expect(result.papInputs).toMatchObject({
      LZZ: 2,
      RE4: 500000,
      STKL: 1,
      KVZ: 2.5,
      PVZ: 1,
    })
  })

  it('supports all six German payroll classes', () => {
    for (const taxClass of [1, 2, 3, 4, 5, 6] as const) {
      const result = payroll2026({ ...base, taxClass })
      expect(result.wageTaxEuro).toBeGreaterThanOrEqual(0)
      expect(result.solidarityEuro).toBeGreaterThanOrEqual(0)
    }
  })

  it('handles private insurance with PAP monthly cent inputs', () => {
    const result = payroll2026({
      ...base,
      healthInsurance: 'pkv',
      pkvBasicPremiumMonthlyEuro: 450,
      pkvEmployerSubsidyMonthlyEuro: 225,
    })
    expect(result.papInputs.PKV).toBe(1)
    expect(result.papInputs.PKPV).toBe(45000)
    expect(result.papInputs.PKPVAGZ).toBe(22500)
    expect(Number.isFinite(result.wageTaxEuro)).toBe(true)
  })

  it('rejects malformed inputs instead of silently projecting payroll', () => {
    expect(() => payroll2026({ ...base, monthlyGrossEuro: -1 })).toThrow()
    expect(() => payroll2026({ ...base, gkvSupplementPercent: -2 })).toThrow()
    expect(() => payroll2026({ ...base, taxClass: 7 as 1 })).toThrow()
  })
})
