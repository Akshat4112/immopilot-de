import { useCallback, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { calculateAcquisitionCosts } from '../../domain/acquisition-costs'
import type {
  AcquisitionCostInput,
  AcquisitionCostResult,
  BudgetStatus,
} from '../../domain/acquisition-costs'
import {
  purchaseCostsInputSchema,
  QUICK_DEFAULTS,
  germanStateIds,
  budgetStatuses,
} from './schema'

const formSchema = purchaseCostsInputSchema
  .omit({ purchasePriceCents: true })
  .extend({ purchasePrice: z.string() })

export type PurchaseCostsFormData = z.infer<typeof formSchema>

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

function parseOptionalRate(value: string | undefined): number | undefined {
  return value?.trim() ? parseRateInput(value) : undefined
}

function formatRateInput(rate: number): string {
  return (rate * 100).toFixed(2).replace('.', ',')
}

export function usePurchaseCostsCalculator() {
  const form = useForm<PurchaseCostsFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purchasePrice: '',
      stateId: QUICK_DEFAULTS.stateId,
      brokerInvolved: false,
      renovationBudget: QUICK_DEFAULTS.renovationBudget,
      movingSetupCosts: QUICK_DEFAULTS.movingSetupCosts,
    },
    mode: 'onChange',
  })
  const values = useWatch({ control: form.control })

  const domainInput = useMemo((): AcquisitionCostInput => {
    const parsedRateOverrides = {
      transferTaxRate: parseOptionalRate(values.rateOverrides?.transferTaxRate),
      notaryRate: parseOptionalRate(values.rateOverrides?.notaryRate),
      landRegisterRate: parseOptionalRate(values.rateOverrides?.landRegisterRate),
      buyerBrokerRate: parseOptionalRate(values.rateOverrides?.buyerBrokerRate),
      financedAcquisitionCostShare: parseOptionalRate(
        values.rateOverrides?.financedAcquisitionCostShare,
      ),
    }
    const rateOverrides = Object.values(parsedRateOverrides).some((rate) => rate !== undefined)
      ? parsedRateOverrides
      : undefined

    return {
      purchasePriceCents: parseEuroInput(values.purchasePrice ?? ''),
      stateId: values.stateId ?? QUICK_DEFAULTS.stateId,
      brokerInvolved: values.brokerInvolved ?? false,
      rateOverrides,
      renovationBudget: values.renovationBudget,
      movingSetupCosts: values.movingSetupCosts,
    }
  }, [values])

  const result = useMemo((): AcquisitionCostResult => {
    return calculateAcquisitionCosts(domainInput)
  }, [domainInput])

  const setBudgetConfirmed = useCallback(
    (field: 'renovationBudget' | 'movingSetupCosts', status: BudgetStatus) => {
      const current = form.getValues(field)
      if (current) {
        form.setValue(
          field,
          {
            ...current,
            budgetStatus: status,
            amountCents: current.amountCents ?? 0,
          },
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

  const isAvailable = result.status === 'available'
  const availableResult = isAvailable ? result : null

  return {
    form,
    result,
    availableResult,
    isAvailable,
    setBudgetConfirmed,
    toggleBroker,
    formatEuroInput,
    formatRateInput,
    germanStateIds,
    budgetStatuses,
  }
}
