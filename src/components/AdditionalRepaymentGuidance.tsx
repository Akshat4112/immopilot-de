import { useTranslation } from 'react-i18next'

const guidanceItems = ['timing', 'annual', 'overlap', 'payment', 'results', 'contract'] as const

export function AdditionalRepaymentGuidance() {
  const { t } = useTranslation()

  return (
    <details className="additional-repayment-guidance">
      <summary>{t('additionalRepaymentGuidance.title')}</summary>
      <p>{t('additionalRepaymentGuidance.intro')}</p>
      <dl>
        {guidanceItems.map((item) => (
          <div key={item}>
            <dt>{t(`additionalRepaymentGuidance.items.${item}.term`)}</dt>
            <dd>{t(`additionalRepaymentGuidance.items.${item}.description`)}</dd>
          </div>
        ))}
      </dl>
      <p className="additional-repayment-guidance__note">{t('additionalRepaymentGuidance.note')}</p>
    </details>
  )
}
