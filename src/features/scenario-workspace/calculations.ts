import {
  calculateAcquisitionCosts,
  type AcquisitionCostInput,
  type AcquisitionCostResult,
} from '../../domain/acquisition-costs'
import {
  calculateFinancing,
  type FinancingInput,
  type FinancingResult,
} from '../../domain/financing'
import {
  calculateAmortizationSchedule,
  calculateMortgagePayment,
  type AmortizationScheduleResult,
  type MortgagePaymentInput,
  type MortgagePaymentResult,
} from '../../domain/mortgage'

import type { FinancingDraft, PurchaseCostsDraft } from './scenarioStore'

function parseEuroInput(value: string): number {
  const cleaned = value.replace(/[€\\s.]/g, '').replace(',', '.')

  if (!cleaned) {
    return 0
  }

  const euros = Number.parseFloat(cleaned)
  return Number.isFinite(euros) ? Math.round(euros * 100) : 0
}

function parseRateInput(value: string): number {
  const cleaned = value.replace(/[%\\s]/g, '').replace(',', '.')

  if (!cleaned) {
    return 0
  }

  const percentage = Number.parseFloat(cleaned)
  return Number.isFinite(percentage) ? percentage / 100 : 0
}

function parseOptionalRateInput(value: string | undefined): number | undefined {
  return value?.trim() ? parseRateInput(value) : undefined
}

export function acquisitionCostInputFromDraft(draft: PurchaseCostsDraft): AcquisitionCostInput {
  const rateOverrides = {
    transferTaxRate: parseOptionalRateInput(draft.rateOverrides?.transferTaxRate),
    notaryRate: parseOptionalRateInput(draft.rateOverrides?.notaryRate),
    landRegisterRate: parseOptionalRateInput(draft.rateOverrides?.landRegisterRate),
    buyerBrokerRate: parseOptionalRateInput(draft.rateOverrides?.buyerBrokerRate),
  }

  return {
    purchasePriceCents: parseEuroInput(draft.purchasePrice),
    stateId: draft.stateId,
    brokerInvolved: draft.brokerInvolved,
    rateOverrides: Object.values(rateOverrides).some((rate) => rate !== undefined)
      ? rateOverrides
      : undefined,
    renovationBudget: draft.renovationBudget,
    movingSetupCosts: draft.movingSetupCosts,
  }
}

export function financingInputFromDraft(
  draft: FinancingDraft,
  acquisition: AcquisitionCostResult,
): FinancingInput {
  const sharedInput = {
    acquisition,
    availableEquityCents: parseEuroInput(draft.availableEquity),
    financedAcquisitionCostShare: parseRateInput(draft.financedAcquisitionCostShare),
  }

  return draft.mode === 'available-equity'
    ? {
        ...sharedInput,
        mode: 'available-equity',
      }
    : {
        ...sharedInput,
        mode: 'selected-down-payment',
        downPaymentCents: parseEuroInput(draft.downPayment),
      }
}

export function mortgagePaymentInputFromDraft(
  draft: FinancingDraft,
  financing: FinancingResult,
): MortgagePaymentInput {
  return {
    paymentMode: 'initial-repayment-rate',
    financing,
    nominalAnnualRate: parseRateInput(draft.nominalAnnualRate),
    initialRepaymentRate: parseRateInput(draft.initialRepaymentRate),
  }
}

function fixedInterestMonthsFromDraft(draft: FinancingDraft): number {
  const years = Number.parseInt(draft.fixedInterestYears, 10)
  return Number.isSafeInteger(years) ? years * 12 : 0
}

export interface ScenarioWorkspaceCalculationResult {
  acquisition: AcquisitionCostResult
  financing: FinancingResult
  payment: MortgagePaymentResult
  amortization: AmortizationScheduleResult
}

export function calculateScenarioWorkspace(
  purchaseCosts: PurchaseCostsDraft,
  financingDraft: FinancingDraft,
): ScenarioWorkspaceCalculationResult {
  const acquisition = calculateAcquisitionCosts(acquisitionCostInputFromDraft(purchaseCosts))
  const financing = calculateFinancing(financingInputFromDraft(financingDraft, acquisition))
  const payment = calculateMortgagePayment(mortgagePaymentInputFromDraft(financingDraft, financing))
  const amortization = calculateAmortizationSchedule({
    payment,
    fixedInterestMonths: fixedInterestMonthsFromDraft(financingDraft),
  })

  return {
    acquisition,
    financing,
    payment,
    amortization,
  }
}
