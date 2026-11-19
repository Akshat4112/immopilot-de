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
  })

  it('labels CSV download and describes unavailable liquidation figures', () => {
    render(<AccessibleChartData {...props} />)
    expect(screen.getByRole('button', { name: 'Download ETF values as CSV' })).toBeTruthy()
    expect(screen.getByText('Gross market values; liquidation tax unavailable')).toBeTruthy()
  })
})
