import { useEffect, useRef, useState } from 'react'

import type { ScenarioWorkspaceSnapshot } from '../../config/scenarioDrafts'
import type { SupportedLanguage } from '../../i18n/resources'
import { PropertyReport } from './PropertyReport'
import { reportText } from './reportCopy'
import {
  capturePropertyReport,
  type ReportCaptureResult,
  type ReportInputLocale,
} from './reportSnapshot'

/** Its workspace-owned key discards captured data when source inputs or interface locale change. */
export function PropertyReportPreview({
  inputs,
  inputLocale,
  language,
}: {
  inputs: ScenarioWorkspaceSnapshot
  inputLocale: ReportInputLocale
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
  return (
    <section className="property-report-preview" aria-label={t('Report preview')}>
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
        <button
          type="button"
          ref={trigger}
          onClick={() =>
            setCapture(
              capturePropertyReport(
                { inputs, inputLocale },
                { language: outputLanguage, includeMonthlyAppendix: monthly },
              ),
            )
          }
        >
          {t('View property report')}
        </button>
      </div>
      {capture?.status === 'blocked' ? (
        <p role="alert">{t('Correct the required inputs before creating a report.')}</p>
      ) : null}
      {capture?.status === 'captured' ? (
        <>
          <div className="report-preview-heading">
            <h2 ref={heading} tabIndex={-1}>
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
          <PropertyReport snapshot={capture.snapshot} />
        </>
      ) : null}
    </section>
  )
}
