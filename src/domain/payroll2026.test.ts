import { describe, expect, it } from 'vitest'
import { payroll2026 } from './payroll2026'
import { Pap2026 } from '../vendor/bmf-pap2026/pap2026'

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

describe('2026 published BMF API reference vectors across payroll classes', () => {
  // Cent values sourced from the open-source implementation's collected BMF API fixture.
  const fixtures = [
    { taxClass: 1, wageTaxCents: 81741 },
    { taxClass: 2, wageTaxCents: 69800 },
    { taxClass: 3, wageTaxCents: 42850 },
    { taxClass: 4, wageTaxCents: 81741 },
    { taxClass: 5, wageTaxCents: 132333 },
    { taxClass: 6, wageTaxCents: 136766 },
  ]

  it.each(fixtures)(
    'matches class $taxClass at €5,000 monthly without optional inputs',
    ({ taxClass, wageTaxCents }) => {
      const pap = new Pap2026()
      pap.setInputs({ LZZ: 2, RE4: 500000, STKL: taxClass })
      pap.calculate()
      expect(pap.getOutputs().LSTLZZ).toBe(wageTaxCents)
    },
  )

  it('matches the documented GKV and Pflegeversicherung example', () => {
    const pap = new Pap2026()
    pap.setInputs({ LZZ: 2, RE4: 500000, STKL: 1, KVZ: 2.5, PVZ: 1 })
    pap.calculate()
    expect(pap.getOutputs().LSTLZZ).toBe(78583)
  })
})
