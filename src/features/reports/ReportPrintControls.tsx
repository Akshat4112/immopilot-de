import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { reportText } from './reportCopy'
import type { ReportSnapshot, ReportValue } from './reportSnapshot'

/**
 * An explicit, snapshot-scoped print authorization. The report is portaled directly under
 * document.body only after a user confirms disclosure and activates the print action.
 * Browser afterprint means the dialog closed, not that a file or paper copy was created.
 */
export function ReportPrintControls({
  snapshot,
  report,
}: {
  snapshot: ReportValue<ReportSnapshot>
  report: ReactNode
}) {
  const t = reportText(snapshot.language)
  const [acknowledged, setAcknowledged] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [printError, setPrintError] = useState(false)
  const printButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!printing) return
    const priorTitle = document.title
    // This generic suggested name contains no property values, IDs or scenario names.
    document.title = snapshot.suggestedFilename.replace(/\.pdf$/u, '')
    const finished = () => {
      setPrinting(false)
      printButton.current?.focus()
    }
    window.addEventListener('afterprint', finished)
    try {
      if (typeof window.print !== 'function') throw new Error('print unavailable')
      window.print()
    } catch {
      setPrintError(true)
      setPrinting(false)
    }
    return () => {
      window.removeEventListener('afterprint', finished)
      document.title = priorTitle
    }
  }, [printing, snapshot.suggestedFilename])

  return (
    <>
      <div className="report-print-controls">
        <p>{t('This report contains financial information. Review it and the privacy warning before printing or sharing.')}</p>
        <p>
          {t(
            'In the browser print dialog, disable headers and footers to avoid exposing the page URL or share link.',
          )}
        </p>
        <label className="report-preview-checkbox">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => {
              setAcknowledged(event.target.checked)
              setPrintError(false)
            }}
          />
          {t('I have reviewed the contents and privacy warning.')}
        </label>
        <button
          type="button"
          ref={printButton}
          disabled={!acknowledged || printing}
          onClick={() => {
            if (!acknowledged || printing) return
            setPrintError(false)
            setPrinting(true)
          }}
        >
          {t('Print / Save as PDF')}
        </button>
        {printError ? (
          <p role="alert">
            {t('Printing is unavailable. Keep the preview open and try the browser print command.')}
          </p>
        ) : null}
      </div>
      {printing
        ? createPortal(
            <div className="report-print-root" data-report-print-root="true">
              {report}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
