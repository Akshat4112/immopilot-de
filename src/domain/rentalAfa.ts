/**
 * Residential rental building depreciation (lineare Gebäude-AfA), § 7(4) EStG.
 * The building-only allocation applies to purchase price AND capitalisable acquisition expenses.
 * This module deliberately does not simulate § 7(5a) declining-balance AfA,
 * special allowances (§ 7b), renovation capitalisation, or shorter proven useful life.
 * Sources:
 * https://www.gesetze-im-internet.de/estg/__7.html
 * https://amtliche-handbuecher.bundesfinanzministerium.de/lsth/2026/A-Einkommensteuergesetz/II-Einkommen-2-24b/3-Gewinn-4-7i/Paragraf-7/inhalt.html
 */
export interface RentalBuildingAfaInput {
  purchasePriceEuro: number
  acquisitionCostsEuro: number
  /** Allocated share of purchase price and associated costs attributable to the building, not land. */
  buildingSharePercent: number
  completionYear: number
  /** YYYY-MM-DD: date building becomes eligible for rental/income-producing use by owner. */
  eligibleFromDate: string
  taxYear: number
  /** Share of building genuinely used for rental/income-producing activity. */
  rentalUsePercent: number
  /** Capitalizable building improvements commissioned with rental use; exclude land. */
  capitalisedImprovementEuro?: number
}

export interface RentalBuildingAfaResult {
  annualRatePercent: number
  totalAcquisitionCostEuro: number
  depreciableBuildingBasisEuro: number
  landAndOtherBasisEuro: number
  fullYearAfaEuro: number
  qualifyingMonths: number
  taxYearAfaEuro: number
  rentalBuildingBasisEuro: number
}

const roundCents = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100

function nonnegative(name: string, amount: number): void {
  if (!Number.isFinite(amount) || amount < 0 || amount > 100_000_000) {
    throw new Error(`${name} must be a finite non-negative amount within €100 million`)
  }
}

function proportion(name: string, amount: number): void {
  if (!Number.isFinite(amount) || amount < 0 || amount > 100) {
    throw new Error(`${name} must be between 0 and 100%`)
  }
}

function year(name: string, amount: number): void {
  if (!Number.isInteger(amount) || amount < 1800 || amount > 2200) {
    throw new Error(`${name} must be an integer year between 1800 and 2200`)
  }
}

/**
 * Standard linear rate is determined by the ORIGINAL building completion date,
 * not by the date the current owner bought an existing building.
 */
export function linearResidentialAfaRate(completionYear: number): number {
  year('Completion year', completionYear)
  if (completionYear < 1925) return 2.5
  if (completionYear < 2023) return 2
  return 3
}

export function calculateRentalBuildingAfa(input: RentalBuildingAfaInput): RentalBuildingAfaResult {
  nonnegative('Purchase price', input.purchasePriceEuro)
  nonnegative('Acquisition costs', input.acquisitionCostsEuro)
  nonnegative('Capitalized improvements', input.capitalisedImprovementEuro ?? 0)
  proportion('Building share', input.buildingSharePercent)
  proportion('Rental-use share', input.rentalUsePercent)
  year('Completion year', input.completionYear)
  year('Tax year', input.taxYear)

  const date = new Date(`${input.eligibleFromDate}T00:00:00Z`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.eligibleFromDate) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== input.eligibleFromDate
  ) {
    throw new Error('Eligible-from date must be a valid YYYY-MM-DD date')
  }
  const eligibleYear = date.getUTCFullYear()
  if (input.completionYear > eligibleYear) {
    throw new Error('Building completion cannot be later than first eligible rental use')
  }
  const qualifyingMonths =
    input.taxYear < eligibleYear ? 0 : input.taxYear === eligibleYear ? 12 - date.getUTCMonth() : 12

  const totalAcquisitionCostEuro = roundCents(input.purchasePriceEuro + input.acquisitionCostsEuro)
  const buildingRatio = input.buildingSharePercent / 100
  const rentalRatio = input.rentalUsePercent / 100
  const originalBuildingBasis = roundCents(totalAcquisitionCostEuro * buildingRatio)
  const depreciableBuildingBasisEuro = roundCents(originalBuildingBasis + (input.capitalisedImprovementEuro ?? 0))
  const landAndOtherBasisEuro = roundCents(totalAcquisitionCostEuro - originalBuildingBasis)
  const annualRatePercent = linearResidentialAfaRate(input.completionYear)
  const rentalBuildingBasisEuro = roundCents(depreciableBuildingBasisEuro * rentalRatio)
  const fullYearAfaEuro = roundCents(rentalBuildingBasisEuro * (annualRatePercent / 100))
  // Do not depreciate more than 100% of the owner's rental-attributable building basis.
  // Months in the first tax year before the eligibility month never count.
  const priorQualifyingMonths =
    input.taxYear <= eligibleYear ? 0 : (input.taxYear - eligibleYear) * 12 - date.getUTCMonth()
  const cumulativePriorAfa = Math.min(
    rentalBuildingBasisEuro,
    roundCents((fullYearAfaEuro * priorQualifyingMonths) / 12),
  )
  const taxYearAfaEuro = Math.min(
    roundCents((fullYearAfaEuro * qualifyingMonths) / 12),
    Math.max(0, roundCents(rentalBuildingBasisEuro - cumulativePriorAfa)),
  )

  return {
    annualRatePercent,
    totalAcquisitionCostEuro,
    depreciableBuildingBasisEuro,
    landAndOtherBasisEuro,
    rentalBuildingBasisEuro,
    fullYearAfaEuro,
    qualifyingMonths,
    taxYearAfaEuro,
  }
}
