import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useScenarioWorkspaceStore } from '../scenario-workspace'

type ResetScope = 'purchaseCosts' | 'financing' | 'analysis' | 'workspace' | 'allLocalData'

const scopes: readonly ResetScope[] = [
  'purchaseCosts',
  'financing',
  'analysis',
  'workspace',
  'allLocalData',
]

interface ResetControlsProps {
  onClearAllLocalData: () => boolean
}

/**
 * The workspace lives in memory. Only the last option requests removal of
 * ImmoPilot's saved-scenario library key, never unrelated browser storage.
 */
export function ResetControls({ onClearAllLocalData }: ResetControlsProps) {
  const { t } = useTranslation()
  const resetModule = useScenarioWorkspaceStore((state) => state.resetModule)
  const resetWorkspace = useScenarioWorkspaceStore((state) => state.reset)
  const [pending, setPending] = useState<ResetScope | null>(null)
  const [result, setResult] = useState<'complete' | 'failed' | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const request = (scope: ResetScope, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger
    setResult(null)
    setPending(scope)
  }

  const cancel = () => {
    setPending(null)
    setResult(null)
    triggerRef.current?.focus()
  }

  const confirm = () => {
    if (pending === null) return
    if (pending === 'allLocalData') {
      if (!onClearAllLocalData()) {
        setResult('failed')
        return
      }
      resetWorkspace()
    } else if (pending === 'workspace') {
      resetWorkspace()
    } else {
      resetModule(pending)
    }
    setPending(null)
    setResult('complete')
    triggerRef.current?.focus()
  }

  return (
    <section className="scenario-panel reset-controls" aria-labelledby="reset-controls-heading">
      <h2 id="reset-controls-heading">{t('onboarding.reset.title')}</h2>
      <p>{t('onboarding.reset.description')}</p>
      <div className="reset-controls-grid">
        {scopes.map((scope) => (
          <div className="reset-controls-option" key={scope}>
            <p>{t(`onboarding.reset.explanations.${scope}`)}</p>
            <button
              className="secondary-action"
              type="button"
              onClick={(event) => request(scope, event.currentTarget)}
            >
              {t(`onboarding.reset.actions.${scope}`)}
            </button>
          </div>
        ))}
      </div>
      {pending !== null ? (
        <div
          aria-describedby="reset-warning-description"
          aria-labelledby="reset-warning-title"
          aria-modal="false"
          className="scenario-confirmation reset-warning"
          role="alertdialog"
        >
          <h3 id="reset-warning-title">{t('onboarding.reset.confirmTitle')}</h3>
          <p id="reset-warning-description">{t(`onboarding.reset.warnings.${pending}`)}</p>
          {result === 'failed' ? <p role="alert">{t('onboarding.reset.failed')}</p> : null}
          <div className="scenario-actions">
            <button autoFocus className="primary-action" type="button" onClick={confirm}>
              {t('onboarding.reset.confirm')}
            </button>
            <button className="secondary-action" type="button" onClick={cancel}>
              {t('onboarding.reset.cancel')}
            </button>
          </div>
        </div>
      ) : null}
      {result === 'complete' ? (
        <p className="scenario-status" role="status">
          {t('onboarding.reset.complete')}
        </p>
      ) : null}
    </section>
  )
}
