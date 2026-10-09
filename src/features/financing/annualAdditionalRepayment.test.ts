import { describe, expect, it } from 'vitest'

import { validateAnnualAdditionalRepayment } from './annualAdditionalRepayment'

describe('annual additional repayment validation', () => {
  it('treats an empty amount as zero without requiring a month', () => {
    expect(validateAnnualAdditionalRepayment('', '', 'de')).toEqual({ amountCents: 0 })
  })

  it('parses German and English locale-formatted euro amounts', () => {
    expect(validateAnnualAdditionalRepayment('5.000,50', '12', 'de')).toEqual({
      amountCents: 500_050,
    })
    expect(validateAnnualAdditionalRepayment('5,000.50', '3', 'en')).toEqual({
      amountCents: 500_050,
    })
  })

  it('rejects negative, malformed, and unsafe amounts', () => {
    expect(validateAnnualAdditionalRepayment('-100', '12', 'de')).toMatchObject({
      amountIssue: 'negative-amount',
    })
    expect(validateAnnualAdditionalRepayment('1.2.3', '12', 'de')).toMatchObject({
      amountIssue: 'invalid-amount',
    })
    expect(validateAnnualAdditionalRepayment('999999999999999999999', '12', 'de')).toMatchObject({
      amountIssue: 'invalid-amount',
    })
  })

  it('requires a whole loan-year month from 1 through 12 for a positive amount', () => {
    expect(validateAnnualAdditionalRepayment('5000', '', 'de')).toMatchObject({
      monthIssue: 'invalid-month',
    })
    expect(validateAnnualAdditionalRepayment('5000', '13', 'de')).toMatchObject({
      monthIssue: 'invalid-month',
    })
    expect(validateAnnualAdditionalRepayment('0', '', 'de')).toEqual({ amountCents: 0 })
  })
})
