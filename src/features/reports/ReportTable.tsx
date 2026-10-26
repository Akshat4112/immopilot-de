import { useContext, type ReactNode } from 'react'

import { ReportPropertyLabel } from './reportPropertyLabel'

export function ReportTable({
  caption,
  headers,
  rows,
}: {
  caption: string
  headers: readonly string[]
  rows: readonly (readonly ReactNode[])[]
}) {
  const propertyLabel = useContext(ReportPropertyLabel)
  return (
    <div
      className="report-table-scroll"
      role="region"
      aria-label={propertyLabel ? `${propertyLabel} · ${caption}` : caption}
      tabIndex={0}
    >
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} scope="col">
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
                  <th key={column} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={column}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
