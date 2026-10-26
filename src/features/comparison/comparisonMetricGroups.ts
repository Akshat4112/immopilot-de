import type { ComparisonMetricId } from './comparisonCalculations'

export const comparisonMetricGroups: Array<{
  id: 'purchase' | 'financing' | 'repayment' | 'performance' | 'offer'
  metrics: ComparisonMetricId[]
}> = [
  { id: 'purchase', metrics: ['purchasePrice', 'acquisitionCosts'] },
  { id: 'financing', metrics: ['equity', 'loan', 'monthlyPayment', 'remainingDebt'] },
  {
    id: 'repayment',
    metrics: [
      'additionalPrincipal',
      'interestSaved',
      'remainingDebtReduction',
      'projectedInterestSaved',
      'baselinePayoff',
      'selectedPayoff',
      'timeSaved',
    ],
  },
  {
    id: 'performance',
    metrics: ['grossYield', 'netYield', 'monthlyCashFlow', 'projectedReturn'],
  },
  {
    id: 'offer',
    metrics: [
      'grossYieldCeiling',
      'netYieldCeiling',
      'affordabilityCeiling',
      'comparableValue',
      'openingOffer',
    ],
  },
]
