import type Decimal from 'decimal.js'

import { decimal, roundHalfUpToInteger } from './rounding'
import {
  assertSafeInteger,
  financialValidationErrorCodes,
  validationFailure,
} from './validation'

declare const moneyCentsBrand: unique symbol

export type MoneyCents = number & {
  readonly [moneyCentsBrand]: 'MoneyCents'
}

const maxSafeMoney = BigInt(Number.MAX_SAFE_INTEGER)
const minSafeMoney = BigInt(Number.MIN_SAFE_INTEGER)

function fromCheckedBigInt(value: bigint, field: string): MoneyCents {
  if (value > maxSafeMoney || value < minSafeMoney) {
    return validationFailure(
      financialValidationErrorCodes.arithmeticOverflow,
      field,
      `${field} exceeds the safe integer range`,
      value,
    )
  }

  return Number(value) as MoneyCents
}

export function moneyCents(value: unknown, field = 'moneyCents'): MoneyCents {
  return assertSafeInteger(value, field) as MoneyCents
}

export function nonNegativeMoneyCents(value: unknown, field = 'moneyCents'): MoneyCents {
  const amount = moneyCents(value, field)

  if (amount < 0) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      field,
      `${field} must be non-negative`,
      value,
    )
  }

  return amount
}

export function eurosToCents(value: Decimal.Value, field = 'euros'): MoneyCents {
  return moneyCents(roundHalfUpToInteger(decimal(value, field).times(100), field), field)
}

export function centsToEuros(value: MoneyCents): Decimal {
  return decimal(value, 'moneyCents').dividedBy(100)
}

export function sumMoney(values: readonly MoneyCents[]): MoneyCents {
  const total = values.reduce((sum, value) => sum + BigInt(value), 0n)
  return fromCheckedBigInt(total, 'moneySum')
}

export function addMoney(left: MoneyCents, right: MoneyCents): MoneyCents {
  return fromCheckedBigInt(BigInt(left) + BigInt(right), 'moneySum')
}

export function subtractMoney(left: MoneyCents, right: MoneyCents): MoneyCents {
  return fromCheckedBigInt(BigInt(left) - BigInt(right), 'moneyDifference')
}

export function minMoney(left: MoneyCents, right: MoneyCents): MoneyCents {
  return left <= right ? left : right
}

export function maxMoney(left: MoneyCents, right: MoneyCents): MoneyCents {
  return left >= right ? left : right
}

export function multiplyMoney(
  amount: MoneyCents,
  multiplier: Decimal.Value,
  field = 'moneyProduct',
): MoneyCents {
  return moneyCents(
    roundHalfUpToInteger(decimal(amount).times(decimal(multiplier)), field),
    field,
  )
}
