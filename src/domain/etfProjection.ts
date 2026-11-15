import {
  calculateAdvanceTax,
  calculateDisposalTax,
  type FundCategory,
} from './etfTax'

/**
 * ETF-002: conservative annual portfolio tax ledger for a single ETF.
 * This deliberately does not guess future BMF rates. One annual deposit is
 * made after the advance-tax valuation; monthly savings/FIFO need a lot ledger.
 * Cash paid as advance tax reduces free cash, not the fund's market value.
 */
export interface ETFProjectionInput {
  startYear: number
  years: number
  category: FundCategory
  initialValueEuro: number
  initialCostBasisEuro: number
  annualContributionEuro: number
  annualReturns: number[]
  annualBasisRates: number[]
  annualDistributionsEuro: number[]
  /** Tax allowance still available for the ETF after other investment income. */
  annualRemainingAllowancesEuro: number[]
}

export interface ETFProjectionRow {
  year: number
  valueBeforeSaleEuro: number
  investedCostEuro: number
  advanceEuro: number
  advanceTaxEuro: number
  cumulativeAdvanceEuro: number
  cumulativeAdvanceTaxEuro: number
  hypotheticalSaleTaxEuro: number
  cumulativeTaxEuro: number
  liquidationValueEuro: number
}

export function projectAfterTaxETF(input: ETFProjectionInput): ETFProjectionRow[] {
  if (
    !Number.isInteger(input.startYear) ||
    input.startYear < 2018 ||
    !Number.isInteger(input.years) ||
    input.years < 1 ||
    input.years > 80
  ) {
    throw new Error('Invalid projection period')
  }
  const values = [
    input.initialValueEuro,
    input.initialCostBasisEuro,
    input.annualContributionEuro,
  ]
  if (
    values.some((value) => !Number.isFinite(value) || value < 0) ||
    input.initialCostBasisEuro > input.initialValueEuro + 1e-9
  ) {
    throw new Error('Invalid initial ETF value, basis or contribution')
  }
  for (const [name, entries] of [
    ['returns', input.annualReturns],
    ['BMF basis rates', input.annualBasisRates],
    ['distributions', input.annualDistributionsEuro],
    ['allowances', input.annualRemainingAllowancesEuro],
  ] as const) {
    if (entries.length !== input.years) {
      throw new Error('Provide one ' + name + ' entry per year')
    }
  }
  let value = input.initialValueEuro
  let cost = input.initialCostBasisEuro
  let assessedAdvance = 0
  let cumulativeAdvanceTax = 0
  const rows: ETFProjectionRow[] = []
  for (let index = 0; index < input.years; index++) {
    const annualReturn = input.annualReturns[index]
    const distribution = input.annualDistributionsEuro[index]
    const rate = input.annualBasisRates[index]
    const allowance = input.annualRemainingAllowancesEuro[index]
    if (!Number.isFinite(annualReturn) || annualReturn < -1 || annualReturn > 10) {
      throw new Error('Invalid annual ETF return')
    }
    if (
      !Number.isFinite(rate) ||
      rate < -0.1 ||
      rate > 0.5 ||
      !Number.isFinite(distribution) ||
      distribution < 0 ||
      !Number.isFinite(allowance) ||
      allowance < 0
    ) {
      throw new Error('Invalid tax input for year ' + (input.startYear + index))
    }
    const opening = value
    // Return includes reinvested distributions. With distributions paid out,
    // market value decreases by their amount; they are not silently reinvested.
    value = Math.max(0, opening * (1 + annualReturn) - distribution)
    const advance = calculateAdvanceTax({
      year: input.startYear + index,
      category: input.category,
      startOfYearValueEuro: opening,
      endOfYearValueEuro: value,
      distributionsEuro: distribution,
      acquisitionMonth: 1,
      annualBasisRate: rate,
      remainingAllowanceEuro: allowance,
    })
    assessedAdvance += advance.advancePaymentEuro
    cumulativeAdvanceTax += advance.estimatedTaxEuro
    // Deposits occur at the end of the modelled year, not retrospectively.
    value += input.annualContributionEuro
    cost += input.annualContributionEuro
    const disposal = calculateDisposalTax({
      category: input.category,
      saleProceedsEuro: value,
      purchaseCostEuro: cost,
      historicalAssessedAdvanceEuro: assessedAdvance,
      remainingAllowanceEuro: Math.max(
        0,
        allowance - advance.allowanceUsedEuro,
      ),
    })
    // Distributions are separate cash receipts. Tax on distributions is NOT
    // modelled, so values cannot be described as total after-tax household wealth.
    rows.push({
      year: input.startYear + index,
      valueBeforeSaleEuro: value,
      investedCostEuro: cost,
      advanceEuro: advance.advancePaymentEuro,
      advanceTaxEuro: advance.estimatedTaxEuro,
      cumulativeAdvanceEuro: assessedAdvance,
      cumulativeAdvanceTaxEuro: cumulativeAdvanceTax,
      hypotheticalSaleTaxEuro: disposal.estimatedTaxEuro,
      cumulativeTaxEuro: cumulativeAdvanceTax + disposal.estimatedTaxEuro,
      liquidationValueEuro:
        value - cumulativeAdvanceTax - disposal.estimatedTaxEuro,
    })
  }
  return rows
}
