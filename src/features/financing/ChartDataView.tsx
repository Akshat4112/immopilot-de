import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { AmortizationTableFrame } from './AmortizationTableFrame'
import { formatNumber } from '../../i18n/formatters'
import type { SupportedLanguage } from '../../i18n/resources'

export interface ChartDataRow {
  key: string | number
  heading: ReactNode
  cells: readonly ReactNode[]
}

const pageSize = 24

/** A native, bounded data equivalent, formatted only while its disclosure is open. */
export function ChartDataView({
  id,
  title,
  caption,
  columns,
  rowCount,
  getRows,
  language,
}: {
  id: string
  title: string
  caption: string
  columns: readonly string[]
  rowCount: number
  getRows: (first: number, count: number) => readonly ChartDataRow[]
  language: SupportedLanguage
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [requestedPage, setPage] = useState(0)
  const pageCount = Math.ceil(rowCount / pageSize)
  const page = Math.min(requestedPage, pageCount - 1)
  const first = page * pageSize
  const tableId = `${id}-table`
  const summary = t('finance.results.breakdown.chartAccess.dataView', { title })
  return (
    <details className="chart-data-view" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary id={`${id}-summary`}>{summary}</summary>
      {open ? (
        <>
          <p className="result-detail">{t('finance.results.breakdown.chartAccess.dataHelp')}</p>
          <AmortizationTableFrame caption={caption} title={summary} tableId={tableId} chartData>
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th scope="col" key={index}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {getRows(first, pageSize).map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.heading}</th>
                  {row.cells.map((cell, index) => (
                    <td key={index}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </AmortizationTableFrame>
          <div className="amortization-pagination">
            <p role="status" aria-live="polite" aria-atomic="true">
              {t('finance.results.breakdown.chartAccess.pageRange', {
                first: formatNumber(first + 1, language),
                last: formatNumber(Math.min(first + pageSize, rowCount), language),
                total: formatNumber(rowCount, language),
                page: formatNumber(page + 1, language),
                pages: formatNumber(pageCount, language),
              })}
            </p>
            <nav aria-label={t('finance.results.breakdown.paginationLabel', { title: summary })}>
              {(
                [
                  ['firstPage', 0, page === 0],
                  ['previousPage', Math.max(0, page - 1), page === 0],
                  ['nextPage', Math.min(pageCount - 1, page + 1), page === pageCount - 1],
                  ['lastPage', pageCount - 1, page === pageCount - 1],
                ] as const
              ).map(([label, target, disabled]) => (
                <button
                  key={label}
                  type="button"
                  aria-controls={tableId}
                  aria-disabled={disabled}
                  tabIndex={disabled ? -1 : undefined}
                  onClick={() => {
                    if (!disabled) setPage(target)
                  }}
                >
                  {t(`finance.results.breakdown.${label}`)}
                </button>
              ))}
            </nav>
          </div>
        </>
      ) : null}
    </details>
  )
}
