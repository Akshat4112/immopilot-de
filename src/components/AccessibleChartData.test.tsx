import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AccessibleChartData } from './AccessibleChartData'

describe('AccessibleChartData', () => {
  const props = {
    title: 'ETF values',
    description: 'Gross market values; liquidation tax unavailable',
    headers: ['Year', 'Gross EUR', 'Liquidation EUR'],
    rows: [[2026, 1000, null]],
    filename: 'etf-values.csv',
  }

  it('provides an accessible description and keyboard-operable table toggle', () => {
    render(<AccessibleChartData {...props} />)
    const toggle = screen.getByRole('button', { name: 'Show data table' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    const controlledId = toggle.getAttribute('aria-controls')
    expect(controlledId).toBeTruthy()
    expect(document.getElementById(controlledId!)?.hidden).toBe(true)
    expect(screen.queryByRole('table')).toBeNull()
    fireEvent.click(toggle)
    const hideToggle = screen.getByRole('button', { name: 'Hide data table' })
    expect(hideToggle.getAttribute('aria-expanded')).toBe('true')
    const table = screen.getByRole('table', { name: 'ETF values' })
    expect(hideToggle.getAttribute('aria-controls')).toBe(table.parentElement?.id)
    expect(within(table).getByRole('columnheader', { name: 'Liquidation EUR' })).toBeTruthy()
    expect(within(table).getByRole('rowheader', { name: '2026' })).toBeTruthy()
    expect(within(table).getAllByRole('cell')[1]?.textContent).toBe('')
    fireEvent.click(screen.getByRole('button', { name: 'Hide data table' }))
    expect(screen.queryByRole('table')).toBeNull()
    expect(document.getElementById(controlledId!)?.hidden).toBe(true)
  })

  it('renders canonical negative and unavailable values without inventing liquidation tax', () => {
    render(
      <AccessibleChartData
        {...props}
        rows={[
          [2026, -125.5, null],
          [2027, 1500.25, undefined],
        ]}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Show data table' }))
    const table = screen.getByRole('table', { name: 'ETF values' })
    expect(within(table).getAllByRole('rowheader')).toHaveLength(2)
    expect(within(table).getByRole('cell', { name: '-125.5' })).toBeTruthy()
    expect(within(table).getByRole('cell', { name: '1500.25' })).toBeTruthy()
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(3)
    expect(within(rows[1]!).getAllByRole('cell')[1]?.textContent).toBe('')
    expect(within(rows[2]!).getAllByRole('cell')[1]?.textContent).toBe('')
  })

  it('localizes the table toggle and CSV accessible name in German', () => {
    render(<AccessibleChartData {...props} language="de" />)
    const toggle = screen.getByRole('button', { name: 'Datentabelle anzeigen' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(screen.getByRole('button', { name: 'ETF values als CSV herunterladen' })).toBeTruthy()
    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Datentabelle ausblenden' })).toBeTruthy()
    expect(screen.getByRole('table', { name: 'ETF values' })).toBeTruthy()
  })

  it('labels CSV download and describes unavailable liquidation figures', () => {
    render(<AccessibleChartData {...props} />)
    expect(screen.getByRole('button', { name: 'Download ETF values as CSV' })).toBeTruthy()
    expect(screen.getByText('Gross market values; liquidation tax unavailable')).toBeTruthy()
  })
})
