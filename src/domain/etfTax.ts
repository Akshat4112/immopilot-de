/**
 * ETF-001: German private-investor investment-fund tax planning engine.
 * The engine is independent of portfolio projections until independently reconciled.
 *
 * InvStG §§ 16, 18–20: https://www.gesetze-im-internet.de/invstg_2018/
 * BMF basis rate 2026: 3.20%; taxable deemed receipt 2027-01-04.
 * https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Steuerarten/Investmentsteuer/2026-01-13-basiszins-berechnung-vorabpauschale.html
 *
 * Assumptions: natural person, private assets, German taxation; no church tax,
 * foreign withholding, loss pots, treaty effects or Günstigerprüfung. The caller
 * allocates the *remaining* Sparer-Pauschbetrag across the whole taxpayer portfolio;
 * do not award the full allowance to each ETF or each taxable event.
 */
export type FundCategory =
  'equity' | 'mixed' | 'real-estate-domestic' | 'real-estate-foreign' | 'other'

export const FUND_EXEMPTION: Record<FundCategory, number> = {
  equity: 0.3,
  mixed: 0.15,
  'real-estate-domestic': 0.6,
  'real-estate-foreign': 0.8,
  other: 0,
}

export const BASIS_RATE_BY_YEAR: Readonly<Record<number, number>> = {
  2023: 0.0255,
  2024: 0.0229,
  2025: 0.0253,
  2026: 0.032,
}

export interface AdvanceTaxInput {
  year: number
  category: FundCategory
  startOfYearValueEuro: number
  endOfYearValueEuro: number
  distributionsEuro: number
  /** 1–12. January for shares held from the start of the year. */
  acquisitionMonth: number
  /** Published annual basis rate as a fraction; required for years not in table. */
  annualBasisRate?: number
  /** Remaining unused allowance for THIS tax event, not the full household total. */
  remainingAllowanceEuro: number
  /** 0.25 for standard withholding; fractional. */
  capitalGainsTaxRate?: number
  solidarityRate?: number
}

export interface AdvanceTaxResult {
  year: number
  deemedReceiptYear: number
  /** null means date must be resolved for non-2026 years. */
  deemedReceiptDate: string | null
  baseReturnEuro: number
  cappedFundReturnEuro: number
  advancePaymentEuro: number
  taxableAdvanceEuro: number
  allowanceUsedEuro: number
  taxBaseEuro: number
  estimatedTaxEuro: number
  exemptionFraction: number
}

const cents = (amount: number): number => Math.round((amount + Number.EPSILON) * 100) / 100

function nonnegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000_000) {
    throw new Error(name + ' must be a finite non-negative euro amount')
  }
}

function taxSettings(taxRate: number, solidarity: number): void {
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1) {
    throw new Error('Capital gains tax rate must be between 0 and 1')
  }
  if (!Number.isFinite(solidarity) || solidarity < 0 || solidarity > 1) {
    throw new Error('Solidarity rate must be between 0 and 1')
  }
}

function exemption(category: FundCategory): number {
  if (!Object.prototype.hasOwnProperty.call(FUND_EXEMPTION, category)) {
    throw new Error('Unsupported fund classification')
  }
  return FUND_EXEMPTION[category]
}

/** Statutory Vorabpauschale of accumulating / partly distributing fund shares. */
export function calculateAdvanceTax(input: AdvanceTaxInput): AdvanceTaxResult {
  if (!Number.isInteger(input.year) || input.year < 2018 || input.year > 2100) {
    throw new Error('Invalid investment tax year')
  }
  for (const [label, amount] of [
    ['Start-of-year value', input.startOfYearValueEuro],
    ['End-of-year value', input.endOfYearValueEuro],
    ['Distributions', input.distributionsEuro],
    ['Unused allowance', input.remainingAllowanceEuro],
  ] as const)
    nonnegative(label, amount)
  if (
    !Number.isInteger(input.acquisitionMonth) ||
    input.acquisitionMonth < 1 ||
    input.acquisitionMonth > 12
  ) {
    throw new Error('Acquisition month must be 1–12')
  }
  const basisRate = input.annualBasisRate ?? BASIS_RATE_BY_YEAR[input.year]
  if (
    basisRate === undefined ||
    !Number.isFinite(basisRate) ||
    basisRate < -0.1 ||
    basisRate > 0.5
  ) {
    throw new Error('Provide a verified annual basis rate for this tax year')
  }
  const rate = input.capitalGainsTaxRate ?? 0.25
  const solidarity = input.solidarityRate ?? 0.055
  taxSettings(rate, solidarity)
  const exemptionFraction = exemption(input.category)
  // Base income = 70% × official basis rate × start value.
  // Statutory cap includes distributions: max(0, end value - start value + distributions).
  const baseReturnEuro = cents(Math.max(0, input.startOfYearValueEuro * basisRate * 0.7))
  const cappedFundReturnEuro = cents(
    Math.max(0, input.endOfYearValueEuro - input.startOfYearValueEuro + input.distributionsEuro),
  )
  const cappedBase = Math.min(baseReturnEuro, cappedFundReturnEuro)
  const preAcquisitionMonths = input.acquisitionMonth - 1
  // First apply distribution reduction and then prorate the advance payment for
  // full months preceding acquisition. Caller must provide values on a consistent
  // basis; start-of-year market value is a proxy for new purchase lots.
  const unprorated = Math.max(0, cents(cappedBase - input.distributionsEuro))
  const advancePaymentEuro = cents((unprorated * (12 - preAcquisitionMonths)) / 12)
  const taxableAdvanceEuro = cents(advancePaymentEuro * (1 - exemptionFraction))
  const allowanceUsedEuro = cents(Math.min(input.remainingAllowanceEuro, taxableAdvanceEuro))
  const taxBaseEuro = cents(Math.max(0, taxableAdvanceEuro - allowanceUsedEuro))
  const estimatedTaxEuro = cents(taxBaseEuro * rate * (1 + solidarity))
  return {
    year: input.year,
    deemedReceiptYear: input.year + 1,
    deemedReceiptDate: input.year === 2026 ? '2027-01-04' : null,
    baseReturnEuro,
    cappedFundReturnEuro,
    advancePaymentEuro,
    taxableAdvanceEuro,
    allowanceUsedEuro,
    taxBaseEuro,
    estimatedTaxEuro,
    exemptionFraction,
  }
}

export interface ETFDisposalTaxInput {
  category: FundCategory
  saleProceedsEuro: number
  purchaseCostEuro: number
  /** Sum of ALL previously assessed gross Vorabpauschalen for the disposed units. */
  historicalAssessedAdvanceEuro: number
  remainingAllowanceEuro: number
  capitalGainsTaxRate?: number
  solidarityRate?: number
}

export interface ETFDisposalTaxResult {
  rawGainEuro: number
  adjustedGainEuro: number
  taxableGainEuro: number
  allowanceUsedEuro: number
  taxBaseEuro: number
  estimatedTaxEuro: number
  /** Losses are reported, not offset automatically against other holdings. */
  lossForSeparateTreatmentEuro: number
}

/** §19 InvStG offsets assessed gross Vorabpauschalen before partial exemption. */
export function calculateDisposalTax(input: ETFDisposalTaxInput): ETFDisposalTaxResult {
  for (const [label, amount] of [
    ['Proceeds', input.saleProceedsEuro],
    ['Purchase cost', input.purchaseCostEuro],
    ['Previously assessed advances', input.historicalAssessedAdvanceEuro],
    ['Unused allowance', input.remainingAllowanceEuro],
  ] as const)
    nonnegative(label, amount)
  const rate = input.capitalGainsTaxRate ?? 0.25
  const solidarity = input.solidarityRate ?? 0.055
  taxSettings(rate, solidarity)
  const exemptionFraction = exemption(input.category)
  const rawGainEuro = cents(input.saleProceedsEuro - input.purchaseCostEuro)
  const adjustedGainEuro = cents(rawGainEuro - input.historicalAssessedAdvanceEuro)
  const taxableGainEuro = cents(Math.max(0, adjustedGainEuro) * (1 - exemptionFraction))
  const allowanceUsedEuro = cents(Math.min(taxableGainEuro, input.remainingAllowanceEuro))
  const taxBaseEuro = cents(taxableGainEuro - allowanceUsedEuro)
  return {
    rawGainEuro,
    adjustedGainEuro,
    taxableGainEuro,
    allowanceUsedEuro,
    taxBaseEuro,
    estimatedTaxEuro: cents(taxBaseEuro * rate * (1 + solidarity)),
    lossForSeparateTreatmentEuro: cents(Math.max(0, -adjustedGainEuro)),
  }
}
