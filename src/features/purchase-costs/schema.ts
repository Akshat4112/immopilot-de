import { z } from 'zod'

export const germanStateIds = [
  'DE-BW',
  'DE-BY',
  'DE-BE',
  'DE-BB',
  'DE-HB',
  'DE-HH',
  'DE-HE',
  'DE-MV',
  'DE-NI',
  'DE-NW',
  'DE-RP',
  'DE-SL',
  'DE-SN',
  'DE-ST',
  'DE-SH',
  'DE-TH',
] as const

export type GermanStateId = (typeof germanStateIds)[number]

export const budgetStatuses = ['not-budgeted', 'confirmed-zero', 'budgeted'] as const
export type BudgetStatus = (typeof budgetStatuses)[number]

export const postPurchaseBudgetSchema = z
  .object({
    amountCents: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    budgetStatus: z.enum(budgetStatuses),
  })
  .refine(
    (data) => {
      if (data.budgetStatus === 'not-budgeted' && data.amountCents !== 0) return false
      if (data.budgetStatus === 'confirmed-zero' && data.amountCents !== 0) return false
      if (data.budgetStatus === 'budgeted' && data.amountCents === 0) return false
      return true
    },
    {
      message: 'Budget status and amount are inconsistent',
      path: ['amountCents'],
    },
  )

export const rateOverridesSchema = z
  .object({
    transferTaxRate: z
      .string()
      .regex(/^\d+(?:[.,]\d+)?$/)
      .optional(),
    notaryRate: z
      .string()
      .regex(/^\d+(?:[.,]\d+)?$/)
      .optional(),
    landRegisterRate: z
      .string()
      .regex(/^\d+(?:[.,]\d+)?$/)
      .optional(),
    buyerBrokerRate: z
      .string()
      .regex(/^\d+(?:[.,]\d+)?$/)
      .optional(),
    financedAcquisitionCostShare: z
      .string()
      .regex(/^\d+(?:[.,]\d+)?$/)
      .optional(),
  })
  .optional()

export const purchaseCostsInputSchema = z.object({
  purchasePriceCents: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  stateId: z.enum(germanStateIds),
  brokerInvolved: z.boolean(),
  rateOverrides: rateOverridesSchema,
  renovationBudget: postPurchaseBudgetSchema.optional(),
  movingSetupCosts: postPurchaseBudgetSchema.optional(),
})

export type PurchaseCostsInput = z.infer<typeof purchaseCostsInputSchema>

export const QUICK_DEFAULTS = {
  purchasePriceCents: 0,
  stateId: 'DE-BW' as GermanStateId,
  brokerInvolved: false,
  rateOverrides: {
    notaryRate: '0.01',
    landRegisterRate: '0.005',
    buyerBrokerRate: '0.0357',
  },
  renovationBudget: {
    amountCents: 0,
    budgetStatus: 'not-budgeted',
  },
  movingSetupCosts: {
    amountCents: 0,
    budgetStatus: 'not-budgeted',
  },
} satisfies PurchaseCostsInput
