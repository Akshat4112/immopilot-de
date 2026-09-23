import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { PageLayout } from '../../components/PageLayout'
import { formatEuroFromCents, formatPercentage } from '../../i18n/formatters'
import type { SupportedLanguage } from '../../i18n/resources'
import {
  calculateScenarioDashboard,
  useScenarioWorkspaceStore,
  type ConfigurableDashboardResult,
  type ScenarioAnalysisDraft,
} from '../scenario-workspace'

function languageForFormatting(language: string): SupportedLanguage {
  return language === 'en' ? 'en' : 'de'
}

function inputValue(value: string) {
  return value.replace(/[^\d,.]/g, '')
}

interface DashboardInputProps {
  id: keyof ScenarioAnalysisDraft
  label: string
  value: string
  suffix?: string
  placeholder?: string
  onChange: (value: string) => void
}

function DashboardInput({ id, label, value, suffix, placeholder, onChange }: DashboardInputProps) {
  return (
    <label className="form-field" htmlFor={id}>
      <span className="form-field__label">{label}</span>
      <div className="form-field__input-group">
        <input
          id={id}
          inputMode="decimal"
          onChange={(event) => onChange(inputValue(event.target.value))}
          placeholder={placeholder}
          type="text"
          value={value}
        />
        {suffix ? (
          <span className="form-field__currency" aria-hidden="true">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  )
}

interface ResultCardProps {
  title: string
  value: string
  detail?: string
  emphasis?: 'default' | 'summary'
}

function ResultCard({ title, value, detail, emphasis = 'default' }: ResultCardProps) {
  return (
    <article className={emphasis === 'summary' ? 'result-card summary' : 'result-card'}>
      <h3>{title}</h3>
      <p className="result-value">{value}</p>
      {detail ? <p className="result-detail">{detail}</p> : null}
    </article>
  )
}

function SetupRequired({ count }: { count: number }) {
  const { t } = useTranslation()
  return (
    <article className="result-card warning" role="status">
      <h3>{t('results.setupRequired.title')}</h3>
      <p>{t('results.setupRequired.message', { count })}</p>
    </article>
  )
}

function UnavailableResult({ reason }: { reason: string }) {
  const { t } = useTranslation()
  return (
    <article className="result-card warning" role="status">
      <h3>{t('results.unavailable.title')}</h3>
      <p>{t('results.unavailable.message', { reason })}</p>
    </article>
  )
}

function isNotConfigured<Result extends { status: string }>(
  result: ConfigurableDashboardResult<Result>,
): result is Extract<ConfigurableDashboardResult<Result>, { status: 'not-configured' }> {
  return result.status === 'not-configured'
}

function formatSignedEuro(cents: number, language: SupportedLanguage) {
  const prefix = cents > 0 ? '+' : ''
  return `${prefix}${formatEuroFromCents(cents, language)}`
}

export function ResultsPage() {
  const { t, i18n } = useTranslation()
  const language = languageForFormatting(i18n.resolvedLanguage ?? i18n.language)
  const purchaseCosts = useScenarioWorkspaceStore((state) => state.purchaseCosts)
  const financingDraft = useScenarioWorkspaceStore((state) => state.financing)
  const analysis = useScenarioWorkspaceStore((state) => state.analysis)
  const updateAnalysis = useScenarioWorkspaceStore((state) => state.updateAnalysis)
  const dashboard = useMemo(
    () => calculateScenarioDashboard(purchaseCosts, financingDraft, analysis),
    [analysis, financingDraft, purchaseCosts],
  )
  const formatEuro = (cents: number) => formatEuroFromCents(cents, language)
  const formatRate = (value: { toNumber: () => number }) =>
    formatPercentage(value.toNumber(), language)
  const update = (field: keyof ScenarioAnalysisDraft) => (value: string) =>
    updateAnalysis({ [field]: value })

  const purchaseCostsReady = dashboard.acquisition.status === 'available'

  return (
    <PageLayout
      eyebrow={t('results.page.eyebrow')}
      title={t('results.page.title')}
      summary={t('results.page.summary')}
    >
      <div className="results-workspace">
        {!purchaseCostsReady ? (
          <section className="results-section">
            <UnavailableResult reason={t('results.reasons.purchaseCosts')} />
            <Link className="inline-link" to="/purchase-costs">
              {t('results.backToPurchaseCosts')}
            </Link>
          </section>
        ) : (
          <>
            <section className="results-section results-section--key-decisions" aria-live="polite">
              <div className="results-section__header">
                <div>
                  <p className="eyebrow">{t('results.keyDecisions.eyebrow')}</p>
                  <h2>{t('results.keyDecisions.title')}</h2>
                </div>
                <Link className="inline-link" to="/financing">
                  {t('results.editFinancing')}
                </Link>
              </div>

              {dashboard.financing.status === 'available' &&
              dashboard.payment.status === 'available' ? (
                <div className="result-grid">
                  <ResultCard
                    detail={t('results.keyDecisions.totalProjectCostDetail')}
                    title={t('results.keyDecisions.totalProjectCost')}
                    value={formatEuro(dashboard.financing.totalProjectCostCents)}
                  />
                  <ResultCard
                    detail={t('results.keyDecisions.loanDetail')}
                    title={t('results.keyDecisions.loan')}
                    value={formatEuro(dashboard.financing.loanAmountCents)}
                  />
                  <ResultCard
                    detail={
                      dashboard.payment.cashPurchase
                        ? t('results.keyDecisions.cashPurchaseDetail')
                        : t('results.keyDecisions.paymentDetail')
                    }
                    emphasis="summary"
                    title={t('results.keyDecisions.monthlyPayment')}
                    value={formatEuro(dashboard.payment.monthlyPaymentCents)}
                  />
                  {dashboard.fixedPeriod.status === 'available' ? (
                    <ResultCard
                      detail={t('results.keyDecisions.debtDetail', {
                        years: financingDraft.fixedInterestYears,
                      })}
                      title={t('results.keyDecisions.debt')}
                      value={formatEuro(dashboard.fixedPeriod.remainingDebtCents)}
                    />
                  ) : null}
                </div>
              ) : (
                <UnavailableResult reason={t('results.reasons.financing')} />
              )}
            </section>

            <section className="form-section results-assumptions">
              <h2>{t('results.assumptions.title')}</h2>
              <p className="form-section__intro">{t('results.assumptions.summary')}</p>

              <fieldset className="form-fieldset">
                <legend>{t('results.assumptions.propertyUse')}</legend>
                <label className="choice-card">
                  <input
                    checked={analysis.propertyUse === 'owner-occupier'}
                    name="property-use"
                    onChange={() => updateAnalysis({ propertyUse: 'owner-occupier' })}
                    type="radio"
                  />
                  <span>
                    <strong>{t('results.mode.owner')}</strong>
                    <small>{t('results.mode.ownerDescription')}</small>
                  </span>
                </label>
                <label className="choice-card">
                  <input
                    checked={analysis.propertyUse === 'rental-investment'}
                    name="property-use"
                    onChange={() => updateAnalysis({ propertyUse: 'rental-investment' })}
                    type="radio"
                  />
                  <span>
                    <strong>{t('results.mode.rental')}</strong>
                    <small>{t('results.mode.rentalDescription')}</small>
                  </span>
                </label>
              </fieldset>

              <h3 className="results-subheading">{t('results.refinancing.assumptionsTitle')}</h3>
              <p className="result-detail">{t('results.refinancing.assumptionsDetail')}</p>
              <div className="financing-input-grid">
                <DashboardInput
                  id="refinancingInitialRepaymentRate"
                  label={t('results.refinancing.initialRepaymentRate')}
                  onChange={update('refinancingInitialRepaymentRate')}
                  suffix="%"
                  value={analysis.refinancingInitialRepaymentRate}
                />
                <DashboardInput
                  id="refinancingLowerRate"
                  label={t('results.refinancing.lowerRate')}
                  onChange={update('refinancingLowerRate')}
                  suffix="%"
                  value={analysis.refinancingLowerRate}
                />
                <DashboardInput
                  id="refinancingBaseRate"
                  label={t('results.refinancing.baseRate')}
                  onChange={update('refinancingBaseRate')}
                  suffix="%"
                  value={analysis.refinancingBaseRate}
                />
                <DashboardInput
                  id="refinancingHigherRate"
                  label={t('results.refinancing.higherRate')}
                  onChange={update('refinancingHigherRate')}
                  suffix="%"
                  value={analysis.refinancingHigherRate}
                />
              </div>

              {analysis.propertyUse === 'owner-occupier' ? (
                <>
                  <h3 className="results-subheading">{t('results.owner.assumptionsTitle')}</h3>
                  <div className="financing-input-grid">
                    <DashboardInput
                      id="currentComparableRent"
                      label={t('results.owner.currentRent')}
                      onChange={update('currentComparableRent')}
                      placeholder="1.200"
                      suffix="€"
                      value={analysis.currentComparableRent}
                    />
                    <DashboardInput
                      id="monthlyOwnerCosts"
                      label={t('results.owner.monthlyOwnerCosts')}
                      onChange={update('monthlyOwnerCosts')}
                      placeholder="350"
                      suffix="€"
                      value={analysis.monthlyOwnerCosts}
                    />
                    <DashboardInput
                      id="ownerAnalysisYears"
                      label={t('results.owner.analysisYears')}
                      onChange={update('ownerAnalysisYears')}
                      suffix={t('results.units.years')}
                      value={analysis.ownerAnalysisYears}
                    />
                    <DashboardInput
                      id="ownerRentGrowthRate"
                      label={t('results.owner.rentGrowth')}
                      onChange={update('ownerRentGrowthRate')}
                      suffix="%"
                      value={analysis.ownerRentGrowthRate}
                    />
                    <DashboardInput
                      id="ownerCostGrowthRate"
                      label={t('results.owner.ownerCostGrowth')}
                      onChange={update('ownerCostGrowthRate')}
                      suffix="%"
                      value={analysis.ownerCostGrowthRate}
                    />
                    <DashboardInput
                      id="propertyAppreciationRate"
                      label={t('results.owner.propertyAppreciation')}
                      onChange={update('propertyAppreciationRate')}
                      suffix="%"
                      value={analysis.propertyAppreciationRate}
                    />
                    <DashboardInput
                      id="alternativeReturnRate"
                      label={t('results.owner.alternativeReturn')}
                      onChange={update('alternativeReturnRate')}
                      suffix="%"
                      value={analysis.alternativeReturnRate}
                    />
                    <DashboardInput
                      id="ownerSellingCostRate"
                      label={t('results.owner.sellingCosts')}
                      onChange={update('ownerSellingCostRate')}
                      suffix="%"
                      value={analysis.ownerSellingCostRate}
                    />
                  </div>
                </>
              ) : (
                <>
                  <h3 className="results-subheading">{t('results.rental.assumptionsTitle')}</h3>
                  <div className="financing-input-grid">
                    <DashboardInput
                      id="monthlyNetColdRent"
                      label={t('results.rental.monthlyNetColdRent')}
                      onChange={update('monthlyNetColdRent')}
                      placeholder="1.000"
                      suffix="€"
                      value={analysis.monthlyNetColdRent}
                    />
                    <DashboardInput
                      id="vacancyRate"
                      label={t('results.rental.vacancyRate')}
                      onChange={update('vacancyRate')}
                      suffix="%"
                      value={analysis.vacancyRate}
                    />
                    <DashboardInput
                      id="otherAnnualRentLoss"
                      label={t('results.rental.otherAnnualRentLoss')}
                      onChange={update('otherAnnualRentLoss')}
                      suffix="€"
                      value={analysis.otherAnnualRentLoss}
                    />
                    <DashboardInput
                      id="monthlyNonRecoverableHausgeld"
                      label={t('results.rental.nonRecoverableHausgeld')}
                      onChange={update('monthlyNonRecoverableHausgeld')}
                      placeholder="150"
                      suffix="€"
                      value={analysis.monthlyNonRecoverableHausgeld}
                    />
                    <DashboardInput
                      id="monthlyReserveContribution"
                      label={t('results.rental.reserve')}
                      onChange={update('monthlyReserveContribution')}
                      suffix="€"
                      value={analysis.monthlyReserveContribution}
                    />
                    <DashboardInput
                      id="annualMaintenanceAllowance"
                      label={t('results.rental.maintenance')}
                      onChange={update('annualMaintenanceAllowance')}
                      suffix="€"
                      value={analysis.annualMaintenanceAllowance}
                    />
                    <DashboardInput
                      id="otherAnnualOwnerCosts"
                      label={t('results.rental.otherOwnerCosts')}
                      onChange={update('otherAnnualOwnerCosts')}
                      suffix="€"
                      value={analysis.otherAnnualOwnerCosts}
                    />
                    <DashboardInput
                      id="rentalHoldingYears"
                      label={t('results.rental.holdingYears')}
                      onChange={update('rentalHoldingYears')}
                      suffix={t('results.units.years')}
                      value={analysis.rentalHoldingYears}
                    />
                    <DashboardInput
                      id="rentalRentGrowthRate"
                      label={t('results.rental.rentGrowth')}
                      onChange={update('rentalRentGrowthRate')}
                      suffix="%"
                      value={analysis.rentalRentGrowthRate}
                    />
                    <DashboardInput
                      id="rentalOwnerCostGrowthRate"
                      label={t('results.rental.ownerCostGrowth')}
                      onChange={update('rentalOwnerCostGrowthRate')}
                      suffix="%"
                      value={analysis.rentalOwnerCostGrowthRate}
                    />
                    <DashboardInput
                      id="rentalPropertyAppreciationRate"
                      label={t('results.rental.saleAppreciation')}
                      onChange={update('rentalPropertyAppreciationRate')}
                      suffix="%"
                      value={analysis.rentalPropertyAppreciationRate}
                    />
                    <DashboardInput
                      id="rentalSellingCostRate"
                      label={t('results.rental.saleCosts')}
                      onChange={update('rentalSellingCostRate')}
                      suffix="%"
                      value={analysis.rentalSellingCostRate}
                    />
                  </div>
                </>
              )}

              <details className="results-details">
                <summary>{t('results.offer.assumptionsTitle')}</summary>
                <p>{t('results.offer.assumptionsDetail')}</p>
                <div className="financing-input-grid">
                  <DashboardInput
                    id="maximumMonthlyPayment"
                    label={t('results.offer.maximumMonthlyPayment')}
                    onChange={update('maximumMonthlyPayment')}
                    suffix="€"
                    value={analysis.maximumMonthlyPayment}
                  />
                  {analysis.propertyUse === 'rental-investment' ? (
                    <>
                      <DashboardInput
                        id="targetGrossYield"
                        label={t('results.offer.targetGrossYield')}
                        onChange={update('targetGrossYield')}
                        suffix="%"
                        value={analysis.targetGrossYield}
                      />
                      <DashboardInput
                        id="targetNetYield"
                        label={t('results.offer.targetNetYield')}
                        onChange={update('targetNetYield')}
                        suffix="%"
                        value={analysis.targetNetYield}
                      />
                    </>
                  ) : null}
                  <DashboardInput
                    id="livingAreaSquareMetres"
                    label={t('results.offer.livingArea')}
                    onChange={update('livingAreaSquareMetres')}
                    suffix="m²"
                    value={analysis.livingAreaSquareMetres}
                  />
                  <DashboardInput
                    id="askingPrice"
                    label={t('results.offer.askingPrice')}
                    onChange={update('askingPrice')}
                    suffix="€"
                    value={analysis.askingPrice}
                  />
                  <DashboardInput
                    id="proposedOffer"
                    label={t('results.offer.proposedOffer')}
                    onChange={update('proposedOffer')}
                    suffix="€"
                    value={analysis.proposedOffer}
                  />
                  <DashboardInput
                    id="comparablePricePerSquareMetreLow"
                    label={t('results.offer.comparableLow')}
                    onChange={update('comparablePricePerSquareMetreLow')}
                    suffix="€/m²"
                    value={analysis.comparablePricePerSquareMetreLow}
                  />
                  <DashboardInput
                    id="comparablePricePerSquareMetreHigh"
                    label={t('results.offer.comparableHigh')}
                    onChange={update('comparablePricePerSquareMetreHigh')}
                    suffix="€/m²"
                    value={analysis.comparablePricePerSquareMetreHigh}
                  />
                  <DashboardInput
                    id="openingOfferLargerDiscount"
                    label={t('results.offer.largerDiscount')}
                    onChange={update('openingOfferLargerDiscount')}
                    suffix="%"
                    value={analysis.openingOfferLargerDiscount}
                  />
                  <DashboardInput
                    id="openingOfferSmallerDiscount"
                    label={t('results.offer.smallerDiscount')}
                    onChange={update('openingOfferSmallerDiscount')}
                    suffix="%"
                    value={analysis.openingOfferSmallerDiscount}
                  />
                </div>
              </details>
            </section>

            <section className="results-section">
              <h2>{t('results.refinancing.title')}</h2>
              {isNotConfigured(dashboard.refinancing) ? (
                <SetupRequired count={dashboard.refinancing.missing.length} />
              ) : dashboard.refinancing.status === 'available' ? (
                <>
                  <p className="result-detail">{t('results.refinancing.disclaimer')}</p>
                  <div className="result-grid results-refinancing-grid">
                    {dashboard.refinancing.scenarios.map((scenario) => (
                      <ResultCard
                        detail={t('results.refinancing.paymentChange', {
                          value: formatSignedEuro(scenario.monthlyPaymentChangeCents, language),
                        })}
                        key={scenario.id}
                        title={t(`results.refinancing.scenario.${scenario.id}`, {
                          rate: formatRate(scenario.futureNominalAnnualRate),
                        })}
                        value={formatEuro(scenario.futureMonthlyPaymentCents)}
                      />
                    ))}
                  </div>
                </>
              ) : dashboard.refinancing.status === 'not-applicable' ? (
                <article className="result-card summary">
                  <h3>{t('results.refinancing.notApplicableTitle')}</h3>
                  <p>{t('results.refinancing.notApplicableMessage')}</p>
                </article>
              ) : (
                <UnavailableResult reason={dashboard.refinancing.reason} />
              )}
            </section>

            {dashboard.modeSpecific.mode === 'owner-occupier' ? (
              <section className="results-section">
                <h2>{t('results.owner.title')}</h2>
                {isNotConfigured(dashboard.modeSpecific.result) ? (
                  <SetupRequired count={dashboard.modeSpecific.result.missing.length} />
                ) : dashboard.modeSpecific.result.status === 'available' ? (
                  <>
                    <div className="result-grid">
                      <ResultCard
                        title={t('results.owner.buyerWealth')}
                        value={formatEuro(
                          dashboard.modeSpecific.result.atAnalysisMonth.buyerNetWealthCents,
                        )}
                      />
                      <ResultCard
                        title={t('results.owner.renterWealth')}
                        value={formatEuro(
                          dashboard.modeSpecific.result.atAnalysisMonth.renterNetWealthCents,
                        )}
                      />
                      <ResultCard
                        emphasis="summary"
                        title={t('results.owner.wealthDifference')}
                        value={formatSignedEuro(
                          dashboard.modeSpecific.result.atAnalysisMonth.buyerMinusRenterCents,
                          language,
                        )}
                      />
                      <ResultCard
                        detail={t('results.owner.breakEvenDetail')}
                        title={t('results.owner.breakEven')}
                        value={
                          dashboard.modeSpecific.result.breakEven.status === 'reached'
                            ? t('results.units.yearNumber', {
                                value: dashboard.modeSpecific.result.breakEven.year,
                              })
                            : t('results.owner.notReached')
                        }
                      />
                    </div>
                    <p className="result-detail">{t('results.owner.matchedBudgetDetail')}</p>
                  </>
                ) : (
                  <UnavailableResult reason={dashboard.modeSpecific.result.reason} />
                )}
              </section>
            ) : (
              <section className="results-section">
                <h2>{t('results.rental.title')}</h2>
                {isNotConfigured(dashboard.modeSpecific.result) ? (
                  <SetupRequired count={dashboard.modeSpecific.result.missing.length} />
                ) : dashboard.modeSpecific.result.status === 'available' ? (
                  <>
                    <div className="result-grid">
                      <ResultCard
                        title={t('results.rental.grossYield')}
                        value={formatRate(dashboard.modeSpecific.result.grossRentalYield)}
                      />
                      <ResultCard
                        title={t('results.rental.netYield')}
                        value={formatRate(dashboard.modeSpecific.result.netRentalYield)}
                      />
                      <ResultCard
                        detail={t('results.rental.beforeExtra')}
                        title={t('results.rental.monthlyCashFlow')}
                        value={formatSignedEuro(
                          dashboard.modeSpecific.result.firstMonth.preTaxCashFlowBeforeExtraCents,
                          language,
                        )}
                      />
                      <ResultCard
                        detail={t('results.rental.afterExtra')}
                        title={t('results.rental.monthlyCashFlow')}
                        value={formatSignedEuro(
                          dashboard.modeSpecific.result.firstMonth.preTaxCashFlowAfterExtraCents,
                          language,
                        )}
                      />
                      <ResultCard
                        title={t('results.rental.debtReduction')}
                        value={formatEuro(
                          dashboard.modeSpecific.result.debtReductionAfterHoldingPeriodCents,
                        )}
                      />
                      <ResultCard
                        title={t('results.rental.cashOnCash')}
                        value={
                          dashboard.modeSpecific.result.cashOnCash.status === 'available'
                            ? formatRate(
                                dashboard.modeSpecific.result.cashOnCash.annualBeforeExtraReturn,
                              )
                            : t('results.rental.notAvailable')
                        }
                      />
                    </div>
                    {dashboard.modeSpecific.result.sale.status === 'available' ? (
                      <article className="result-card summary">
                        <h3>{t('results.rental.saleTitle')}</h3>
                        <p className="result-value">
                          {formatEuro(
                            dashboard.modeSpecific.result.sale.estimatedProfitBeforeTaxCents,
                          )}
                        </p>
                        <p className="result-detail">
                          {t('results.rental.saleDetail', {
                            proceeds: formatEuro(
                              dashboard.modeSpecific.result.sale.netSaleProceedsCents,
                            ),
                          })}
                        </p>
                      </article>
                    ) : null}
                  </>
                ) : (
                  <UnavailableResult reason={dashboard.modeSpecific.result.reason} />
                )}
              </section>
            )}

            <section className="results-section">
              <h2>{t('results.offer.title')}</h2>
              {isNotConfigured(dashboard.offerPrice) ? (
                <SetupRequired count={dashboard.offerPrice.missing.length} />
              ) : dashboard.offerPrice.status === 'available' ? (
                <div className="result-grid">
                  {dashboard.offerPrice.grossYieldCeiling.status === 'available' ? (
                    <ResultCard
                      title={t('results.offer.grossYieldCeiling')}
                      value={formatEuro(dashboard.offerPrice.grossYieldCeiling.priceCeilingCents)}
                    />
                  ) : null}
                  {dashboard.offerPrice.netYieldCeiling.status === 'available' ? (
                    <ResultCard
                      title={t('results.offer.netYieldCeiling')}
                      value={formatEuro(dashboard.offerPrice.netYieldCeiling.priceCeilingCents)}
                    />
                  ) : null}
                  {dashboard.offerPrice.affordabilityCeiling.status === 'available' ? (
                    <ResultCard
                      title={t('results.offer.affordabilityCeiling')}
                      value={formatEuro(
                        dashboard.offerPrice.affordabilityCeiling.priceCeilingCents,
                      )}
                    />
                  ) : null}
                  {dashboard.offerPrice.comparableOffer.status === 'available' ? (
                    <>
                      <ResultCard
                        detail={t('results.offer.comparableRangeDetail', {
                          high: formatEuro(
                            dashboard.offerPrice.comparableOffer.comparableValueHighCents,
                          ),
                        })}
                        title={t('results.offer.comparableRange')}
                        value={formatEuro(
                          dashboard.offerPrice.comparableOffer.comparableValueLowCents,
                        )}
                      />
                      <ResultCard
                        title={t('results.offer.offerDifference')}
                        value={formatSignedEuro(
                          dashboard.offerPrice.comparableOffer.offerDifferenceCents,
                          language,
                        )}
                      />
                    </>
                  ) : null}
                </div>
              ) : (
                <UnavailableResult reason={dashboard.offerPrice.reason} />
              )}
            </section>
          </>
        )}
      </div>
    </PageLayout>
  )
}
