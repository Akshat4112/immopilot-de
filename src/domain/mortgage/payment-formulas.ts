import {
  assertSafeInteger,
  decimal,
  financialValidationErrorCodes,
  multiplyMoney,
  safeDivide,
  validationFailure,
  type MoneyCents,
  type Rate,
} from '../shared'

/** Shared CF-004/CF-008 fully amortizing annuity, independently rounded half-up to cents. */
export function fullyAmortizingMonthlyPayment(
  principalCents: MoneyCents,
  monthlyNominalRate: Rate,
  repaymentTermMonths: number,
): MoneyCents {
  const months = assertSafeInteger(repaymentTermMonths, 'repaymentTermMonths')

  if (months <= 0) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      'repaymentTermMonths',
      'repaymentTermMonths must be greater than zero',
      repaymentTermMonths,
    )
  }

  const multiplier = monthlyNominalRate.isZero()
    ? safeDivide(1, months, 'repaymentTermMonths')
    : safeDivide(
        monthlyNominalRate,
        decimal(1).minus(decimal(1).plus(monthlyNominalRate).pow(-months)),
        'amortizationDenominator',
      )

  return multiplyMoney(principalCents, multiplier, 'fullyAmortizingMonthlyPaymentCents')
}
