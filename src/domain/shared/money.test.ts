import { describe, expect, it } from 'vitest'

import {
  addMoney,
  centsToEuros,
  eurosToCents,
  maxMoney,
  minMoney,
  moneyCents,
  multiplyMoney,
  nonNegativeMoneyCents,
  subtractMoney,
  sumMoney,
} from './money'

describe('cent-exact money', () => {
  it('creates signed money and validates non-negative inputs separately', () => {
    expect(moneyCents(-18_000)).toBe(-18_000)
    expect(nonNegativeMoneyCents(0)).toBe(0)
    expect(() => nonNegativeMoneyCents(-1, 'purchasePriceCents')).toThrowError(
      expect.objectContaining({
        code: 'OUT_OF_RANGE',
        field: 'purchasePriceCents',
      }),
    )
  })

  it.each([
    ['1.004', 100],
    ['1.005', 101],
    ['-1.005', -101],
  ])('converts %s euros to %d cents with half-up rounding', (euros, cents) => {
    expect(eurosToCents(euros)).toBe(cents)
  })

  it('converts cents to decimal euros without floating-point loss', () => {
    expect(centsToEuros(moneyCents(12_345)).toString()).toBe('123.45')
  })

  it('performs safe cent arithmetic', () => {
    const left = moneyCents(12_500)
    const right = moneyCents(2_500)

    expect(addMoney(left, right)).toBe(15_000)
    expect(subtractMoney(left, right)).toBe(10_000)
    expect(sumMoney([left, right, moneyCents(-500)])).toBe(14_500)
    expect(minMoney(left, right)).toBe(right)
    expect(maxMoney(left, right)).toBe(left)
  })

  it('detects arithmetic overflow before precision is lost', () => {
    expect(() =>
      addMoney(moneyCents(Number.MAX_SAFE_INTEGER), moneyCents(1)),
    ).toThrowError(expect.objectContaining({ code: 'ARITHMETIC_OVERFLOW' }))
  })

  it('multiplies cent amounts at a half-up boundary', () => {
    expect(multiplyMoney(moneyCents(10_050), '0.005')).toBe(50)
    expect(multiplyMoney(moneyCents(10_100), '0.005')).toBe(51)
  })
})
