import { type ChangeEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'

import { PageLayout } from '../../components/PageLayout'
import { useScenarioWorkspaceStore } from '../scenario-workspace'
import {
  createSavedScenario,
  createScenarioShareUrl,
  duplicateSavedScenario,
  parseScenarioJson,
  parseSharedScenario,
  readScenarioLibrary,
  renameSavedScenario,
  scenarioDownloadFilename,
  serializeScenario,
  writeScenarioLibrary,
  type SavedScenario,
  type ScenarioLibraryIssue,
} from '../../storage'

type StatusKey =
  | 'saved'
  | 'renamed'
  | 'duplicated'
  | 'deleted'
  | 'loaded'
  | 'reset'
  | 'imported'
  | 'exported'
  | 'linkReady'
  | 'nameRequired'
  | 'writeFailed'

function localeForLanguage(language: string): SavedScenario['locale'] {
  return language.startsWith('en') ? 'en-GB' : 'de-DE'
}

function downloadScenario(scenario: SavedScenario) {
  const url = URL.createObjectURL(
    new Blob([serializeScenario(scenario)], { type: 'application/json;charset=utf-8' }),
  )
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = scenarioDownloadFilename(scenario.name)
  anchor.click()
  URL.revokeObjectURL(url)
}

function readBrowserScenarioLibrary() {
  try {
    return readScenarioLibrary(window.localStorage)
  } catch {
    return { scenarios: [], issue: 'storage-unavailable' as const }
  }
}

function writeBrowserScenarioLibrary(scenarios: SavedScenario[]) {
  try {
    return writeScenarioLibrary(window.localStorage, scenarios)
  } catch {
    return false
  }
}

export function ScenariosPage() {
  const { i18n, t } = useTranslation()
  const [searchParams] = useSearchParams()
  const purchaseCosts = useScenarioWorkspaceStore((state) => state.purchaseCosts)
  const financing = useScenarioWorkspaceStore((state) => state.financing)
  const analysis = useScenarioWorkspaceStore((state) => state.analysis)
  const replaceWorkspace = useScenarioWorkspaceStore((state) => state.replaceWorkspace)
  const resetWorkspace = useScenarioWorkspaceStore((state) => state.reset)
  const initialLibrary = useMemo(() => readBrowserScenarioLibrary(), [])
  const [scenarios, setScenarios] = useState(initialLibrary.scenarios)
  const [libraryIssue, setLibraryIssue] = useState<ScenarioLibraryIssue | undefined>(
    initialLibrary.issue,
  )
  const [scenarioName, setScenarioName] = useState('')
  const [renameValues, setRenameValues] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<StatusKey>()
  const [shareUrl, setShareUrl] = useState('')
  const sharedScenario = useMemo(() => {
    const encoded = searchParams.get('scenario')
    return encoded ? parseSharedScenario(encoded) : undefined
  }, [searchParams])

  const persist = (nextScenarios: SavedScenario[], successStatus: StatusKey) => {
    if (!writeBrowserScenarioLibrary(nextScenarios)) {
      setLibraryIssue('storage-unavailable')
      setStatus('writeFailed')
      return false
    }
    setScenarios(nextScenarios)
    setLibraryIssue(undefined)
    setStatus(successStatus)
    return true
  }

  const currentInputs = () => ({ purchaseCosts, financing, analysis })

  const saveCurrent = () => {
    if (!scenarioName.trim()) {
      setStatus('nameRequired')
      return
    }
    const scenario = createSavedScenario(scenarioName.trim(), currentInputs(), {
      locale: localeForLanguage(i18n.resolvedLanguage ?? i18n.language),
    })
    if (persist([...scenarios, scenario], 'saved')) setScenarioName('')
  }

  const createCurrentShareLink = () => {
    if (!scenarioName.trim()) {
      setStatus('nameRequired')
      return
    }
    const scenario = createSavedScenario(scenarioName.trim(), currentInputs(), {
      locale: localeForLanguage(i18n.resolvedLanguage ?? i18n.language),
    })
    setShareUrl(createScenarioShareUrl(scenario, window.location.href))
    setStatus('linkReady')
  }

  const renameScenario = (scenario: SavedScenario) => {
    const name = (renameValues[scenario.id] ?? scenario.name).trim()
    if (!name) {
      setStatus('nameRequired')
      return
    }
    const next = scenarios.map((item) =>
      item.id === scenario.id ? renameSavedScenario(item, name) : item,
    )
    if (persist(next, 'renamed')) {
      setRenameValues((values) => ({ ...values, [scenario.id]: name }))
    }
  }

  const duplicateScenario = (scenario: SavedScenario) => {
    const duplicate = duplicateSavedScenario(scenario, {
      name: t('scenarios.copyName', { name: scenario.name }),
    })
    persist([...scenarios, duplicate], 'duplicated')
  }

  const removeScenario = (scenario: SavedScenario) => {
    persist(
      scenarios.filter((item) => item.id !== scenario.id),
      'deleted',
    )
  }

  const loadScenario = (scenario: SavedScenario) => {
    replaceWorkspace(scenario.inputs)
    setStatus('loaded')
  }

  const shareScenario = (scenario: SavedScenario) => {
    setShareUrl(createScenarioShareUrl(scenario, window.location.href))
    setStatus('linkReady')
  }

  const saveExternalScenario = (scenario: SavedScenario) => {
    const externalScenario = scenarios.some((item) => item.id === scenario.id)
      ? duplicateSavedScenario(scenario, { name: scenario.name })
      : scenario
    persist([...scenarios, externalScenario], 'imported')
  }

  const importScenario = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const parsed = parseScenarioJson(await file.text())
    if (parsed.status === 'invalid') {
      setLibraryIssue(parsed.issue)
      return
    }

    saveExternalScenario(parsed.scenario)
  }

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      // The visible, selected URL remains available when clipboard access is blocked.
    }
  }

  const dateLocale = localeForLanguage(i18n.resolvedLanguage ?? i18n.language)

  return (
    <PageLayout
      eyebrow={t('scenarios.page.eyebrow')}
      title={t('scenarios.page.title')}
      summary={t('scenarios.page.summary')}
    >
      <div className="scenario-workspace">
        {libraryIssue ? (
          <div className="scenario-notice scenario-notice--warning" role="alert">
            <strong>{t(`scenarios.issues.${libraryIssue}.title`)}</strong>
            <p>{t(`scenarios.issues.${libraryIssue}.message`)}</p>
          </div>
        ) : null}

        {sharedScenario ? (
          <section className="scenario-panel" aria-labelledby="shared-scenario-heading">
            <h2 id="shared-scenario-heading">{t('scenarios.shared.title')}</h2>
            {sharedScenario.status === 'valid' ? (
              <>
                <p>{t('scenarios.shared.valid', { name: sharedScenario.scenario.name })}</p>
                <div className="scenario-actions">
                  <button
                    className="primary-action"
                    type="button"
                    onClick={() => loadScenario(sharedScenario.scenario)}
                  >
                    {t('scenarios.actions.load')}
                  </button>
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={() => saveExternalScenario(sharedScenario.scenario)}
                  >
                    {t('scenarios.actions.saveShared')}
                  </button>
                </div>
              </>
            ) : (
              <p role="alert">{t(`scenarios.issues.${sharedScenario.issue}.message`)}</p>
            )}
          </section>
        ) : null}

        <section className="scenario-panel" aria-labelledby="current-scenario-heading">
          <h2 id="current-scenario-heading">{t('scenarios.current.title')}</h2>
          <p>{t('scenarios.current.description')}</p>
          <div className="scenario-create-row">
            <label className="form-field">
              <span>{t('scenarios.fields.name')}</span>
              <input
                maxLength={120}
                value={scenarioName}
                onChange={(event) => setScenarioName(event.target.value)}
              />
            </label>
            <div className="scenario-actions">
              <button className="primary-action" type="button" onClick={saveCurrent}>
                {t('scenarios.actions.save')}
              </button>
              <button className="secondary-action" type="button" onClick={createCurrentShareLink}>
                {t('scenarios.actions.shareCurrent')}
              </button>
              <button
                className="secondary-action"
                type="button"
                onClick={() => {
                  resetWorkspace()
                  setStatus('reset')
                }}
              >
                {t('scenarios.actions.reset')}
              </button>
            </div>
          </div>
        </section>

        {shareUrl ? (
          <section className="scenario-panel scenario-share" aria-labelledby="share-link-heading">
            <h2 id="share-link-heading">{t('scenarios.share.title')}</h2>
            <p>{t('scenarios.share.description')}</p>
            <div className="scenario-share-row">
              <input aria-label={t('scenarios.share.fieldLabel')} readOnly value={shareUrl} />
              <button
                className="secondary-action"
                type="button"
                onClick={() => void copyShareLink()}
              >
                {t('scenarios.actions.copyLink')}
              </button>
            </div>
          </section>
        ) : null}

        <section className="scenario-panel" aria-labelledby="saved-scenarios-heading">
          <div className="scenario-panel-heading">
            <div>
              <h2 id="saved-scenarios-heading">{t('scenarios.saved.title')}</h2>
              <p>{t('scenarios.saved.description')}</p>
            </div>
            <label className="secondary-action scenario-file-action">
              {t('scenarios.actions.import')}
              <input
                accept="application/json,.json"
                type="file"
                onChange={(event) => void importScenario(event)}
              />
            </label>
          </div>

          {scenarios.length === 0 ? (
            <p className="scenario-empty">{t('scenarios.saved.empty')}</p>
          ) : (
            <ul className="scenario-list">
              {scenarios.map((scenario) => (
                <li className="scenario-card" key={scenario.id}>
                  <div className="scenario-card-heading">
                    <label className="form-field">
                      <span>{t('scenarios.fields.name')}</span>
                      <input
                        maxLength={120}
                        value={renameValues[scenario.id] ?? scenario.name}
                        onChange={(event) =>
                          setRenameValues((values) => ({
                            ...values,
                            [scenario.id]: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <small>
                      {t('scenarios.saved.updated', {
                        date: new Intl.DateTimeFormat(dateLocale, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(scenario.updatedAt)),
                      })}
                    </small>
                  </div>
                  <div className="scenario-actions scenario-actions--compact">
                    <button
                      className="primary-action"
                      type="button"
                      onClick={() => loadScenario(scenario)}
                    >
                      {t('scenarios.actions.load')}
                    </button>
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={() => renameScenario(scenario)}
                    >
                      {t('scenarios.actions.rename')}
                    </button>
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={() => duplicateScenario(scenario)}
                    >
                      {t('scenarios.actions.duplicate')}
                    </button>
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={() => {
                        downloadScenario(scenario)
                        setStatus('exported')
                      }}
                    >
                      {t('scenarios.actions.export')}
                    </button>
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={() => shareScenario(scenario)}
                    >
                      {t('scenarios.actions.share')}
                    </button>
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={() => removeScenario(scenario)}
                    >
                      {t('scenarios.actions.delete')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="scenario-status" aria-live="polite">
          {status ? t(`scenarios.status.${status}`) : ''}
        </p>
        <Link className="inline-link" to="/results">
          {t('scenarios.actions.results')}
        </Link>
      </div>
    </PageLayout>
  )
}
