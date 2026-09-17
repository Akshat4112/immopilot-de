import { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { calculateAcquisitionCosts } from '../../domain/acquisition-costs'
import type {
  AcquisitionCostResult,
  AcquisitionCostInput,
  BudgetStatus,
} from '../../domain/acquisition-costs'
import {
  purchaseCostsInputSchema,
  type PurchaseCostsInput,
  QUICK_DEFAULTS,
  germanStateIds,
  budgetStatuses,
} from './schema'

export interface PurchaseCostsFormData extends PurchaseCostsInput {
  // Form-specific fields
  purchasePrice: string
  availableEquity: string
  nominalRate: string
  initialRepaymentRate: string
  fixedInterestYears: string
  currentRent: string
}

function parseEuroInput(value: string): number {
  const cleaned = value.replace(/[€\s.]/g, '').replace(',', '.')
  if (!cleaned) return 0
  const euros = parseFloat(cleaned)
  return Math.round(euros * 100)
}

function formatEuroInput(cents: number): string {
  const euros = (cents / 100).toFixed(2).replace('.', ',')
  return euros.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function parseRateInput(value: string): number {
  const cleaned = value.replace(/[%\s]/g, '').replace(',', '.')
  if (!cleaned) return 0
  return parseFloat(cleaned) / 100
}

function formatRateInput(rate: number): string {
  return (rate * 100).toFixed(2).replace('.', ',')
}

const formSchema = purchaseCostsInputSchema.extend({
  purchasePrice: z.string(),
  availableEquity: z.string(),
  nominalRate: z.string(),
  initialRepaymentRate: z.string(),
  fixedInterestYears: z.string(),
  currentRent: z.string(),
})

type AcquisitionCostRateOverrides = NonNullable<PurchaseCostsInput['rateOverrides']>

export function usePurchaseCostsCalculator() {
  const form = useForm<PurchaseCostsFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purchasePrice: '',
      stateId: QUICK_DEFAULTS.stateId,
      brokerInvolved: false,
      availableEquity: '',
      nominalRate: '',
      initialRepaymentRate: '',
      fixedInterestYears: '',
      currentRent: '',
      renovationBudget: QUICK_DEFAULTS.renovationBudget,
      movingSetupCosts: QUICK_DEFAULTS.movingSetupCosts,
    },
    mode: 'onChange',
  })

  // Transform form data to domain input
  const domainInput = useMemo((): AcquisitionCostInput => {
    const values = form.getValues()
    const rateOverrides = values.rateOverrides
      ? {
          transferTaxRate: values.rateOverrides.transferTaxRate,
          notaryRate: values.rateOverrides.notaryRate,
          landRegisterRate: values.rateOverrides.landRegisterRate,
          buyerBrokerRate: values.rateOverrides.buyerBrokerRate,
          financedAcquisitionCostShare: values.rateOverrides.financedAcquisitionCostShare,
        }
      : undefined

    return {
      purchasePriceCents: parseEuroInput(values.purchasePrice),
      stateId: values.stateId,
      brokerInvolved: values.brokerInvolved,
      rateOverrides: rateOverrides,
      renovationBudget: values.renovationBudget,
      movingSetupCosts: values.movingSetupCosts,
    }
  }, [form])

  // Run calculation
  const result = useMemo((): AcquisitionCostResult => {
    return calculateAcquisitionCosts(domainInput)
  }, [domainInput])

  // Quick-mode financing preview inputs (not calculated here, just passed through)
  const financingPreview = useMemo(() => {
    const values = form.getValues()
    return {
      availableEquityCents: parseEuroInput(values.availableEquity),
      nominalAnnualRate: parseRateInput(values.nominalRate),
      initialRepaymentRate: parseRateInput(values.initialRepaymentRate),
      fixedInterestMonths: values.fixedInterestYears
        ? parseInt(values.fixedInterestYears, 10) * 12
        : 120,
      currentComparableRentCents: parseEuroInput(values.currentRent),
    }
  }, [form])

  const setBudgetConfirmed = useCallback(
    (field: 'renovationBudget' | 'movingSetupCosts', status: BudgetStatus) => {
      const current = form.getValues(field)
      if (current) {
        form.setValue(
          field,
          { ...current, budgetStatus: status, amountCents: current.amountCents ?? 0 },
          { shouldValidate: true },
        )
      }
    },
    [form],
  )

  const toggleBroker = useCallback(
    (involved: boolean) => {
      form.setValue('brokerInvolved', involved, { shouldValidate: true })
    },
    [form],
  )

  const setRateOverride = useCallback(
    (rate: keyof AcquisitionCostRateOverrides, value: string) => {
      form.setValue(`rateOverrides.${rate}`, value, { shouldValidate: true })
    },
    [form],
  )

  const isAvailable = result.status === 'available'
  const availableResult = isAvailable ? result : null

  return {
    form,
    result,
    availableResult,
    isAvailable,
    financingPreview,
    setBudgetConfirmed,
    toggleBroker,
    setRateOverride,
    parseEuroInput,
    formatEuroInput,
    parseRateInput,
    formatRateInput,
    germanStateIds,
    budgetStatuses,
  }
}
