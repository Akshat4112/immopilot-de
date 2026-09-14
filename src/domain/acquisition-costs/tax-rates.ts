import {
  financialValidationErrorCodes,
  proportionRate,
  validationFailure,
  type Rate,
} from '../shared'

export const acquisitionAssumptionSetVersion = 'de-2026.09'
export const transferTaxRateSourceDate = '2026-01-28'

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

const transferTaxRateValues: Readonly<Record<GermanStateId, string>> = {
  'DE-BW': '0.05',
  'DE-BY': '0.035',
  'DE-BE': '0.06',
  'DE-BB': '0.065',
  'DE-HB': '0.055',
  'DE-HH': '0.055',
  'DE-HE': '0.06',
  'DE-MV': '0.06',
  'DE-NI': '0.05',
  'DE-NW': '0.065',
  'DE-RP': '0.05',
  'DE-SL': '0.065',
  'DE-SN': '0.055',
  'DE-ST': '0.05',
  'DE-SH': '0.065',
  'DE-TH': '0.05',
}

export function isGermanStateId(value: unknown): value is GermanStateId {
  return typeof value === 'string' && germanStateIds.some((stateId) => stateId === value)
}

export function getTransferTaxRate(stateId: unknown): Rate {
  if (typeof stateId !== 'string') {
    return validationFailure(
      financialValidationErrorCodes.invalidType,
      'stateId',
      'stateId must be a string',
      stateId,
    )
  }

  if (!isGermanStateId(stateId)) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      'stateId',
      'stateId must identify one of the 16 German Bundeslaender',
      stateId,
    )
  }

  return proportionRate(transferTaxRateValues[stateId], 'transferTaxRate')
}
