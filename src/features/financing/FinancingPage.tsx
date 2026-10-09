import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Controller, useFieldArray } from 'react-hook-form'
import * as z from 'zod'

import { useFinancingCalculator } from './useFinancing'
import { PageLayout } from '../../components/PageLayout'
import type { AvailableFinancingResult } from '../../domain/financing'
import { financingFormSchema } from './schema'

export function FinancingPage() {
  const { t } = useTranslation()
  const {
    form,
    result,
    isAvailable,
    financingModes,
    formatEuroInput,
    formatRateInput,
    parseRateInput,
  } = useFinancingCalculator(null)

  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = form

  const {
    fields: oneTimeFields,
    append: appendOneTime,
    remove: removeOneTime,
  } = useFieldArray({
    control,
    name: 'oneTimeAdditionalRepayments',
  })

  const {
    fields: refinancingFields,
    append: appendRefinancing,
    remove: removeRefinancing,
  } = useFieldArray({
    control,
    name: 'refinancingScenarios',
  })

  const mode = watch('mode')

  const hasErrors = result?.status === 'unavailable' && result.reason === 'VALIDATION_ERROR'

  const handleEuroChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof z.infer<typeof financingFormSchema>,
  ) => {
    const digits = e.target.value.replace(/[^\d]/g, '')
    const cents = digits ? Math.round(parseFloat(digits) * 100) : 0
    setValue(field, cents, { shouldValidate: true })
  }

  const handleRateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof z.infer<typeof financingFormSchema>,
  ) => {
    const cleaned = e.target.value.replace(/[^\d,]/g, '')
    setValue(field, cleaned, { shouldValidate: true })
  }

  const handleMonthChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    field: keyof z.infer<typeof financingFormSchema>,
  ) => {
    const value = e.target.value ? parseInt(e.target.value, 10) : 0
    setValue(field, value, { shouldValidate: true })
  }

  // Narrow the result type to available for rendering
  const availableResult = isAvailable ? (result as AvailableFinancingResult) : null

  return (
    <PageLayout
      eyebrow={t('shell.pages.eyebrow')}
      title={t('shell.pages.financing.title')}
      summary={t('shell.pages.financing.summary')}
    >
      <form onSubmit={(e) => e.preventDefault()} className="financing-form">
        {/* Quick Inputs */}
        <section className="form-section">
          <h2>{t('financing.section.quickInputs')}</h2>

          {/* Financing Mode */}
          <div className="form-field">
            <fieldset>
              <legend>{t('financing.modeLabel')}</legend>
              <div className="radio-group">
                {financingModes.map((financingMode) => (
                  <label key={financingMode} className="radio-label">
                    <Controller
                      name="mode"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="radio"
                          {...field}
                          value={financingMode}
                          checked={field.value === financingMode}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="radio-input"
                        />
                      )}
                    />
                    <span className="radio-text">
                      {financingMode === 'selected-down-payment'
                        ? t('financing.mode.selectedDownPayment')
                        : t('financing.mode.availableEquity')}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Available Equity */}
          <div className="form-field">
            <label htmlFor="availableEquity">
              {t('financing.availableEquityLabel')}
              <span className="required" aria-hidden="true">
                *
              </span>
            </label>
            <Controller
              name="availableEquityCents"
              control={control}
              render={({ field }) => (
                <div className="form-field__input-group">
                  <input
                    {...field}
                    type="text"
                    id="availableEquity"
                    inputMode="numeric"
                    value={field.value ? formatEuroInput(field.value) : ''}
                    onChange={(e) => handleEuroChange(e, 'availableEquityCents')}
                    placeholder="50.000"
                    className={errors.availableEquityCents ? 'error' : ''}
                    aria-invalid={!!errors.availableEquityCents}
                    aria-describedby={
                      errors.availableEquityCents ? 'availableEquity-error' : undefined
                    }
                  />
                  <span className="form-field__currency" aria-hidden="true">
                    €
                  </span>
                </div>
              )}
            />
            {errors.availableEquityCents && (
              <p id="availableEquity-error" className="form-field__error" role="alert">
                {t('financing.errors.availableEquityRequired')}
              </p>
            )}
          </div>

          {/* Down Payment (conditional) */}
          {mode === 'selected-down-payment' && (
            <div className="form-field">
              <label htmlFor="downPayment">
                {t('financing.downPaymentLabel')}
                <span className="required" aria-hidden="true">
                  *
                </span>
              </label>
              <Controller
                name="downPaymentCents"
                control={control}
                render={({ field }) => (
                  <div className="form-field__input-group">
                    <input
                      {...field}
                      type="text"
                      id="downPayment"
                      inputMode="numeric"
                      value={field.value ? formatEuroInput(field.value) : ''}
                      onChange={(e) => handleEuroChange(e, 'downPaymentCents')}
                      placeholder="50.000"
                      className={errors.downPaymentCents ? 'error' : ''}
                      aria-invalid={!!errors.downPaymentCents}
                      aria-describedby={errors.downPaymentCents ? 'downPayment-error' : undefined}
                    />
                    <span className="form-field__currency" aria-hidden="true">
                      €
                    </span>
                  </div>
                )}
              />
              {errors.downPaymentCents && (
                <p id="downPayment-error" className="form-field__error" role="alert">
                  {t('financing.errors.downPaymentRequired')}
                </p>
              )}
            </div>
          )}

          {/* Financed Acquisition Cost Share */}
          <div className="form-field">
            <label htmlFor="financedAcquisitionCostShare">
              {t('financing.financedAcquisitionCostShareLabel')}
            </label>
            <Controller
              name="financedAcquisitionCostShare"
              control={control}
              render={({ field }) => (
                <div className="form-field__input-group">
                  <input
                    {...field}
                    type="text"
                    id="financedAcquisitionCostShare"
                    inputMode="decimal"
                    value={field.value || '0'}
                    onChange={(e) => handleRateChange(e, 'financedAcquisitionCostShare')}
                    placeholder="0,00"
                    className="rate-input"
                  />
                  <span className="form-field__currency" aria-hidden="true">
                    %
                  </span>
                </div>
              )}
            />
          </div>

          {/* Nominal Annual Rate */}
          <div className="form-field">
            <label htmlFor="nominalAnnualRate">
              {t('financing.nominalRateLabel')}
              <span className="required" aria-hidden="true">
                *
              </span>
            </label>
            <Controller
              name="nominalAnnualRate"
              control={control}
              render={({ field }) => (
                <div className="form-field__input-group">
                  <input
                    {...field}
                    type="text"
                    id="nominalAnnualRate"
                    inputMode="decimal"
                    value={field.value || formatRateInput(parseRateInput('3,5'))}
                    onChange={(e) => handleRateChange(e, 'nominalAnnualRate')}
                    placeholder="3,50"
                    className={errors.nominalAnnualRate ? 'error rate-input' : 'rate-input'}
                    aria-invalid={!!errors.nominalAnnualRate}
                    aria-describedby={errors.nominalAnnualRate ? 'nominalRate-error' : undefined}
                  />
                  <span className="form-field__currency" aria-hidden="true">
                    %
                  </span>
                </div>
              )}
            />
            {errors.nominalAnnualRate && (
              <p id="nominalRate-error" className="form-field__error" role="alert">
                {t('financing.errors.nominalRateRequired')}
              </p>
            )}
          </div>

          {/* Initial Repayment Rate */}
          <div className="form-field">
            <label htmlFor="initialRepaymentRate">
              {t('financing.initialRepaymentRateLabel')}
              <span className="required" aria-hidden="true">
                *
              </span>
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
                    value={field.value || formatRateInput(parseRateInput('2,0'))}
                    onChange={(e) => handleRateChange(e, 'initialRepaymentRate')}
                    placeholder="2,00"
                    className={errors.initialRepaymentRate ? 'error rate-input' : 'rate-input'}
                    aria-invalid={!!errors.initialRepaymentRate}
                    aria-describedby={
                      errors.initialRepaymentRate ? 'initialRepaymentRate-error' : undefined
                    }
                  />
                  <span className="form-field__currency" aria-hidden="true">
                    %
                  </span>
                </div>
              )}
            />
            {errors.initialRepaymentRate && (
              <p id="initialRepaymentRate-error" className="form-field__error" role="alert">
                {t('financing.errors.initialRepaymentRateRequired')}
              </p>
            )}
          </div>

          {/* Fixed Interest Period */}
          <div className="form-field">
            <label htmlFor="fixedInterestMonths">{t('financing.fixedInterestPeriodLabel')}</label>
            <Controller
              name="fixedInterestMonths"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  id="fixedInterestMonths"
                  value={field.value || '120'}
                  className="rate-input"
                  onChange={(e) => handleMonthChange(e, 'fixedInterestMonths')}
                >
                  <option value="60">{t('financing.fixedPeriod.5')}</option>
                  <option value="120">{t('financing.fixedPeriod.10')}</option>
                  <option value="180">{t('financing.fixedPeriod.15')}</option>
                  <option value="240">{t('financing.fixedPeriod.20')}</option>
                  <option value="360">{t('financing.fixedPeriod.30')}</option>
                </select>
              )}
            />
          </div>
        </section>

        {/* Advanced Section */}
        <section className="form-section form-section--advanced">
          <h2>
            <button
              type="button"
              className="advanced-toggle"
              onClick={() => {
                const el = document.querySelector('.advanced-fields')
                el?.classList.toggle('expanded')
                const btn = document.querySelector('.advanced-toggle')
                btn?.setAttribute(
                  'aria-expanded',
                  el?.classList.contains('expanded') ? 'true' : 'false',
                )
              }}
              aria-expanded="false"
            >
              {t('financing.section.advancedInputs')}
            </button>
          </h2>
          <div className="advanced-fields">
            {/* Annual Additional Repayment */}
            <div className="form-field">
              <label htmlFor="annualAdditionalRepayment">
                {t('financing.annualAdditionalRepaymentLabel')}
              </label>
              <Controller
                name="annualAdditionalRepaymentCents"
                control={control}
                render={({ field }) => (
                  <div className="form-field__input-group">
                    <input
                      {...field}
                      type="text"
                      id="annualAdditionalRepayment"
                      inputMode="numeric"
                      value={field.value ? formatEuroInput(field.value) : ''}
                      onChange={(e) => handleEuroChange(e, 'annualAdditionalRepaymentCents')}
                      placeholder="0"
                      className="rate-input"
                    />
                    <span className="form-field__currency" aria-hidden="true">
                      €
                    </span>
                  </div>
                )}
              />
            </div>

            {/* Annual Additional Repayment Month */}
            <div className="form-field">
              <label htmlFor="annualAdditionalRepaymentMonth">
                {t('financing.annualAdditionalRepaymentMonthLabel')}
              </label>
              <Controller
                name="annualAdditionalRepaymentMonth"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    id="annualAdditionalRepaymentMonth"
                    value={field.value || '12'}
                    className="rate-input"
                    onChange={(e) => handleMonthChange(e, 'annualAdditionalRepaymentMonth')}
                  >
                    {[...Array.from({ length: 12 })].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {t(`financing.month.${i + 1}`)}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            {/* One-time Additional Repayments - using useFieldArray */}
            <div className="form-field">
              <label>{t('financing.oneTimeAdditionalRepaymentsLabel')}</label>
              <div className="repeating-fields">
                {oneTimeFields.map((field, index) => (
                  <div key={field.id} className="repeating-fields__row">
                    <div className="form-field__input-group">
                      <label htmlFor={`oneTimeMonth-${index}`} className="visually-hidden">
                        {t('financing.oneTimeMonthLabel')}
                      </label>
                      <Controller
                        name={`oneTimeAdditionalRepayments.${index}.paymentMonth`}
                        control={control}
                        render={({ field: fieldProps }) => (
                          <input
                            {...fieldProps}
                            type="number"
                            id={`oneTimeMonth-${index}`}
                            inputMode="numeric"
                            value={fieldProps.value}
                            onChange={(e) => fieldProps.onChange(parseInt(e.target.value, 10) || 1)}
                            min="1"
                            max="1200"
                            className="rate-input"
                            placeholder={t('financing.oneTimeMonthPlaceholder')}
                          />
                        )}
                      />
                      <span className="form-field__currency" aria-hidden="true">
                        {t('financing.monthSuffix')}
                      </span>
                    </div>
                    <div className="form-field__input-group">
                      <label htmlFor={`oneTimeAmount-${index}`} className="visually-hidden">
                        {t('financing.oneTimeAmountLabel')}
                      </label>
                      <Controller
                        name={`oneTimeAdditionalRepayments.${index}.amountCents`}
                        control={control}
                        render={({ field: fieldProps }) => (
                          <input
                            {...fieldProps}
                            type="text"
                            id={`oneTimeAmount-${index}`}
                            inputMode="numeric"
                            value={fieldProps.value ? formatEuroInput(fieldProps.value) : ''}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/[^\d]/g, '')
                              const cents = digits ? Math.round(parseFloat(digits) * 100) : 0
                              fieldProps.onChange(cents)
                            }}
                            className="rate-input"
                            placeholder={t('financing.oneTimeAmountPlaceholder')}
                          />
                        )}
                      />
                      <span className="form-field__currency" aria-hidden="true">
                        €
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn--ghost btn--small btn--danger"
                      onClick={() => removeOneTime(index)}
                      aria-label={t('financing.removeOneTimeRepayment')}
                    >
                      {t('common.remove')}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn--secondary btn--small"
                  onClick={() => appendOneTime({ paymentMonth: 12, amountCents: 0 })}
                >
                  {t('financing.addOneTimeRepayment')}
                </button>
              </div>
            </div>

            {/* Refinancing Scenarios - using useFieldArray */}
            <div className="form-field">
              <label>{t('financing.refinancingScenariosLabel')}</label>
              <div className="repeating-fields">
                {refinancingFields.map((field, index) => (
                  <div key={field.id} className="repeating-fields__row">
                    <div className="form-field__input-group">
                      <label htmlFor={`refiId-${index}`} className="visually-hidden">
                        {t('financing.refinancingIdLabel')}
                      </label>
                      <Controller
                        name={`refinancingScenarios.${index}.id`}
                        control={control}
                        render={({ field: fieldProps }) => (
                          <input
                            {...fieldProps}
                            type="text"
                            id={`refiId-${index}`}
                            value={fieldProps.value}
                            onChange={(e) => fieldProps.onChange(e.target.value)}
                            className="rate-input"
                            placeholder={t('financing.refinancingIdPlaceholder')}
                          />
                        )}
                      />
                    </div>
                    <div className="form-field__input-group">
                      <label htmlFor={`refiRate-${index}`} className="visually-hidden">
                        {t('financing.refinancingNominalRateLabel')}
                      </label>
                      <Controller
                        name={`refinancingScenarios.${index}.nominalAnnualRate`}
                        control={control}
                        render={({ field: fieldProps }) => (
                          <input
                            {...fieldProps}
                            type="text"
                            id={`refiRate-${index}`}
                            inputMode="decimal"
                            value={fieldProps.value || ''}
                            onChange={(e) => fieldProps.onChange(e.target.value)}
                            className="rate-input"
                            placeholder={t('financing.refinancingNominalRatePlaceholder')}
                          />
                        )}
                      />
                      <span className="form-field__currency" aria-hidden="true">
                        %
                      </span>
                    </div>
                    <div className="form-field__input-group">
                      <label htmlFor={`refiRepayment-${index}`} className="visually-hidden">
                        {t('financing.refinancingRepaymentRateLabel')}
                      </label>
                      <Controller
                        name={`refinancingScenarios.${index}.initialRepaymentRate`}
                        control={control}
                        render={({ field: fieldProps }) => (
                          <input
                            {...fieldProps}
                            type="text"
                            id={`refiRepayment-${index}`}
                            inputMode="decimal"
                            value={fieldProps.value || ''}
                            onChange={(e) => fieldProps.onChange(e.target.value)}
                            className="rate-input"
                            placeholder={t('financing.refinancingRepaymentRatePlaceholder')}
                          />
                        )}
                      />
                      <span className="form-field__currency" aria-hidden="true">
                        %
                      </span>
                    </div>
                    <Controller
                      name={`refinancingScenarios.${index}.fullRepaymentTermMonths`}
                      control={control}
                      render={({ field: fieldProps }) => (
                        <>
                          {fieldProps.value !== undefined && (
                            <div className="form-field__input-group">
                              <label htmlFor={`refiTerm-${index}`} className="visually-hidden">
                                {t('financing.refinancingFullTermLabel')}
                              </label>
                              <input
                                {...fieldProps}
                                type="number"
                                id={`refiTerm-${index}`}
                                inputMode="numeric"
                                value={fieldProps.value}
                                onChange={(e) =>
                                  fieldProps.onChange(
                                    e.target.value ? parseInt(e.target.value, 10) : undefined,
                                  )
                                }
                                min="1"
                                max="1200"
                                className="rate-input"
                                placeholder={t('financing.refinancingFullTermPlaceholder')}
                              />
                              <span className="form-field__currency" aria-hidden="true">
                                {t('financing.monthSuffix')}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    />
                    <button
                      type="button"
                      className="btn btn--ghost btn--small btn--danger"
                      onClick={() => removeRefinancing(index)}
                      aria-label={t('financing.removeRefinancingScenario')}
                    >
                      {t('common.remove')}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn--secondary btn--small"
                  onClick={() =>
                    appendRefinancing({
                      id: `scenario-${Date.now()}`,
                      nominalAnnualRate: '0.04',
                      initialRepaymentRate: '0.02',
                    })
                  }
                >
                  {t('financing.addRefinancingScenario')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="results-section" aria-live="polite">
          <h2>{t('financing.section.results')}</h2>

          {hasErrors && (
            <div className="result-card error" role="alert">
              <h3>{t('financing.errors.calculationFailed')}</h3>
              <p>{result?.error?.message}</p>
              <p className="error-detail">
                {t('financing.errors.field')}: {result?.error?.field} | {t('financing.errors.code')}
                : {result?.error?.code}
              </p>
            </div>
          )}

          {!isAvailable && !hasErrors && (
            <div className="result-card info" role="status">
              <p>{t('financing.results.enterDataToCalculate')}</p>
            </div>
          )}

          {isAvailable && availableResult && (
            <>
              <div className="result-grid">
                <article className="result-card">
                  <h3>{t('financing.results.loanAmount')}</h3>
                  <p className="result-value">
                    {formatEuroInput(availableResult.loanAmountCents)} €
                  </p>
                  <p className="result-detail">
                    {t('financing.results.financingRatio')}:{' '}
                    {(availableResult.purchasePriceFinancingRatio.toNumber?.() * 100 || 0).toFixed(
                      2,
                    )}
                    %
                    <span className="origin-badge">
                      {t(`financing.classification.${availableResult.financingClassification}`)}
                    </span>
                  </p>
                </article>

                <article className="result-card">
                  <h3>{t('financing.results.requiredEquity')}</h3>
                  <p className="result-value">
                    {formatEuroInput(availableResult.requiredEquityCents)} €
                  </p>
                  <p className="result-detail">
                    {t('financing.results.downPaymentPlusCosts')}
                    <span className="origin-badge">
                      {availableResult.fundingStatus === 'funded'
                        ? t('financing.funded')
                        : t('financing.underfunded')}
                    </span>
                  </p>
                </article>

                <article className="result-card">
                  <h3>{t('financing.results.cashGap')}</h3>
                  <p className="result-value">{formatEuroInput(availableResult.cashGapCents)} €</p>
                  <p className="result-detail">
                    {availableResult.cashGapCents > 0
                      ? t('financing.results.needsAdditionalFunds')
                      : t('financing.results.sufficientFunds')}
                  </p>
                </article>

                <article className="result-card">
                  <h3>{t('financing.results.cashRemaining')}</h3>
                  <p className="result-value">
                    {formatEuroInput(availableResult.cashRemainingCents)} €
                  </p>
                  <p className="result-detail">{t('financing.results.availableAfterPurchase')}</p>
                </article>

                <article className="result-card">
                  <h3>{t('financing.results.downPayment')}</h3>
                  <p className="result-value">
                    {formatEuroInput(availableResult.downPaymentCents)} €
                  </p>
                  <p className="result-detail">{t('financing.results.userSelectedOrCalculated')}</p>
                </article>

                <article className="result-card">
                  <h3>{t('financing.results.financedAcquisitionCosts')}</h3>
                  <p className="result-value">
                    {formatEuroInput(availableResult.financedAcquisitionCostsCents)} €
                  </p>
                  <p className="result-detail">{t('financing.results.shareOfTransactionCosts')}</p>
                </article>
              </div>

              <div className="result-card metadata">
                <h4>{t('financing.results.assumptions')}</h4>
                <dl>
                  <dt>{t('financing.results.assumptionSetVersion')}</dt>
                  <dd>{availableResult.acquisition.appliedAssumptions.assumptionSetVersion}</dd>
                  <dt>{t('financing.results.transferTaxRateSourceDate')}</dt>
                  <dd>
                    {availableResult.acquisition.appliedAssumptions.transferTaxRateSourceDate}
                  </dd>
                </dl>
              </div>
            </>
          )}
        </section>

        {/* Next Steps */}
        {isAvailable && availableResult && (
          <section className="next-steps">
            <h3>{t('financing.section.nextSteps')}</h3>
            <p>{t('financing.nextSteps.message')}</p>
            <nav className="next-steps__links">
              <Link to="/comparison" className="next-steps__link primary">
                {t('financing.nextSteps.compareScenarios')}
              </Link>
            </nav>
          </section>
        )}
      </form>
    </PageLayout>
  )
}
