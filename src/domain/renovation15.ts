/**
 * § 6(1) no. 1a EStG, §§ 9(5), 7 EStG: acquisition-related building work.
 * Planning classification for ONE work item; multiple works must be aggregated
 * across the rolling three-year window before claiming tax treatment.
 *
 * BMF 26 January 2026 guidance, III:
 * https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Steuerarten/Einkommensteuer/2026-01-26-instandsetzung-modernisierung-gebaeude.pdf
 *
 * Gross payments stay in upfront cash. The 15% test uses net-of-VAT work
 * expense and acquisition cost attributable to the BUILDING, not land.
 * Works exceeding the threshold are entirely capitalised, not only the excess.
 */
export type RenovationCategory =
  | 'modernization'
  | 'annual-maintenance'
  | 'extension'
  | 'subsequent-damage'
  | 'capital-improvement'

export type RenovationDisposition = 'deductible' | 'capitalized' | 'review' | 'none'

export interface RenovationRuleInput {
  acquisitionDate: string
  workPerformedDate: string
  buildingAcquisitionCostEuro: number
  workGrossEuro: number
  vatRatePercent: number
  category: RenovationCategory
}

export interface RenovationRuleResult {
  disposition: RenovationDisposition
  withinThreeYears: boolean | null
  thresholdEuro: number
  qualifyingNetEuro: number
  totalCapitalizedEuro: number
  immediatelyDeductibleEuro: number
  reason: string
}

/** Invalid dates are not silently coerced into eligible tax deductions. */
function validatedDate(raw: string): Date | null {
  if (!raw) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Error('Use YYYY-MM-DD dates')
  const date = new Date(raw + 'T00:00:00Z')
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== raw) {
    throw new Error('Invalid calendar date')
  }
  return date
}

export function evaluateRenovation15Percent(input: RenovationRuleInput): RenovationRuleResult {
  for (const [label, amount] of [
    ['Building acquisition cost', input.buildingAcquisitionCostEuro],
    ['Renovation cash amount', input.workGrossEuro],
  ] as const) {
    if (!Number.isFinite(amount) || amount < 0 || amount > 100_000_000) {
      throw new Error(label + ' must be a non-negative finite amount')
    }
  }
  if (![0, 7, 19].includes(input.vatRatePercent)) {
    throw new Error('VAT rate must be 0%, 7% or 19%')
  }
  const validCategories: RenovationCategory[] = [
    'modernization', 'annual-maintenance', 'extension', 'subsequent-damage', 'capital-improvement',
  ]
  if (!validCategories.includes(input.category)) throw new Error('Unknown renovation category')

  const thresholdEuro = Math.round(input.buildingAcquisitionCostEuro * 15) / 100
  const qualifyingNetEuro = Math.round(input.workGrossEuro / (1 + input.vatRatePercent / 100) * 100) / 100
  const basic = {
    thresholdEuro, qualifyingNetEuro, withinThreeYears: null,
    totalCapitalizedEuro: 0, immediatelyDeductibleEuro: 0,
  }
  if (input.workGrossEuro === 0) {
    return { ...basic, disposition: 'none', reason: 'No renovation cost entered' }
  }
  if (input.category === 'extension' || input.category === 'capital-improvement') {
    return {
      ...basic, disposition: 'capitalized', totalCapitalizedEuro: input.workGrossEuro,
      reason: 'Extensions and building improvements are capitalized independently of the 15% threshold',
    }
  }
  const acquired = validatedDate(input.acquisitionDate)
  const performed = validatedDate(input.workPerformedDate)
  if (acquired && performed && performed.getTime() < acquired.getTime()) {
    return { ...basic, disposition: 'review', reason: 'Work before acquisition needs individual treatment' }
  }
  if (input.category === 'annual-maintenance' || input.category === 'subsequent-damage') {
    return {
      ...basic, disposition: 'deductible', immediatelyDeductibleEuro: input.workGrossEuro,
      reason: 'Declared exception to the 15% modernization test; eligibility requires documentation',
    }
  }
  if (!acquired || !performed) {
    return {
      ...basic, disposition: 'review',
      reason: 'Enter economic ownership transfer and work-performance dates before claiming an immediate deduction',
    }
  }
  if (input.buildingAcquisitionCostEuro === 0) {
    return {
      ...basic, disposition: 'review', reason: 'Building acquisition basis must exclude land and be greater than zero',
    }
  }
  const thirdAnniversary = new Date(Date.UTC(
    acquired.getUTCFullYear() + 3, acquired.getUTCMonth(), acquired.getUTCDate(),
  ))
  const withinThreeYears = performed < thirdAnniversary
  const overThreshold = qualifyingNetEuro > thresholdEuro
  if (withinThreeYears && overThreshold) {
    return {
      ...basic, withinThreeYears, disposition: 'capitalized',
      totalCapitalizedEuro: input.workGrossEuro,
      reason: 'Net modernization work exceeds 15% of building acquisition costs within three years; full cost is capitalized',
    }
  }
  return {
    ...basic, withinThreeYears, disposition: 'deductible',
    immediatelyDeductibleEuro: input.workGrossEuro,
    reason: withinThreeYears
      ? 'Eligible modernization does not exceed the 15% threshold (assuming no other qualifying work)'
      : 'Work performed after the three-year acquisition window (subject to ordinary capitalization tests)',
  }
}
