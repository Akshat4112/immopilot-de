import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Controller } from 'react-hook-form'

import { usePurchaseCostsCalculator } from './usePurchaseCosts'
import { PageLayout } from '../../components/PageLayout'
import type { BudgetStatus } from '../../domain/acquisition-costs'

export function PurchaseCostsPage() {
  const { t } = useTranslation()
  const {
    form,
    result,
    availableResult,
    isAvailable,
    setBudgetConfirmed,
    toggleBroker,
    formatEuroInput,
    formatRateInput,
    germanStateIds,
  } = usePurchaseCostsCalculator()

  const { register, control, watch, setValue, formState: { errors } } = form

  const purchasePrice = watch('purchasePrice')
  const brokerInvolved = watch('brokerInvolved')
  const renovationBudget = watch('renovationBudget')
  const movingSetupCosts = watch('movingSetupCosts')

  const hasErrors = result.status === 'unavailable' && result.reason === 'VALIDATION_ERROR'
  const hasUnconfirmedBudgets = result.status === 'unavailable' && result.reason === 'POST_PURCHASE_BUDGET_NOT_CONFIRMED'

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^\d]/g, '')
    setValue('purchasePrice', digits, { shouldValidate: true })
  }

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'notaryRate' | 'landRegisterRate' | 'buyerBrokerRate' | 'financedAcquisitionCostShare' | 'transferTaxRate') => {
    const cleaned = e.target.value.replace(/[^\d,]/g, '')
    setValue(`rateOverrides.${field}`, cleaned, { shouldValidate: true })
  }

  const renderBudgetField = (field: 'renovationBudget' | 'movingSetupCosts', labelKey: string) => {
    const budget = field === 'renovationBudget' ? renovationBudget : movingSetupCosts
    const isConfirmedZero = budget?.budgetStatus === 'confirmed-zero'
    const isBudgeted = budget?.budgetStatus === 'budgeted'
    const isNotBudgeted = budget?.budgetStatus === 'not-budgeted'
    const amount = budget?.amountCents ?? 0
    const formattedAmount = amount > 0 ? formatEuroInput(amount) : ''

    return (
      <div className="budget-field">
        <label className="budget-field__label">
          <span>{t(`purchase.${labelKey}`)}</span>
          <Controller
            name={`${field}.amountCents`}
            control={control}
            render={({ field: fieldProps }) => (
              <div className="budget-field__input-group">
                <span className="budget-field__currency">€</span>
                <input
                  {...fieldProps}
                  type="text"
                  inputMode="numeric"
                  value={formattedAmount}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^\d]/g, '')
                    const cents = digits ? Math.round(parseFloat(digits) * 100) : 0
                    fieldProps.onChange(cents)
                  }}
                  onBlur={() => fieldProps.onBlur()}
                  placeholder={t('purchase.budgetPlaceholder')}
                  className="budget-field__input"
                  aria-describedby={`${field}-help`}
                />
              </div>
            )}
          />
          <div id={`${field}-help`} className="budget-field__status">
            <select
              value={budget?.budgetStatus || 'not-budgeted'}
              onChange={(e) => setBudgetConfirmed(field, e.target.value as BudgetStatus)}
              className="budget-field__status-select"
            >
              <option value="not-budgeted">{t('purchase.budgetStatus.notBudgeted')}</option>
              <option value="confirmed-zero">{t('purchase.budgetStatus.confirmedZero')}</option>
              <option value="budgeted">{t('purchase.budgetStatus.budgeted')}</option>
            </select>
            <span className={`budget-field__status-badge ${isNotBudgeted ? 'warning' : ''} ${isConfirmedZero ? 'confirmed' : ''} ${isBudgeted ? 'budgeted' : ''}`}>
              {isNotBudgeted && t('purchase.budgetStatus.notBudgetedBadge')}
              {isConfirmedZero && t('purchase.budgetStatus.confirmedZeroBadge')}
              {isBudgeted && t('purchase.budgetStatus.budgetedBadge')}
            </span>
          </div>
        </label>
      </div>
    )
  }

  return (
    <PageLayout
      eyebrow={t('shell.pages.eyebrow')}
      title={t('shell.pages.purchaseCosts.title')}
      summary={t('shell.pages.purchaseCosts.summary')}
    >
      <form onSubmit={(e) => e.preventDefault()} className="purchase-costs-form">
        <section className="form-section">
          <h2>{t('purchase.section.quickInputs')}</h2>

          <div className="form-field">
            <label htmlFor="purchasePrice">
              {t('property.purchasePrice')} <span className="required" aria-hidden="true">*</span>
            </label>
            <div className="form-field__input-group">
              <input
                {...register('purchasePrice')}
                type="text"
                id="purchasePrice"
                inputMode="numeric"
                value={purchasePrice}
                onChange={handlePriceChange}
                placeholder="250.000"
                className={errors.purchasePrice ? 'error' : ''}
                aria-invalid={!!errors.purchasePrice}
                aria-describedby={errors.purchasePrice ? 'purchasePrice-error' : undefined}
              />
              <span className="form-field__currency" aria-hidden="true">€</span>
            </div>
            {errors.purchasePrice && (
              <p id="purchasePrice-error" className="form-field__error" role="alert">
                {t('purchase.errors.purchasePriceRequired')}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="stateId">
              {t('purchase.stateLabel')} <span className="required" aria-hidden="true">*</span>
            </label>
            <Controller
              name="stateId"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  id="stateId"
                  className={errors.stateId ? 'error' : ''}
                  aria-invalid={!!errors.stateId}
                  aria-describedby={errors.stateId ? 'stateId-error' : undefined}
                >
                  {germanStateIds.map((id) => (
                    <option key={id} value={id}>
                      {id === 'DE-BW' ? 'Baden-Württemberg' :
                       id === 'DE-BY' ? 'Bayern' :
                       id === 'DE-BE' ? 'Berlin' :
                       id === 'DE-BB' ? 'Brandenburg' :
                       id === 'DE-HB' ? 'Bremen' :
                       id === 'DE-HH' ? 'Hamburg' :
                       id === 'DE-HE' ? 'Hessen' :
                       id === 'DE-MV' ? 'Mecklenburg-Vorpommern' :
                       id === 'DE-NI' ? 'Niedersachsen' :
                       id === 'DE-NW' ? 'Nordrhein-Westfalen' :
                       id === 'DE-RP' ? 'Rheinland-Pfalz' :
                       id === 'DE-SL' ? 'Saarland' :
                       id === 'DE-SN' ? 'Sachsen' :
                       id === 'DE-ST' ? 'Sachsen-Anhalt' :
                       id === 'DE-SH' ? 'Schleswig-Holstein' :
                       'Thüringen'}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.stateId && (
              <p id="stateId-error" className="form-field__error" role="alert">
                {t('purchase.errors.stateRequired')}
              </p>
            )}
          </div>

          <div className="form-field form-field--toggle">
            <label className="toggle-label">
              <Controller
                name="brokerInvolved"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="brokerInvolved"
                    checked={field.value ?? false}
                    onChange={(e) => toggleBroker(e.target.checked)}
                    className="toggle-input"
                  />
                )}
              />
              <span className="toggle-slider" aria-hidden="true"></span>
              <span className="toggle-text">{t('purchase.brokerToggle')}</span>
            </label>
          </div>

          {brokerInvolved && (
            <div className="form-field form-field--conditional">
              <label htmlFor="buyerBrokerRate">
                {t('purchase.buyerBrokerRateLabel')}
              </label>
              <Controller
                name="rateOverrides.buyerBrokerRate"
                control={control}
                render={({ field }) => (
                  <div className="form-field__input-group">
                    <input
                      {...field}
                      type="text"
                      id="buyerBrokerRate"
                      inputMode="decimal"
                      value={field.value || formatRateInput(0.0357)}
                      onChange={(e) => handleRateChange(e, 'buyerBrokerRate')}
                      placeholder="3,57"
                      className="rate-input"
                    />
                    <span className="form-field__currency" aria-hidden="true">%</span>
                  </div>
                )}
              />
            </div>
          )}

          <div className="form-field">
            <label htmlFor="availableEquity">
              {t('finance.equity')}
            </label>
            <Controller
              name="availableEquity"
              control={control}
              render={({ field }) => (
                <div className="form-field__input-group">
                  <input
                    {...field}
                    type="text"
                    id="availableEquity"
                    inputMode="numeric"
                    value={field.value || ''}
                    onChange={handlePriceChange}
                    placeholder="50.000"
                    className="rate-input"
                  />
                  <span className="form-field__currency" aria-hidden="true">€</span>
                </div>
              )}
            />
          </div>

          <div className="form-field">
            <label htmlFor="nominalRate">
              {t('finance.nominalRate')}
            </label>
            <Controller
              name="nominalRate"
              control={control}
              render={({ field }) => (
                <div className="form-field__input-group">
                  <input
                    {...field}
                    type="text"
                    id="nominalRate"
                    inputMode="decimal"
                    value={field.value || ''}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^\d,]/g, '')
                      field.onChange(cleaned)
                    }}
                    placeholder="3,50"
                    className="rate-input"
                  />
                  <span className="form-field__currency" aria-hidden="true">%</span>
                </div>
              )}
            />
          </div>

          <div className="form-field">
            <label htmlFor="initialRepaymentRate">
              {t('finance.initialRepaymentRate')}
            </label>
            <Controller
              name="initialRepaymentRate"
              control={control}
              render={({ field }) => (
                <div className="form-field__input-group">
                  <input
                    {...field}
                    type="text"
                    id="initialRepaymentRate"
                    inputMode="decimal"
                    value={field.value || ''}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^\d,]/g, '')
                      field.onChange(cleaned)
                    }}
                    placeholder="2,00"
                    className="rate-input"
                  />
                  <span className="form-field__currency" aria-hidden="true">%</span>
                </div>
              )}
            />
          </div>

          <div className="form-field">
            <label htmlFor="fixedInterestYears">
              {t('finance.fixedRatePeriod')}
            </label>
            <Controller
              name="fixedInterestYears"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  id="fixedInterestYears"
                  value={field.value || '10'}
                  className="rate-input"
                >
                  <option value="5">{t('purchase.fixedPeriod.5')}</option>
                  <option value="10">{t('purchase.fixedPeriod.10')}</option>
                  <option value="15">{t('purchase.fixedPeriod.15')}</option>
                  <option value="20">{t('purchase.fixedPeriod.20')}</option>
                  <option value="30">{t('purchase.fixedPeriod.30')}</option>
                </select>
              )}
            />
          </div>

          <div className="form-field">
            <label htmlFor="currentRent">
              {t('rent.netColdRent')} ({t('rent.monthly')})
            </label>
            <Controller
              name="currentRent"
              control={control}
              render={({ field }) => (
                <div className="form-field__input-group">
                  <input
                    {...field}
                    type="text"
                    id="currentRent"
                    inputMode="numeric"
                    value={field.value || ''}
                    onChange={handlePriceChange}
                    placeholder="1.000"
                    className="rate-input"
                  />
                  <span className="form-field__currency" aria-hidden="true">€</span>
                </div>
              )}
            />
          </div>
        </section>

        <section className="form-section form-section--advanced">
          <h2>
            <button
              type="button"
              className="advanced-toggle"
              onClick={() => {
                const el = document.querySelector('.advanced-fields')
                el?.classList.toggle('expanded')
                const btn = document.querySelector('.advanced-toggle')
                btn?.setAttribute('aria-expanded', el?.classList.contains('expanded') ? 'true' : 'false')
              }}
              aria-expanded="false"
            >
              {t('purchase.section.advancedInputs')}
            </button>
          </h2>
          <div className="advanced-fields">
            <div className="form-field">
              <label htmlFor="notaryRate">
                {t('purchase.notaryCosts')} ({t('purchase.rateLabel')})
              </label>
              <Controller
                name="rateOverrides.notaryRate"
                control={control}
                render={({ field }) => (
                  <div className="form-field__input-group">
                    <input
                      {...field}
                      type="text"
                      id="notaryRate"
                      inputMode="decimal"
                      value={field.value || formatRateInput(0.01)}
                      onChange={(e) => handleRateChange(e, 'notaryRate')}
                      placeholder="1,00"
                      className="rate-input"
                    />
                    <span className="form-field__currency" aria-hidden="true">%</span>
                  </div>
                )}
              />
            </div>

            <div className="form-field">
              <label htmlFor="landRegisterRate">
                {t('purchase.landRegisterCosts')} ({t('purchase.rateLabel')})
              </label>
              <Controller
                name="rateOverrides.landRegisterRate"
                control={control}
                render={({ field }) => (
                  <div className="form-field__input-group">
                    <input
                      {...field}
                      type="text"
                      id="landRegisterRate"
                      inputMode="decimal"
                      value={field.value || formatRateInput(0.005)}
                      onChange={(e) => handleRateChange(e, 'landRegisterRate')}
                      placeholder="0,50"
                      className="rate-input"
                    />
                    <span className="form-field__currency" aria-hidden="true">%</span>
                  </div>
                )}
              />
            </div>

            {renderBudgetField('renovationBudget', 'renovationCosts')}
            {renderBudgetField('movingSetupCosts', 'initialCosts')}

            <div className="form-field">
              <label htmlFor="financedShare">
                {t('purchase.financedAcquisitionCostShare')}
              </label>
              <Controller
                name="rateOverrides.financedAcquisitionCostShare"
                control={control}
                render={({ field }) => (
                  <div className="form-field__input-group">
                    <input
                      {...field}
                      type="text"
                      id="financedShare"
                      inputMode="decimal"
                      value={field.value || formatRateInput(0)}
                      onChange={(e) => handleRateChange(e, 'financedAcquisitionCostShare')}
                      placeholder="0,00"
                      className="rate-input"
                    />
                    <span className="form-field__currency" aria-hidden="true">%</span>
                  </div>
                )}
              />
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="results-section" aria-live="polite">
          <h2>{t('purchase.section.results')}</h2>

          {hasErrors && (
            <div className="result-card error" role="alert">
              <h3>{t('purchase.errors.calculationFailed')}</h3>
              <p>{result.error?.message}</p>
              <p className="error-detail">
                {t('purchase.errors.field')}: {result.error?.field} | {t('purchase.errors.code')}: {result.error?.code}
              </p>
            </div>
          )}

          {hasUnconfirmedBudgets && (
            <div className="result-card warning" role="status">
              <h3>{t('purchase.warnings.unconfirmedBudgets')}</h3>
              <p>{t('purchase.warnings.unconfirmedBudgetsMessage')}</p>
              <ul>
                {result.unconfirmedBudgetFields?.map((field: string) => (
                  <li key={field}>{t(`purchase.budgetFields.${field}`)}</li>
                ))}
              </ul>
            </div>
          )}

          {isAvailable && availableResult && (
            <>
              <div className="result-grid">
                <article className="result-card">
                  <h3>{t('purchase.results.transferTax')}</h3>
                  <p className="result-value">{formatEuroInput(availableResult.transferTaxCents)} €</p>
                  <p className="result-detail">
                    {t('purchase.results.rate')}: {(((availableResult.appliedAssumptions.transferTaxRate.value).toNumber?.() * 100 || 0).toFixed(2))}%
                    <span className="origin-badge">{t(`purchase.origin.${availableResult.appliedAssumptions.transferTaxRate.origin}`)}</span>
                  </p>
                </article>

                <article className="result-card">
                  <h3>{t('purchase.results.notaryCosts')}</h3>
                  <p className="result-value">{formatEuroInput(availableResult.notaryCostsCents)} €</p>
                  <p className="result-detail">
                    {t('purchase.results.rate')}: {(((availableResult.appliedAssumptions.notaryRate.value).toNumber?.() * 100 || 0).toFixed(2))}%
                    <span className="origin-badge">{t(`purchase.origin.${availableResult.appliedAssumptions.notaryRate.origin}`)}</span>
                  </p>
                </article>

                <article className="result-card">
                  <h3>{t('purchase.results.landRegisterCosts')}</h3>
                  <p className="result-value">{formatEuroInput(availableResult.landRegisterCostsCents)} €</p>
                  <p className="result-detail">
                    {t('purchase.results.rate')}: {(((availableResult.appliedAssumptions.landRegisterRate.value).toNumber?.() * 100 || 0).toFixed(2))}%
                    <span className="origin-badge">{t(`purchase.origin.${availableResult.appliedAssumptions.landRegisterRate.origin}`)}</span>
                  </p>
                </article>

                {brokerInvolved && (
                  <article className="result-card">
                    <h3>{t('purchase.results.brokerCommission')}</h3>
                    <p className="result-value">{formatEuroInput(availableResult.buyerBrokerCommissionCents)} €</p>
                    <p className="result-detail">
                      {t('purchase.results.rate')}: {(((availableResult.appliedAssumptions.buyerBrokerRate.value).toNumber?.() * 100 || 0).toFixed(2))}%
                      <span className="origin-badge">{t(`purchase.origin.${availableResult.appliedAssumptions.buyerBrokerRate.origin}`)}</span>
                    </p>
                  </article>
                )}
              </div>

              <div className="result-card summary">
                <h3>{t('purchase.results.transactionCosts')}</h3>
                <p className="result-value large">{formatEuroInput(availableResult.transactionAcquisitionCostsCents)} €</p>
                <p className="result-detail">{t('purchase.results.sumOfAbove')}</p>
              </div>

              <div className="result-card summary">
                <h3>{t('purchase.results.postPurchaseBudget')}</h3>
                <p className="result-value large">{formatEuroInput(availableResult.postPurchaseBudgetCents)} €</p>
                <p className="result-detail">{t('purchase.results.renovationPlusMoving')}</p>
              </div>

              <div className="result-card total">
                <h3>{t('purchase.results.totalProjectCost')}</h3>
                <p className="result-value large">{formatEuroInput(availableResult.totalProjectCostCents)} €</p>
                <p className="result-detail">{t('purchase.results.purchasePricePlusAllCosts')}</p>
              </div>

              <div className="result-card metadata">
                <h4>{t('purchase.results.assumptions')}</h4>
                <dl>
                  <dt>{t('purchase.results.assumptionSetVersion')}</dt>
                  <dd>{availableResult.appliedAssumptions.assumptionSetVersion}</dd>
                  <dt>{t('purchase.results.transferTaxRateSourceDate')}</dt>
                  <dd>{availableResult.appliedAssumptions.transferTaxRateSourceDate}</dd>
                </dl>
              </div>
            </>
          )}
        </section>

        {isAvailable && availableResult && (
          <section className="next-steps">
            <h3>{t('purchase.section.nextSteps')}</h3>
            <p>{t('purchase.nextSteps.message')}</p>
            <nav className="next-steps__links">
              <Link to="/financing" className="next-steps__link primary">
                {t('purchase.nextSteps.continueToFinancing')}
              </Link>
              <Link to="/comparison" className="next-steps__link secondary">
                {t('purchase.nextSteps.compareScenarios')}
              </Link>
            </nav>
          </section>
        )}
      </form>
    </PageLayout>
  )
}