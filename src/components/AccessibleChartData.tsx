import { useId, useState } from 'react'
import { chartRowsToCsv, type ChartCell } from '../utils/chartData'

export interface AccessibleChartDataProps {
  title: string
  description: string
  headers: readonly string[]
  rows: readonly (readonly ChartCell[])[]
  filename: string
}

/**
 * Optional, keyboard-operable data alternative for visual financial charts.
 * Pass the exact rows used by the chart; never calculate financial values here.
 */
export function AccessibleChartData({
  title,
  description,
  headers,
  rows,
  filename,
}: AccessibleChartDataProps) {
  const [showTable, setShowTable] = useState(false)
  const tableId = useId()

  function downloadCsv() {
    const csv = chartRowsToCsv(headers, rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename.replace(/[^a-zA-Z0-9._-]/gu, '_')
    document.body.appendChild(anchor)
    try {
      anchor.click()
    } finally {
      anchor.remove()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <section aria-label={title}>
      <p>{description}</p>
      <button
        type="button"
        aria-expanded={showTable}
        aria-controls={tableId}
        onClick={() => setShowTable(!showTable)}
      >
        {showTable ? 'Hide data table' : 'Show data table'}
      </button>
      <button type="button" onClick={downloadCsv} aria-label={`Download ${title} as CSV`}>
        Download CSV
      </button>
      <div id={tableId} hidden={!showTable} style={{ overflowX: 'auto' }}>
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th scope="col" key={index}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, column) =>
                  column === 0 ? (
                    <th scope="row" key={column}>
                      {cell ?? ''}
                    </th>
                  ) : (
                    <td key={column}>{cell ?? ''}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
