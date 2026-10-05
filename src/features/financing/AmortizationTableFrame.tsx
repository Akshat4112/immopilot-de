import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/** Keep the full caption and scrolling guidance outside the wide numeric table. */
export function AmortizationTableFrame({
  caption,
  title,
  tableId,
  chartData = false,
  children,
}: {
  caption: string
  title: string
  tableId: string
  chartData?: boolean
  children: ReactNode
}) {
  const { t } = useTranslation()
  const helpId = useId()
  return (
    <div className="amortization-table-frame">
      <p className="amortization-table-caption" aria-hidden="true">
        {caption}
      </p>
      <p className="result-detail amortization-scroll-help" id={helpId}>
        {t('finance.results.breakdown.tableScrollHelp')}
      </p>
      <div
        aria-label={t('finance.results.breakdown.scrollLabel', { title })}
        aria-describedby={helpId}
        className={`amortization-table-scroll${chartData ? ' chart-data-scroll' : ''}`}
        role="region"
        tabIndex={0}
      >
        <table className="amortization-table" id={tableId}>
          <caption className="amortization-accessible-caption">{caption}</caption>
          {children}
        </table>
      </div>
    </div>
  )
}
