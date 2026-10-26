import { useEffect, useRef, useState } from 'react'

import type { SupportedLanguage } from '../../i18n/resources'
import {
  readScenarioLibrary,
  SCENARIO_LIBRARY_STORAGE_KEY,
  type SavedScenario,
  type ScenarioLibraryIssue,
} from '../../storage'
import { ComparisonReport } from './ComparisonReport'
import { reportText } from './reportCopy'
import { captureComparisonReport, type ReportCaptureResult } from './reportSnapshot'

/** The comparison-owned key invalidates captures on selection, source or UI language changes. */
export function ComparisonReportPreview({
  selectedIds,
  scenarios,
  libraryIssue,
  language,
}: {
  selectedIds: readonly string[]
  scenarios: readonly SavedScenario[]
  libraryIssue?: ScenarioLibraryIssue
  language: SupportedLanguage
}) {
  const t = reportText(language)
  const [outputLanguage, setOutputLanguage] = useState(language)
  const [monthly, setMonthly] = useState(false)
  const [capture, setCapture] = useState<ReportCaptureResult | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (capture?.status === 'captured') heading.current?.focus()
  }, [capture])
  useEffect(() => {
    const invalidate = () => setCapture(null)
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === SCENARIO_LIBRARY_STORAGE_KEY) invalidate()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', invalidate)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', invalidate)
    }
  }, [])
  const generate = () => {
    try {
      // Re-read at the deliberate capture boundary, without saving or migrating storage.
      const raw = window.localStorage.getItem(SCENARIO_LIBRARY_STORAGE_KEY)
      const current = readScenarioLibrary({ getItem: () => raw })
      if (
        libraryIssue ||
        current.issue ||
        selectedIds.some((id) => {
          const visible = scenarios.find((scenario) => scenario.id === id)
          const fresh = current.scenarios.find((scenario) => scenario.id === id)
          return !visible || !fresh || JSON.stringify(visible) !== JSON.stringify(fresh)
        })
      ) {
        setCapture({ status: 'blocked', issue: 'library-unavailable' })
        return
      }
      const documents = raw === null ? [] : (JSON.parse(raw) as { scenarios: unknown[] }).scenarios
      setCapture(
        captureComparisonReport(
          { documents, selectedIds },
          {
            language: outputLanguage,
            includeMonthlyAppendix: monthly,
          },
        ),
      )
    } catch {
      setCapture({ status: 'blocked', issue: 'library-unavailable' })
    }
  }
  return (
    <section
      className="property-report-preview comparison-report-preview"
      aria-label={t('Report preview')}
    >
      <p>{t('Saved properties are captured in the visible order. Names are omitted.')}</p>
      <div className="report-preview-controls">
        <label>
          {t('Report language')}
          <select
            value={outputLanguage}
            onChange={(event) => {
              setOutputLanguage(event.target.value === 'de' ? 'de' : 'en')
              setCapture(null)
            }}
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className="report-preview-checkbox">
          <input
            type="checkbox"
            checked={monthly}
            onChange={(event) => {
              setMonthly(event.target.checked)
              setCapture(null)
            }}
          />
          {t('Include complete monthly appendix')}
        </label>
        <button type="button" ref={trigger} onClick={generate}>
          {t('View comparison report')}
        </button>
      </div>
      {capture?.status === 'blocked' ? (
        <p role="alert">
          {t(
            capture.issue === 'invalid-selection' ||
              capture.issue === 'library-unavailable' ||
              capture.issue === 'invalid-schema' ||
              capture.issue === 'unsupported-version'
              ? 'The saved selection is missing, changed or unreadable. Reload the comparison and correct the selection before capturing again.'
              : 'Correct the required inputs before creating a report.',
          )}
        </p>
      ) : null}
      {capture?.status === 'captured' ? (
        <>
          <div className="report-preview-heading">
            <h2 tabIndex={-1} ref={heading}>
              {t('Report preview')}
            </h2>
            <button
              type="button"
              onClick={() => {
                setCapture(null)
                trigger.current?.focus()
              }}
            >
              {t('Close report')}
            </button>
          </div>
          <ComparisonReport snapshot={capture.snapshot} />
        </>
      ) : null}
    </section>
  )
}
