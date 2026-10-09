import { z } from 'zod'

export const financingModes = ['selected-down-payment', 'available-equity'] as const
export type FinancingMode = (typeof financingModes)[number]

export const oneTimeAdditionalRepaymentSchema = z.object({
  paymentMonth: z.number().int().min(1).max(1200),
  amountCents: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
})

export const refinancingScenarioSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9][a-z0-9-]*$/),
  nominalAnnualRate: z.string().regex(/^\d+(\.\d+)?$/),
  initialRepaymentRate: z.string().regex(/^\d+(\.\d+)?$/),
  fullRepaymentTermMonths: z.number().int().min(1).max(1200).optional(),
})

// Domain input schema (what calculateFinancing expects)
export const financingInputSchema = z.object({
  mode: z.enum(financingModes),
  availableEquityCents: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  downPaymentCents: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  financedAcquisitionCostShare: z.string().regex(/^\d+(\.\d+)?$/),
})

export type FinancingInput = z.infer<typeof financingInputSchema>

// Form schema (includes additional UI fields for amortization/refinancing)
export const financingFormSchema = z.object({
  mode: z.enum(financingModes),
  availableEquityCents: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  downPaymentCents: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  financedAcquisitionCostShare: z.string().regex(/^\d+(\.\d+)?$/),
  nominalAnnualRate: z.string().regex(/^\d+(\.\d+)?$/),
  initialRepaymentRate: z.string().regex(/^\d+(\.\d+)?$/),
  fixedInterestMonths: z.number().int().min(1).max(1200),
  annualAdditionalRepaymentCents: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  annualAdditionalRepaymentMonth: z.number().int().min(1).max(12),
  oneTimeAdditionalRepayments: z.array(oneTimeAdditionalRepaymentSchema),
  refinancingScenarios: z.array(refinancingScenarioSchema).max(12),
})

export type FinancingFormData = z.infer<typeof financingFormSchema>

export const QUICK_DEFAULTS = {
  mode: 'available-equity' as FinancingMode,
  availableEquityCents: 0,
  downPaymentCents: 0,
  financedAcquisitionCostShare: '0',
  nominalAnnualRate: '0.035',
  initialRepaymentRate: '0.02',
  fixedInterestMonths: 120,
  annualAdditionalRepaymentCents: 0,
  annualAdditionalRepaymentMonth: 12,
  oneTimeAdditionalRepayments: [],
  refinancingScenarios: [
    { id: 'low', nominalAnnualRate: '0.02', initialRepaymentRate: '0.02' },
    { id: 'base', nominalAnnualRate: '0.04', initialRepaymentRate: '0.02' },
    { id: 'high', nominalAnnualRate: '0.06', initialRepaymentRate: '0.02' },
  ],
} satisfies FinancingFormData
