import { Pap2026 } from '../vendor/bmf-pap2026/pap2026'
import type { LohnsteuerInputs } from '../vendor/bmf-pap2026/types'

export interface Payroll2026Request {
  monthlyGrossEuro: number
  taxClass: 1 | 2 | 3 | 4 | 5 | 6
  healthInsurance: 'gkv' | 'pkv'
  gkvSupplementPercent: number
  childlessCareSurcharge: boolean
  saxony: boolean
  pkvBasicPremiumMonthlyEuro: number
  pkvEmployerSubsidyMonthlyEuro: number
  pensionInsured: boolean
  unemploymentInsured: boolean
  childAllowances: number
}

export interface Payroll2026Result {
  wageTaxEuro: number
  solidarityEuro: number
  churchTaxBaseEuro: number
  papInputs: LohnsteuerInputs
}

export function payroll2026(input: Payroll2026Request): Payroll2026Result {
  if (!Number.isFinite(input.monthlyGrossEuro) || input.monthlyGrossEuro < 0 || input.monthlyGrossEuro > 1_000_000) {
    throw new Error('Monthly gross must be between €0 and €1,000,000')
  }
  if (!Number.isInteger(input.taxClass) || input.taxClass < 1 || input.taxClass > 6) {
    throw new Error('Tax class must be I–VI')
  }
  if (!Number.isFinite(input.gkvSupplementPercent) || input.gkvSupplementPercent < 0 || input.gkvSupplementPercent > 10) {
    throw new Error('GKV supplementary rate must be between 0% and 10%')
  }
  for (const value of [input.pkvBasicPremiumMonthlyEuro, input.pkvEmployerSubsidyMonthlyEuro]) {
    if (!Number.isFinite(value) || value < 0 || value > 100_000) {
      throw new Error('PKV amounts must be non-negative and plausible')
    }
  }
  if (!Number.isFinite(input.childAllowances) || input.childAllowances < 0 || input.childAllowances > 20) {
    throw new Error('Child allowances must be between 0 and 20')
  }
  const cents = (euros: number) => Math.round(euros * 100)
  const papInputs: LohnsteuerInputs = {
    LZZ: 2,
    RE4: cents(input.monthlyGrossEuro),
    STKL: input.taxClass,
    KVZ: input.gkvSupplementPercent,
    PVZ: input.childlessCareSurcharge ? 1 : 0,
    PVS: input.saxony ? 1 : 0,
    KRV: input.pensionInsured ? 0 : 1,
    ALV: input.unemploymentInsured ? 0 : 1,
    ZKF: input.childAllowances,
    PKV: input.healthInsurance === 'pkv' ? 1 : 0,
    PKPV: input.healthInsurance === 'pkv' ? cents(input.pkvBasicPremiumMonthlyEuro) : 0,
    PKPVAGZ: input.healthInsurance === 'pkv' ? cents(input.pkvEmployerSubsidyMonthlyEuro) : 0,
  }
  const pap = new Pap2026()
  pap.setInputs(papInputs)
  pap.calculate()
  const result = pap.getOutputs()
  return {
    wageTaxEuro: result.LSTLZZ / 100,
    solidarityEuro: result.SOLZLZZ / 100,
    churchTaxBaseEuro: result.BK / 100,
    papInputs,
  }
}
