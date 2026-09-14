import { describe, expect, it } from 'vitest'

import {
  assertFiniteNumber,
  assertNumberInRange,
  assertSafeInteger,
  FinancialValidationError,
  financialValidationErrorCodes,
  validationFailure,
} from './validation'

describe('financial validation', () => {
  it('accepts finite numbers and safe integers', () => {
    expect(assertFiniteNumber(3.5, 'rate')).toBe(3.5)
    expect(assertSafeInteger(250_000_00, 'purchasePriceCents')).toBe(250_000_00)
  })

  it.each([
    ['not a number', financialValidationErrorCodes.invalidType],
    [Number.NaN, financialValidationErrorCodes.notFinite],
    [Number.POSITIVE_INFINITY, financialValidationErrorCodes.notFinite],
  ])('rejects non-finite numeric input %s', (value, code) => {
    expect(() => assertFiniteNumber(value, 'amount')).toThrowError(
      expect.objectContaining({ code, field: 'amount', value }),
    )
  })

  it.each([
    [1.5, financialValidationErrorCodes.notInteger],
    [Number.MAX_SAFE_INTEGER + 1, financialValidationErrorCodes.unsafeInteger],
  ])('rejects invalid cent integer %s', (value, code) => {
    expect(() => assertSafeInteger(value, 'amountCents')).toThrowError(
      expect.objectContaining({ code, field: 'amountCents' }),
    )
  })

  it('supports inclusive and exclusive range boundaries', () => {
    expect(assertNumberInRange(0, 'share', { min: 0, max: 1 })).toBe(0)
    expect(
      assertNumberInRange(0.5, 'share', {
        min: 0,
        max: 1,
        minInclusive: false,
        maxInclusive: false,
      }),
    ).toBe(0.5)
    expect(() =>
      assertNumberInRange(1, 'share', {
        min: 0,
        max: 1,
        maxInclusive: false,
      }),
    ).toThrowError(expect.objectContaining({ code: 'OUT_OF_RANGE' }))
  })

  it('creates errors with stable machine-readable context', () => {
    expect(() =>
      validationFailure('REQUIRED', 'purchasePriceCents', 'Purchase price is required', undefined),
    ).toThrowError(
      new FinancialValidationError(
        'REQUIRED',
        'purchasePriceCents',
        'Purchase price is required',
        undefined,
      ),
    )
  })
})
