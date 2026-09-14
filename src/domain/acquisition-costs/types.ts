import type { DecimalValue, MoneyCents, Rate } from '../shared'

import type { GermanStateId } from './tax-rates'

export const budgetStatuses = ['not-budgeted', 'confirmed-zero', 'budgeted'] as const

export type BudgetStatus = (typeof budgetStatuses)[number]
export type AcquisitionAssumptionOrigin = 'state-lookup' | 'assumption-default' | 'user-override'
export type UnconfirmedBudgetField = 'renovationBudget' | 'movingSetupCosts'

export interface PostPurchaseBudgetInput {
  amountCents: number
  budgetStatus: BudgetStatus
}

export interface AcquisitionCostRateOverrides {
  transferTaxRate?: DecimalValue
  notaryRate?: DecimalValue
  landRegisterRate?: DecimalValue
  buyerBrokerRate?: DecimalValue
}

export interface AcquisitionCostInput {
  purchasePriceCents: number
  stateId: GermanStateId | string
  brokerInvolved?: boolean
  rateOverrides?: AcquisitionCostRateOverrides
  renovationBudget?: PostPurchaseBudgetInput
  movingSetupCosts?: PostPurchaseBudgetInput
}

export interface AppliedAcquisitionRate {
  value: Rate
  origin: AcquisitionAssumptionOrigin
}

export interface ResolvedPostPurchaseBudget {
  amountCents: MoneyCents
  budgetStatus: BudgetStatus
  origin: Exclude<AcquisitionAssumptionOrigin, 'state-lookup'>
}

export interface AppliedAcquisitionAssumptions {
  assumptionSetVersion: string
  transferTaxRateSourceDate: string
  transferTaxRate: AppliedAcquisitionRate
  notaryRate: AppliedAcquisitionRate
  landRegisterRate: AppliedAcquisitionRate
  buyerBrokerRate: AppliedAcquisitionRate
  renovationBudget: ResolvedPostPurchaseBudget
  movingSetupCosts: ResolvedPostPurchaseBudget
}

interface AcquisitionCostResultBase {
  purchasePriceCents: MoneyCents
  stateId: GermanStateId
  brokerInvolved: boolean
  transferTaxCents: MoneyCents
  notaryCostsCents: MoneyCents
  landRegisterCostsCents: MoneyCents
  buyerBrokerCommissionCents: MoneyCents
  transactionAcquisitionCostsCents: MoneyCents
  appliedAssumptions: AppliedAcquisitionAssumptions
}

export interface AvailableAcquisitionCostResult extends AcquisitionCostResultBase {
  status: 'available'
  postPurchaseBudgetCents: MoneyCents
  allAdditionalInitialOutlayCents: MoneyCents
  totalProjectCostCents: MoneyCents
}

export interface UnavailableAcquisitionCostResult extends AcquisitionCostResultBase {
  status: 'unavailable'
  reason: 'POST_PURCHASE_BUDGET_NOT_CONFIRMED'
  unconfirmedBudgetFields: readonly UnconfirmedBudgetField[]
  postPurchaseBudgetCents: null
  allAdditionalInitialOutlayCents: null
  totalProjectCostCents: null
}

export type AcquisitionCostResult =
  AvailableAcquisitionCostResult | UnavailableAcquisitionCostResult
