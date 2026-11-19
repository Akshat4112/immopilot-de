/** Shared, dependency-free export for accessible chart/table data. */
export type ChartCell = string | number | boolean | null | undefined

/** Escape spreadsheet formula prefixes as text to prevent CSV injection. */
export function escapeChartCell(value: ChartCell): string {
  if (value === null || value === undefined) return ''
  const raw = String(value)
  const isFormula = /^[\s\uFEFF]*[=+@-]/u.test(raw)
  const safe = isFormula && typeof value === 'string' ? "'" + raw : raw
  if (!/[",\r\n]/u.test(safe)) return safe
  return '"' + safe.replace(/"/gu, '""') + '"'
}

/** Produce a UTF-8 BOM-prefixed CSV compatible with Excel and LibreOffice. */
export function chartRowsToCsv(
  headers: readonly string[],
  rows: readonly (readonly ChartCell[])[],
): string {
  if (headers.length === 0) throw new Error('CSV requires at least one column')
  if (rows.some((row) => row.length !== headers.length)) {
    throw new Error('CSV row width mismatch')
  }
  const lines = [headers, ...rows]
  const body = lines.map((row) => row.map(escapeChartCell).join(','))
  return '\uFEFF' + body.join('\r\n') + '\r\n'
}
