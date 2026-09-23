import { useCallback, useEffect, useMemo } from 'react'
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
  acquisitionCostInputFromDraft,
  initialPurchaseCostsDraft,
  useScenarioWorkspaceStore,
  type PurchaseCostsDraft,
} from '../scenario-workspace'
import { purchaseCostsInputSchema, QUICK_DEFAULTS, germanStateIds, budgetStatuses } from './schema'

const formSchema = purchaseCostsInputSchema
  .omit({ purchasePriceCents: true })
  .extend({ purchasePrice: z.string() })

export type PurchaseCostsFormData = z.infer<typeof formSchema>

type WatchedBudget = Partial<NonNullable<PurchaseCostsFormData['renovationBudget']>>
type WatchedPurchaseCostsFormData = Omit<
  Partial<PurchaseCostsFormData>,
  'movingSetupCosts' | 'renovationBudget'
> & {
  renovationBudget?: WatchedBudget
  movingSetupCosts?: WatchedBudget
}

function normalizeBudget(value: WatchedBudget | undefined): PurchaseCostsDraft['renovationBudget'] {
  if (value?.amountCents === undefined || value.budgetStatus === undefined) {
    return undefined
  }

  return {
    amountCents: value.amountCents,
    budgetStatus: value.budgetStatus,
  }
}

function purchaseCostsDraftFromForm(values: WatchedPurchaseCostsFormData): PurchaseCostsDraft {
  return {
    purchasePrice: values.purchasePrice ?? '',
    stateId: values.stateId ?? QUICK_DEFAULTS.stateId,
    brokerInvolved: values.brokerInvolved ?? false,
    rateOverrides: values.rateOverrides,
    renovationBudget: normalizeBudget(values.renovationBudget),
    movingSetupCosts: normalizeBudget(values.movingSetupCosts),
  }
}

export function usePurchaseCostsCalculator() {
  const initialDraft = useScenarioWorkspaceStore.getState().purchaseCosts
  const setPurchaseCosts = useScenarioWorkspaceStore((state) => state.setPurchaseCosts)
  const form = useForm<PurchaseCostsFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialDraft ?? initialPurchaseCostsDraft,
    mode: 'onChange',
  })
  const values = useWatch({ control: form.control })
  const purchaseCostsDraft = useMemo(() => purchaseCostsDraftFromForm(values), [values])

  useEffect(() => {
    setPurchaseCosts(purchaseCostsDraft)
  }, [purchaseCostsDraft, setPurchaseCosts])

  const domainInput = useMemo(
    (): AcquisitionCostInput => acquisitionCostInputFromDraft(purchaseCostsDraft),
    [purchaseCostsDraft],
  )

  const result = useMemo(
    (): AcquisitionCostResult => calculateAcquisitionCosts(domainInput),
    [domainInput],
  )

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

  const setBudgetAmount = useCallback(
    (field: 'renovationBudget' | 'movingSetupCosts', amountCents: number) => {
      const current = form.getValues(field)
      form.setValue(
        field,
        {
          amountCents,
          budgetStatus: amountCents > 0 ? 'budgeted' : (current?.budgetStatus ?? 'not-budgeted'),
        },
        { shouldValidate: true },
      )
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
    setBudgetAmount,
    toggleBroker,
    germanStateIds,
    budgetStatuses,
  }
}
