import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createSavedScenario, writeScenarioLibrary } from '../../storage'
import { capturedReport, reportInputs } from '../../test/reportFixtures'
import { ComparisonReportPreview } from './ComparisonReportPreview'
import { PropertyReport } from './PropertyReport'
import { PropertyReportPreview } from './PropertyReportPreview'
import { ReportPrintControls } from './ReportPrintControls'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('PF-006.6 acknowledged local printing', () => {
  it.each(['de', 'en'] as const)(
    'requires explicit %s acknowledgement, keeps names out of the title and allows safe retry',
    async (language) => {
      const snapshot = capturedReport(reportInputs(), { language })
      const before = document.title
      const print = vi.spyOn(window, 'print').mockImplementation(() => {})
      const user = userEvent.setup()
      render(
        <ReportPrintControls snapshot={snapshot} report={<PropertyReport snapshot={snapshot} />} />,
      )
      const action = screen.getByRole('button', {
        name: language === 'de' ? 'Drucken / Als PDF speichern' : 'Print / Save as PDF',
      })
      expect(action).toBeDisabled()
      expect(document.querySelector('[data-report-print-root]')).toBeNull()
      expect(print).not.toHaveBeenCalled()
      await user.click(
        screen.getByRole('checkbox', {
          name:
            language === 'de'
              ? 'Ich habe den Inhalt und den Datenschutzhinweis geprüft.'
              : 'I have reviewed the contents and privacy warning.',
        }),
      )
      await user.click(action)
      expect(print).toHaveBeenCalledTimes(1)
      expect(document.querySelector('[data-report-print-root]')).not.toBeNull()
      expect(document.title).toBe(snapshot.suggestedFilename.replace(/\.pdf$/u, ''))
      expect(document.title).not.toContain('€')
      fireEvent(window, new Event('afterprint'))
      expect(document.title).toBe(before)
      expect(document.querySelector('[data-report-print-root]')).toBeNull()
      expect(action).toBeEnabled()
      await user.click(action)
      expect(print).toHaveBeenCalledTimes(2)
      fireEvent(window, new Event('afterprint'))
      expect(document.title).toBe(before)
    },
  )

  it('retains the preview when printing is unavailable and never claims an export succeeded', async () => {
    vi.spyOn(window, 'print').mockImplementation(() => {
      throw new Error('print unavailable')
    })
    const snapshot = capturedReport()
    const user = userEvent.setup()
    render(
      <ReportPrintControls snapshot={snapshot} report={<PropertyReport snapshot={snapshot} />} />,
    )
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Print / Save as PDF' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Printing is unavailable.')
    expect(document.querySelector('[data-report-print-root]')).toBeNull()
    expect(screen.queryByText('Saved successfully')).toBeNull()
  })

  it('keeps the frozen property preview after afterprint and clears the acknowledgement with a new preview', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<PropertyReportPreview inputs={reportInputs()} inputLocale="de-DE" language="en" />)
    await user.click(screen.getByRole('button', { name: 'View property report' }))
    await user.click(
      screen.getByRole('checkbox', {
        name: 'I have reviewed the contents and privacy warning.',
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Print / Save as PDF' }))
    expect(print).toHaveBeenCalledOnce()
    fireEvent(window, new Event('afterprint'))
    expect(screen.getByRole('article')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Include complete monthly appendix' }))
    expect(screen.queryByRole('article')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'View property report' }))
    expect(screen.getByRole('button', { name: 'Print / Save as PDF' })).toBeDisabled()
  })

  it('includes saved scenario names only after a deliberate opt-in, never in print filenames', async () => {
    const scenario = createSavedScenario('PRIVATE ADDRESS <b>literal</b>', reportInputs(), {
      id: 'private-scenario-id',
    })
    writeScenarioLibrary(localStorage, [scenario])
    const user = userEvent.setup()
    render(
      <ComparisonReportPreview selectedIds={[scenario.id]} scenarios={[scenario]} language="en" />,
    )
    await user.click(screen.getByRole('button', { name: 'View comparison report' }))
    expect(screen.getByRole('article', { name: 'Property comparison' })).not.toHaveTextContent(
      'PRIVATE ADDRESS',
    )
    await user.click(screen.getByRole('checkbox', { name: 'Include scenario names' }))
    expect(screen.queryByRole('article')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'View comparison report' }))
    expect(screen.getByRole('article', { name: 'Property comparison' })).toHaveTextContent(
      'PRIVATE ADDRESS',
    )
    expect(screen.getByRole('button', { name: 'Print / Save as PDF' })).toBeDisabled()
    expect(document.querySelector('[data-report-print-root]')).toBeNull()
  })
})
