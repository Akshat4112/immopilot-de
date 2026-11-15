/**
 * Expense reconciliation for an income-producing German rental.
 * Debt interest and eligible operating costs can be rental Werbungskosten.
 * Mortgage principal, WEG reserve contributions and capitalised building works
 * are NOT immediately deductible.
 * Annual cash excludes initial acquisition/renovation expenditure because the
 * planner shows those upfront separately.
 */
export interface RentalExpenseInput {
  collectedRentEuro: number
  recoverableCostsEuro: number
  nonrecoverableCostsEuro: number
  eligibleRepairsEuro: number
  wegReserveContributionEuro: number
  mortgageInterestEuro: number
  mortgagePrincipalEuro: number
  mortgagePaymentEuro: number
  buildingAfaEuro: number
  eligibleOneTimeMaintenanceEuro: number
}

export interface RentalExpenseResult {
  deductibleOperatingEuro: number
  deductibleInterestEuro: number
  deductibleAfaEuro: number
  deductibleOneTimeMaintenanceEuro: number
  annualRecurringTaxableEuro: number
  firstYearTaxableEuro: number
  annualCashBeforeIncomeTaxEuro: number
  nonDeductiblePrincipalEuro: number
  nonDeductibleReserveEuro: number
}

export function calculateRentalExpenseBreakdown(input: RentalExpenseInput): RentalExpenseResult {
  for (const [name, value] of Object.entries(input)) {
    if (!Number.isFinite(value) || value < 0 || value > 100_000_000) {
      throw new Error(`${name} must be finite, positive or zero, and within €100 million`)
    }
  }
  if (input.mortgagePaymentEuro + 0.01 < input.mortgageInterestEuro + input.mortgagePrincipalEuro) {
    throw new Error('Mortgage payments must cover principal plus interest')
  }
  const deductibleOperatingEuro = input.recoverableCostsEuro + input.nonrecoverableCostsEuro + input.eligibleRepairsEuro
  const annualRecurringTaxableEuro =
    input.collectedRentEuro - deductibleOperatingEuro - input.mortgageInterestEuro - input.buildingAfaEuro
  const annualCashBeforeIncomeTaxEuro =
    input.collectedRentEuro -
    (deductibleOperatingEuro + input.wegReserveContributionEuro) -
    input.mortgagePaymentEuro
  return {
    deductibleOperatingEuro,
    deductibleInterestEuro: input.mortgageInterestEuro,
    deductibleAfaEuro: input.buildingAfaEuro,
    deductibleOneTimeMaintenanceEuro: input.eligibleOneTimeMaintenanceEuro,
    annualRecurringTaxableEuro,
    firstYearTaxableEuro: annualRecurringTaxableEuro - input.eligibleOneTimeMaintenanceEuro,
    annualCashBeforeIncomeTaxEuro,
    nonDeductiblePrincipalEuro: input.mortgagePrincipalEuro,
    nonDeductibleReserveEuro: input.wegReserveContributionEuro,
  }
}
