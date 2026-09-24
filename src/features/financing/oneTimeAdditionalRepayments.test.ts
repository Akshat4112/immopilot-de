import { describe, expect, it } from 'vitest'

import { sortOneTimeAdditionalRepaymentDrafts } from '../scenario-workspace'
import { validateOneTimeAdditionalRepayments } from './oneTimeAdditionalRepayments'

describe('one-time additional repayments', () => {
  it('requires both amount and month in every row', () => {
    expect(validateOneTimeAdditionalRepayments([{ amount: '', month: '' }], 'de')).toEqual([
      {
        amountCents: 0,
        month: null,
        amountIssue: 'missing-amount',
        monthIssue: 'missing-month',
      },
    ])
  })

  it('accepts German and English locale-formatted amounts and months through 1,200', () => {
    expect(
      validateOneTimeAdditionalRepayments([{ amount: '2.500,50', month: '1200' }], 'de'),
    ).toEqual([{ amountCents: 250_050, month: 1_200 }])
    expect(validateOneTimeAdditionalRepayments([{ amount: '2,500.50', month: '1' }], 'en')).toEqual(
      [{ amountCents: 250_050, month: 1 }],
    )
  })

  it('rejects negative, malformed, and unsafe amounts', () => {
    expect(
      validateOneTimeAdditionalRepayments(
        [
          { amount: '-1', month: '1' },
          { amount: '1.2.3', month: '2' },
          { amount: '999999999999999999999', month: '3' },
        ],
        'de',
      ).map((row) => row.amountIssue),
    ).toEqual(['negative-amount', 'invalid-amount', 'invalid-amount'])
  })

  it('rejects non-whole, non-positive, and out-of-range loan months', () => {
    expect(
      validateOneTimeAdditionalRepayments(
        [
          { amount: '100', month: '0' },
          { amount: '100', month: '1.5' },
          { amount: '100', month: '1201' },
        ],
        'de',
      ).map((row) => row.monthIssue),
    ).toEqual(['invalid-month', 'invalid-month', 'invalid-month'])
  })

  it('marks duplicate one-time months while allowing any separate recurring month', () => {
    const validation = validateOneTimeAdditionalRepayments(
      [
        { amount: '100', month: '12' },
        { amount: '200', month: '12' },
      ],
      'de',
    )

    expect(validation.map((row) => row.monthIssue)).toEqual(['duplicate-month', 'duplicate-month'])
  })

  it('sorts completed rows by month and keeps incomplete rows stable at the end', () => {
    expect(
      sortOneTimeAdditionalRepaymentDrafts([
        { amount: '2.000', month: '24' },
        { amount: '', month: '' },
        { amount: '1.000', month: '6' },
        { amount: 'invalid', month: '12' },
      ]),
    ).toEqual([
      { amount: '1.000', month: '6' },
      { amount: 'invalid', month: '12' },
      { amount: '2.000', month: '24' },
      { amount: '', month: '' },
    ])
  })
})
