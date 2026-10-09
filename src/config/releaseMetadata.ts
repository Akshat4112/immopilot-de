import assumptionSet from '../../data/assumptions/de-2026.09.json'

export const calculationMetadata = {
  assumptionSetVersion: assumptionSet.assumptionSetVersion,
  assumptionSetVerifiedOn: assumptionSet.verifiedOn,
  calculationSpecificationVersion: assumptionSet.calculationSpecificationVersion,
} as const

export const privacyNoticeMetadata = {
  version: '1.0.0-rc.1',
  verifiedOn: '2026-09-30',
} as const
