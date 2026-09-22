import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { formatEuroFromCents, formatNumber, formatPercentage } from '../../i18n/formatters'
import type { SupportedLanguage } from '../../i18n/resources'
import { PageLayout } from '../../components/PageLayout'
import { useFinancingCalculator } from './useFinancing'

const fixedInterestPeriods = [5, 10, 15, 20, 30] as const

function inputValue(value: string) {
  return value.replace(/[^\\d,.]/g, '')
}

function languageForFormatting(language: string): SupportedLanguage {
  return language === 'en' ? 'en' : 'de'
}

export function FinancingPage() {
  const { t, i18n } = useTranslation()
  const language = languageForFormatting(i18n.resolvedLanguage ?? i18n.language)
  const { acquisition, financing, payment, amortization, financingDraft, updateFinancing } =
    useFinancingCalculator()

  const formatEuro = (cents: number) => formatEuroFromCents(cents, language)
  const formatRate = (value: { toNumber: () => number }) =>
    formatPercentage(value.toNumber(), language)

  const purchaseCostsReady = acquisition.status === 'available'
  const financingReady = financing.status === 'available'
  const paymentReady = payment.status === 'available'
  const scheduleReady = amortization.status === 'available'

  return (
    <PageLayout
      eyebrow={t('finance.page.eyebrow')}
      title={t('shell.pages.financing.title')}
      summary={t('finance.page.summary')}
    >
      <div className="financing-page">
        <section className="form-section">
          <h2>{t('finance.section.inputs')}</h2>
          <p className="form-section__intro">{t('finance.inputIntro')}</p>

          <fieldset className="form-fieldset">
            <legend>{t('finance.allocationLegend')}</legend>
            <label className="choice-card">
              <input
                checked={financingDraft.mode === 'selected-down-payment'}
                name="financing-mode"
                onChange={() => updateFinancing({ mode: 'selected-down-payment' })}
                type="radio"
                value="selected-down-payment"
              />
              <span>
                <strong>{t('finance.mode.downPayment')}</strong>
                <small>{t('finance.mode.downPaymentDescription')}</small>
              </span>
            </label>
            <label className="choice-card">
              <input
                checked={financingDraft.mode === 'available-equity'}
                name="financing-mode"
                onChange={() => updateFinancing({ mode: 'available-equity' })}
                type="radio"
                value="available-equity"
              />
              <span>
                <strong>{t('finance.mode.availableEquity')}</strong>
                <small>{t('finance.mode.availableEquityDescription')}</small>
              </span>
            </label>
          </fieldset>

          <div className="financing-input-grid">
            <label className="form-field" htmlFor="availableEquity">
              <span className="form-field__label">{t('finance.availableEquity')}</span>
              <div className="form-field__input-group">
                <input
                  id="availableEquity"
                  inputMode="decimal"
                  onChange={(event) => updateFinancing({ availableEquity: inputValue(event.target.value) })}
                  placeholder="50.000"
                  type="text"
                  value={financingDraft.availableEquity}
                />
                <span className="form-field__currency" aria-hidden="true">
                  €
                </span>
              </div>
            </label>

            {financingDraft.mode === 'selected-down-payment' ? (
              <label className="form-field" htmlFor="downPayment">
                <span className="form-field__label">{t('finance.downPayment')}</span>
                <div className="form-field__input-group">
                  <input
                    id="downPayment"
                    inputMode="decimal"
                    onChange={(event) => updateFinancing({ downPayment: inputValue(event.target.value) })}
                    placeholder="50.000"
                    type="text"
                    value={financingDraft.downPayment}
                  />
                  <span className="form-field__currency" aria-hidden="true">
                    €
                  </span>
                </div>
              </label>
            ) : (
              <p className="form-field form-field__hint">{t('finance.availableEquityHint')}</p>
            )}

            <label className="form-field" htmlFor="financedAcquisitionCostShare">
              <span className="form-field__label">{t('finance.financedAcquisitionCostShare')}</span>
              <div className="form-field__input-group">
                <input
                  id="financedAcquisitionCostShare"
                  inputMode="decimal"
                  onChange={(event) =>
                    updateFinancing({ financedAcquisitionCostShare: inputValue(event.target.value) })
                  }
                  placeholder="0,00"
                  type="text"
                  value={financingDraft.financedAcquisitionCostShare}
                />
                <span className="form-field__currency" aria-hidden="true">
                  %
                </span>
              </div>
            </label>

            <label className="form-field" htmlFor="nominalAnnualRate">
              <span className="form-field__label">{t('finance.nominalAnnualRate')}</span>
              <div className="form-field__input-group">
                <input
                  id="nominalAnnualRate"
                  inputMode="decimal"
                  onChange={(event) => updateFinancing({ nominalAnnualRate: inputValue(event.target.value) })}
                  placeholder="3,50"
                  type="text"
                  value={financingDraft.nominalAnnualRate}
                />
                <span className="form-field__currency" aria-hidden="true">
                  %
                </span>
              </div>
            </label>

            <label className="form-field" htmlFor="initialRepaymentRate">
              <span className="form-field__label">{t('finance.initialRepaymentRate')}</span>
              <div className="form-field__input-group">
                <input
                  id="initialRepaymentRate"
                  inputMode="decimal"
                  onChange={(event) =>
                    updateFinancing({ initialRepaymentRate: inputValue(event.target.value) })
                  }
                  placeholder="2,00"
                  type="text"
                  value={financingDraft.initialRepaymentRate}
                />
                <span className="form-field__currency" aria-hidden="true">
                  %
                </span>
              </div>
            </label>

            <label className="form-field" htmlFor="fixedInterestYears">
              <span className="form-field__label">{t('finance.fixedInterestPeriod')}</span>
              <select
                id="fixedInterestYears"
                onChange={(event) => updateFinancing({ fixedInterestYears: event.target.value })}
                value={financingDraft.fixedInterestYears}
              >
                {fixedInterestPeriods.map((years) => (
                  <option key={years} value={years}>
                    {t(`finance.fixedPeriod.${years}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="results-section" aria-live="polite">
          <h2>{t('finance.section.results')}</h2>

          {!purchaseCostsReady && (
            <div className="result-card warning" role="status">
              <h3>{t('finance.unavailable.purchaseCostsTitle')}</h3>
              <p>{t('finance.unavailable.purchaseCostsMessage')}</p>
              <Link className="inline-link" to="/purchase-costs">
                {t('finance.backToPurchaseCosts')}
              </Link>
            </div>
          )}

          {financingReady && (
            <>
              <div className="result-grid">
                <article className="result-card">
                  <h3>{t('finance.results.requiredEquity')}</h3>
                  <p className="result-value">{formatEuro(financing.requiredEquityCents)}</p>
                  <p className="result-detail">{t('finance.results.cashForCostsAndDownPayment')}</p>
                </article>
                <article className="result-card">
                  <h3>{t('finance.results.loanAmount')}</h3>
                  <p className="result-value">{formatEuro(financing.loanAmountCents)}</p>
                  <p className="result-detail">
                    {t('finance.results.financingRatio', {
                      value: formatRate(financing.purchasePriceFinancingRatio),
                    })}
                  </p>
                </article>
                <article className="result-card">
                  <h3>{t('finance.results.totalProjectCost')}</h3>
                  <p className="result-value">{formatEuro(financing.totalProjectCostCents)}</p>
                  <p className="result-detail">{t('finance.results.includesAllCosts')}</p>
                </article>
              </div>

              <article
                className={`result-card funding-status ${financing.fundingStatus === 'underfunded' ? 'warning' : 'summary'}`}
              >
                <h3>
                  {financing.fundingStatus === 'underfunded'
                    ? t('finance.funding.underfundedTitle')
                    : t('finance.funding.fundedTitle')}
                </h3>
                <p className="result-detail">
                  {financing.fundingStatus === 'underfunded'
                    ? t('finance.funding.underfundedMessage', {
                        value: formatEuro(financing.cashGapCents),
                      })
                    : t('finance.funding.fundedMessage', {
                        value: formatEuro(financing.cashRemainingCents),
                      })}
                </p>
              </article>
            </>
          )}

          {financingReady && paymentReady && (
            <>
              {payment.cashPurchase ? (
                <article className="result-card summary">
                  <h3>{t('finance.cashPurchase.title')}</h3>
                  <p className="result-value">{formatEuro(0)}</p>
                  <p className="result-detail">{t('finance.cashPurchase.message')}</p>
                </article>
              ) : (
                <div className="result-grid financing-results-grid">
                  <article className="result-card total">
                    <h3>{t('finance.results.monthlyPayment')}</h3>
                    <p className="result-value large">{formatEuro(payment.monthlyPaymentCents)}</p>
                    <p className="result-detail">{t('finance.results.initialRepaymentPayment')}</p>
                  </article>
                  <article className="result-card">
                    <h3>{t('finance.results.firstMonthInterest')}</h3>
                    <p className="result-value">{formatEuro(payment.firstMonthInterestCents)}</p>
                  </article>
                  <article className="result-card">
                    <h3>{t('finance.results.firstMonthPrincipal')}</h3>
                    <p className="result-value">
                      {formatEuro(payment.firstMonthScheduledPrincipalCents)}
                    </p>
                  </article>
                </div>
              )}
            </>
          )}

          {financingReady && !paymentReady && (
            <div className="result-card warning" role="status">
              <h3>{t('finance.unavailable.paymentTitle')}</h3>
              <p>{t('finance.unavailable.paymentMessage')}</p>
            </div>
          )}

          {paymentReady && scheduleReady && !amortization.cashPurchase && (
            <div className="result-grid financing-results-grid">
              <article className="result-card">
                <h3>{t('finance.results.remainingDebt')}</h3>
                <p className="result-value">
                  {formatEuro(amortization.remainingDebtAtFixedPeriodCents)}
                </p>
                <p className="result-detail">
                  {t('finance.results.afterFixedPeriod', {
                    years: financingDraft.fixedInterestYears,
                  })}
                </p>
              </article>
              <article className="result-card">
                <h3>{t('finance.results.payoffProjection')}</h3>
                <p className="result-value">{formatNumber(amortization.payoffMonth, language)}</p>
                <p className="result-detail">{t('finance.results.months')}</p>
              </article>
              <article className="result-card">
                <h3>{t('finance.results.firstYearInterest')}</h3>
                <p className="result-value">{formatEuro(amortization.firstYearInterestCents)}</p>
              </article>
            </div>
          )}

          {paymentReady && !scheduleReady && (
            <div className="result-card warning" role="status">
              <h3>{t('finance.unavailable.scheduleTitle')}</h3>
              <p>{t('finance.unavailable.scheduleMessage')}</p>
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  )
}
