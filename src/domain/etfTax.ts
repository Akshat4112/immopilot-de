/**
 * ETF-001/002 — reviewable German fund-tax primitives, not yet wired to the live planner.
 * InvStG §18: https://www.gesetze-im-internet.de/invstg_2018/__18.html
 * InvStG §20: https://www.gesetze-im-internet.de/invstg_2018/__20.html
 * BMF 2026 Basiszins 3.20%, Vorabpauschale deemed received 2027-01-04:
 * https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Steuerarten/Investmentsteuer/2026-01-13-basiszins-berechnung-vorabpauschale.html
 *
 * Callers must provide historical lot/share prices, distributions and allowances.
 * No implicit Basiszins for unverified years, no inferred cost basis, no UI liquidation claims.
 */

export type FundCategory = 'equity' | 'mixed' | 'other'
export type TaxYear = number

const cents = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100

function amount(label: string, value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000) {
    throw new Error(`${label} must be a finite non-negative amount`)
  }
}
function rate(label: string, value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${label} must be between 0 and 1`)
  }
}
export function privateFundTaxableShare(category: FundCategory): number {
  if (category === 'equity') return 0.7
  if (category === 'mixed') return 0.85
  if (category === 'other') return 1
  throw new Error('Unknown fund category')
}

export interface AdvanceTaxInput {
  /** Explicitly verified tax-year basis interest, as a fraction, e.g. 0.032 in 2026. */
  basisInterestRate: number
  taxYear: TaxYear
  units: number
  openingPriceEuro: number
  closingPriceEuro: number
  /** Gross distributed amounts attributable to these units during the tax year. */
  distributionsEuro: number
  /** 1 = January, 12 = December; applies only if units were acquired in taxYear. */
  acquisitionMonth?: number
  category: FundCategory
}
export interface AdvanceTaxResult {
  basicYieldEuro: number
  cappedBasicYieldEuro: number
  /** Pretax Vorabpauschale under §18, BEFORE Teilfreistellung. */
  advanceAmountEuro: number
  taxableAdvanceEuro: number
  /** Calendar year whose next business day records a deemed receipt; settlement is elsewhere. */
  deemedReceiptTaxYear: number
}

export function calculateAdvanceTax(input: AdvanceTaxInput): AdvanceTaxResult {
  if (!Number.isInteger(input.taxYear) || input.taxYear < 2018 || input.taxYear > 2200) {
    throw new Error('Tax year must be between 2018 and 2200')
  }
  rate('Basiszins', input.basisInterestRate)
  for (const [label, val] of [
    ['Units', input.units],
    ['Opening price', input.openingPriceEuro],
    ['Closing price', input.closingPriceEuro],
    ['Distributions', input.distributionsEuro],
  ] as const) {
    amount(label, val)
  }
  if (
    input.acquisitionMonth !== undefined &&
    (!Number.isInteger(input.acquisitionMonth) ||
      input.acquisitionMonth < 1 ||
      input.acquisitionMonth > 12)
  ) {
    throw new Error('Acquisition month must be 1–12')
  }
  const grossBasis = input.units * input.openingPriceEuro * 0.7 * input.basisInterestRate
  const growthPlusDistributions = Math.max(
    0,
    input.units * (input.closingPriceEuro - input.openingPriceEuro) + input.distributionsEuro,
  )
  const capped = Math.min(grossBasis, growthPlusDistributions)
  // §18(1): advance is the capped basic yield not already covered by actual distributions.
  const afterDistributions = Math.max(0, capped - input.distributionsEuro)
  const fraction = input.acquisitionMonth === undefined ? 1 : (13 - input.acquisitionMonth) / 12
  const advanceAmountEuro = cents(afterDistributions * fraction)
  return {
    basicYieldEuro: cents(grossBasis),
    cappedBasicYieldEuro: cents(capped),
    advanceAmountEuro,
    taxableAdvanceEuro: cents(advanceAmountEuro * privateFundTaxableShare(input.category)),
    deemedReceiptTaxYear: input.taxYear + 1,
  }
}

export interface FifoLot {
  lotId: string
  units: number
  purchasePricePerUnitEuro: number
  /** Total §18 Vorabpauschale previously ASSESSED on remaining shares; before §20 exemption. */
  previousAdvancePerUnitEuro: number
}
export interface FifoSaleInput {
  lotsOldestFirst: FifoLot[]
  soldUnits: number
  salePricePerUnitEuro: number
  /** Actual sale transaction cost, allocated to sold units. */
  saleCostsEuro: number
  category: FundCategory
}
export interface SaleLine {
  lotId: string
  units: number
  proceedsEuro: number
  costBasisEuro: number
  previousAdvanceOffsetEuro: number
  gainAfterAdvanceOffsetEuro: number
}
export interface FifoSaleResult {
  lines: SaleLine[]
  totalProceedsEuro: number
  totalCostBasisEuro: number
  totalAdvanceOffsetEuro: number
  gainBeforePartialExemptionEuro: number
  /** Signed gain/loss after §20 exemption; tax loss offset and withholding done separately. */
  taxableGainEuro: number
  remainingLots: FifoLot[]
}

export function calculateFifoSale(input: FifoSaleInput): FifoSaleResult {
  for (const [label, val] of [
    ['Sold units', input.soldUnits],
    ['Sale price', input.salePricePerUnitEuro],
    ['Sale costs', input.saleCostsEuro],
  ] as const) {
    amount(label, val)
  }
  if (input.soldUnits === 0 && input.saleCostsEuro !== 0) {
    throw new Error('Sale costs require sold units')
  }
  const share = privateFundTaxableShare(input.category)
  const seen = new Set<string>()
  for (const lot of input.lotsOldestFirst) {
    if (!lot.lotId || seen.has(lot.lotId)) throw new Error('Lot IDs must be unique and non-empty')
    seen.add(lot.lotId)
    amount('Lot units', lot.units)
    amount('Purchase price', lot.purchasePricePerUnitEuro)
    amount('Earlier assessed advance', lot.previousAdvancePerUnitEuro)
  }
  if (input.soldUnits > input.lotsOldestFirst.reduce((sum, lot) => sum + lot.units, 0) + 1e-9) {
    throw new Error('Sale exceeds available units')
  }
  const lines: SaleLine[] = []
  const remainingLots: FifoLot[] = []
  let left = input.soldUnits
  let rawCostBasis = 0
  let rawAdvanceOffset = 0
  for (const lot of input.lotsOldestFirst) {
    const taken = Math.min(left, lot.units)
    const remaining = Math.max(0, lot.units - taken)
    if (taken > 0) {
      const proceeds = taken * input.salePricePerUnitEuro
      const basis = taken * lot.purchasePricePerUnitEuro
      const offset = taken * lot.previousAdvancePerUnitEuro
      rawCostBasis += basis
      rawAdvanceOffset += offset
      lines.push({
        lotId: lot.lotId,
        units: taken,
        proceedsEuro: cents(proceeds),
        costBasisEuro: cents(basis),
        previousAdvanceOffsetEuro: cents(offset),
        gainAfterAdvanceOffsetEuro: cents(proceeds - basis - offset),
      })
    }
    if (remaining > 1e-9) remainingLots.push({ ...lot, units: remaining })
    left -= taken
  }
  const totalProceedsEuro = cents(input.soldUnits * input.salePricePerUnitEuro)
  // Round aggregate amounts once; reconcile the final FIFO line to the totals.
  const totalCostBasisEuro = cents(rawCostBasis)
  const totalAdvanceOffsetEuro = cents(rawAdvanceOffset)
  if (lines.length > 0) {
    const last = lines[lines.length - 1]
    last.proceedsEuro = cents(
      last.proceedsEuro + totalProceedsEuro - lines.reduce((sum, line) => sum + line.proceedsEuro, 0),
    )
    last.costBasisEuro = cents(
      last.costBasisEuro + totalCostBasisEuro - lines.reduce((sum, line) => sum + line.costBasisEuro, 0),
    )
    const summedAdvanceOffsets = lines.reduce(
      (sum, line) => sum + line.previousAdvanceOffsetEuro,
      0,
    )
    const advanceOffsetDifference = totalAdvanceOffsetEuro - summedAdvanceOffsets
    last.previousAdvanceOffsetEuro = cents(
      last.previousAdvanceOffsetEuro + advanceOffsetDifference,
    )
    for (const line of lines) {
      line.gainAfterAdvanceOffsetEuro = cents(
        line.proceedsEuro - line.costBasisEuro - line.previousAdvanceOffsetEuro,
      )
    }
  }
  const gain = cents(
    totalProceedsEuro - totalCostBasisEuro - totalAdvanceOffsetEuro - input.saleCostsEuro,
  )
  return {
    lines,
    totalProceedsEuro,
    totalCostBasisEuro,
    totalAdvanceOffsetEuro,
    gainBeforePartialExemptionEuro: gain,
    taxableGainEuro: cents(gain * share),
    remainingLots,
  }
}
