import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { calculateFinancing } from '../../domain/financing'
import type { FinancingInput, FinancingResult } from '../../domain/financing'
import type { AcquisitionCostResult } from '../../domain/acquisition-costs'
import { financingFormSchema, QUICK_DEFAULTS, financingModes } from './schema'

const formSchema = financingFormSchema

export function useFinancingCalculator(acquisitionResult: AcquisitionCostResult | null) {
  const form = useForm<z.infer<typeof financingFormSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: QUICK_DEFAULTS,
    mode: 'onChange',
  })

  // Run calculation
  const result = useMemo((): FinancingResult | null => {
    const values = form.getValues()

    if (!acquisitionResult || acquisitionResult.status !== 'available') {
      return null
    }

    const domainInput: FinancingInput = {
      mode: values.mode,
      availableEquityCents: values.availableEquityCents,
      downPaymentCents: values.mode === 'selected-down-payment' ? values.downPaymentCents : 0,
      financedAcquisitionCostShare: values.financedAcquisitionCostShare
        ? values.financedAcquisitionCostShare
        : '0',
      acquisition: acquisitionResult,
    }

    return calculateFinancing(domainInput)
  }, [form, acquisitionResult])

  const isAvailable = result?.status === 'available'

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

  return {
    form,
    result,
    isAvailable,
    financingModes,
    parseEuroInput,
    formatEuroInput,
    parseRateInput,
    formatRateInput,
  }
}
