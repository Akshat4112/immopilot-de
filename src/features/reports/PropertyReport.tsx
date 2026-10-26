import type { ReactNode } from 'react'

import assumptionSet from '../../../data/assumptions/de-2026.09.json'
import type { ScenarioAnalysisDraft } from '../../config/scenarioDrafts'
import { resources, type SupportedLanguage } from '../../i18n/resources'
import { ReportAmortizationSection } from './ReportAmortization'
import { ReportTable } from './ReportTable'
import { formatCapturedInput, reportFormat, reportText, type ReportLabel } from './reportCopy'
import type { ReportProperty, ReportSnapshot, ReportValue } from './reportSnapshot'
import './reports.css'

const analysisLabels: Record<keyof Omit<ScenarioAnalysisDraft, 'propertyUse'>, ReportLabel> = {
  refinancingInitialRepaymentRate: 'Future initial repayment',
  refinancingLowerRate: 'Lower',
  refinancingBaseRate: 'Base',
  refinancingHigherRate: 'Higher',
  currentComparableRent: 'Current comparable rent',
  monthlyOwnerCosts: 'Monthly owner costs',
  ownerAnalysisYears: 'Owner analysis years',
  ownerRentGrowthRate: 'Rent growth',
  ownerCostGrowthRate: 'Owner-cost growth',
  propertyAppreciationRate: 'Property appreciation',
  alternativeReturnRate: 'Alternative investment return',
  ownerSellingCostRate: 'Selling-cost rate',
  monthlyNetColdRent: 'Net cold rent',
  vacancyRate: 'Vacancy',
  otherAnnualRentLoss: 'Other annual rent losses',
  monthlyNonRecoverableHausgeld: 'Non-recoverable Hausgeld excluding reserves',
  monthlyReserveContribution: 'Monthly reserve contribution',
  annualMaintenanceAllowance: 'Maintenance outside Hausgeld',
  otherAnnualOwnerCosts: 'Other annual owner costs',
  rentalRentGrowthRate: 'Rent growth',
  rentalOwnerCostGrowthRate: 'Owner-cost growth',
  rentalHoldingYears: 'Holding years',
  rentalPropertyAppreciationRate: 'Property appreciation',
  rentalSellingCostRate: 'Selling-cost rate',
  maximumMonthlyPayment: 'Maximum monthly payment',
  targetGrossYield: 'Target gross yield',
  targetNetYield: 'Target net yield',
  livingAreaSquareMetres: 'Living area (m²)',
  askingPrice: 'Asking price',
  proposedOffer: 'Proposed offer',
  comparablePricePerSquareMetreLow: 'Comparable price low (EUR/m²)',
  comparablePricePerSquareMetreHigh: 'Comparable price high (EUR/m²)',
  openingOfferLargerDiscount: 'Larger opening discount',
  openingOfferSmallerDiscount: 'Smaller opening discount',
}
const reasons: Record<string, ReportLabel> = {
  ZERO_REQUIRED_EQUITY: 'Cash-on-cash return is undefined when required equity is zero.',
  PRICE_SEARCH_LIMIT_EXCEEDED: 'The configured price exceeds the supported price-search range.',
  FINANCING_SCHEDULE_MISMATCH: 'The schedules and financing assumptions are incompatible.',
  COMPARISON_ASSUMPTIONS_MISMATCH: 'The schedules and financing assumptions are incompatible.',
  RENTAL_METRICS_MISSING: 'Rental results are required for this price method.',
  RENTAL_METRICS_UNAVAILABLE: 'Rental results are required for this price method.',
  AMORTIZATION_SCHEDULE_UNAVAILABLE: 'The requested repayment schedule is unavailable.',
  FIXED_PERIOD_UNAVAILABLE: 'The requested repayment schedule is unavailable.',
  INCOMPLETE_MORTGAGE_SCHEDULE: 'The supported repayment horizon is exceeded.',
  FUTURE_PAYMENT_NOT_AMORTIZING: 'The loan does not amortize with these payments.',
  'missing-inputs': 'Required inputs are missing.',
  'not-requested': 'Not requested',
  POST_PURCHASE_BUDGET_NOT_CONFIRMED: 'Confirm renovation and moving/setup budgets.',
  UNDERFUNDED_SCENARIO: 'Equity does not cover the required funding.',
  UNDERFUNDED_FIXED_COSTS: 'Equity does not cover the required funding.',
  CASH_PURCHASE: 'Cash purchase: no mortgage payments or repayment charts apply.',
  PAID_OFF: 'The loan is already repaid.',
  SCHEDULE_LIMIT_EXCEEDED: 'The supported repayment horizon is exceeded.',
  NON_AMORTIZING_LOAN: 'The loan does not amortize with these payments.',
  NEGATIVE_AMORTIZATION: 'The loan does not amortize with these payments.',
  ADDITIONAL_REPAYMENT_SCHEDULE_UNAVAILABLE: 'The requested repayment schedule is unavailable.',
  BASELINE_SCHEDULE_UNAVAILABLE: 'The requested repayment schedule is unavailable.',
  AMORTIZATION_UNAVAILABLE: 'The requested repayment schedule is unavailable.',
  VALIDATION_ERROR: 'Invalid input',
}

function Metrics({ rows }: { rows: readonly (readonly [string, ReactNode])[] }) {
  return (
    <dl className="report-metrics">
      {rows.map(([label, value], index) => (
        <div key={index}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Status({
  result,
  language,
}: {
  result: { status: string; reason?: string; missing?: readonly string[] }
  language: SupportedLanguage
}) {
  const t = reportText(language)
  const status =
    result.status === 'not-requested' ||
    (result.status === 'not-configured' && result.reason === 'not-requested')
      ? 'Not requested'
      : result.status === 'not-applicable'
        ? 'Not applicable'
        : 'Unavailable'
  return (
    <p className="report-warning">
      {t(status)} ·{' '}
      {t(
        result.reason && reasons[result.reason]
          ? reasons[result.reason]!
          : 'Check the inputs for this section.',
      )}
      {result.missing?.length
        ? ` (${result.missing.map((field) => t(analysisLabels[field as keyof typeof analysisLabels] ?? 'Required inputs are missing.')).join(', ')})`
        : ''}
    </p>
  )
}

function Inputs({ property, language }: { property: ReportProperty; language: SupportedLanguage }) {
  const t = reportText(language)
  const f = reportFormat(language)
  const { purchaseCosts: purchase, financing, analysis } = property.inputs
  const input = (value: string, kind: 'money' | 'rate' | 'number', canonical = false) =>
    formatCapturedInput(value, kind, canonical ? 'canonical' : property.inputLocale, language)
  const labels = {
    availableEquity: 'Available equity',
    downPayment: 'Down payment',
    financedAcquisitionCostShare: 'Financed acquisition-cost share',
    nominalAnnualRate: 'Nominal interest rate',
    initialRepaymentRate: 'Initial repayment rate',
    fixedInterestYears: 'Fixed interest (years)',
  } as const
  const rows: [string, string][] = [
    [t('Purchase price'), input(purchase.purchasePrice, 'money')],
    [t('Federal state'), purchase.stateId],
    [t('Broker involved'), t(purchase.brokerInvolved ? 'Yes' : 'No')],
    [
      t('Financing mode'),
      t(
        financing.mode === 'selected-down-payment'
          ? 'Selected down payment'
          : 'Use available equity',
      ),
    ],
  ]
  for (const [key, label] of Object.entries(labels)) {
    const value = financing[key as keyof typeof labels]
    if (value !== undefined)
      rows.push([
        t(label),
        input(
          value,
          key === 'fixedInterestYears'
            ? 'number'
            : key.endsWith('Rate') || key.endsWith('Share')
              ? 'rate'
              : 'money',
        ),
      ])
  }
  const budgetLabels = {
    'not-budgeted': 'Not budgeted',
    'confirmed-zero': 'Confirmed zero',
    budgeted: 'Budgeted',
  } as const
  for (const [label, budget] of [
    ['Renovation budget', purchase.renovationBudget],
    ['Moving/setup budget', purchase.movingSetupCosts],
  ] as const)
    rows.push([
      t(label),
      budget
        ? `${f.money(budget.amountCents)} · ${t(budgetLabels[budget.budgetStatus])}`
        : t('Not provided'),
    ])
  const plan = financing.additionalRepayments
  rows.push(
    [t('Annual additional repayment'), input(plan.annualAdditionalRepayment, 'money')],
    [t('Annual repayment month'), input(plan.annualAdditionalRepaymentMonth, 'number')],
  )
  for (const [index, entry] of plan.oneTimeAdditionalRepayments.entries())
    rows.push([
      `${t('One-time repayment')} ${f.number(index + 1)}`,
      `${input(entry.amount, 'money')} · ${t('Loan month')} ${input(entry.month, 'number')}`,
    ])
  for (const [key, value] of Object.entries(analysis)) {
    if (key === 'propertyUse') continue
    const kind =
      key.endsWith('Years') || key === 'livingAreaSquareMetres'
        ? 'number'
        : key.endsWith('Rate') ||
            key.startsWith('target') ||
            key.startsWith('refinancing') ||
            key.startsWith('openingOffer')
          ? 'rate'
          : 'money'
    rows.push([
      t(analysisLabels[key as keyof typeof analysisLabels]),
      input(value, kind, kind === 'money'),
    ])
  }
  const applied = property.provenance.appliedAcquisitionAssumptions
  if (applied) {
    const rateLabels = {
      transferTaxRate: 'Property-transfer tax rate',
      notaryRate: 'Notary rate',
      landRegisterRate: 'Land-register rate',
      buyerBrokerRate: 'Buyer broker rate',
    } as const
    for (const key of Object.keys(rateLabels) as (keyof typeof rateLabels)[]) {
      if (key === 'buyerBrokerRate' && !purchase.brokerInvolved) continue
      const item = applied[key]
      rows.push([
        t(rateLabels[key]),
        `${f.rate(item.value)} · ${t(item.origin === 'user-override' ? 'User override' : item.origin === 'state-lookup' ? 'State lookup' : 'Assumption default')}`,
      ])
    }
  }
  return (
    <ReportTable
      caption={t('Inputs and assumptions')}
      headers={[t('Input'), t('Value')]}
      rows={rows}
    />
  )
}

function Acquisition({
  property,
  language,
}: {
  property: ReportProperty
  language: SupportedLanguage
}) {
  const t = reportText(language)
  const f = reportFormat(language)
  const result = property.results.acquisition
  if (!('purchasePriceCents' in result)) return <Status result={result} language={language} />
  const state = assumptionSet.transferTax.states.find((item) => item.id === result.stateId)
  const rows: [string, ReactNode][] = [
    [t('Purchase price'), f.money(result.purchasePriceCents)],
    [t('Federal state'), (language === 'de' ? state?.nameDe : state?.nameEn) ?? result.stateId],
    [t('Broker involved'), t(result.brokerInvolved ? 'Yes' : 'No')],
    [t('Property-transfer tax'), f.money(result.transferTaxCents)],
    [t('Notary'), f.money(result.notaryCostsCents)],
    [t('Land register'), f.money(result.landRegisterCostsCents)],
    [t('Buyer broker commission'), f.money(result.buyerBrokerCommissionCents)],
    [t('Transaction costs'), f.money(result.transactionAcquisitionCostsCents)],
  ]
  if (result.status === 'available')
    rows.push([t('Total project cost'), f.money(result.totalProjectCostCents)])
  return (
    <>
      <Metrics rows={rows} />
      {result.status !== 'available' ? <Status result={result} language={language} /> : null}
    </>
  )
}

function Financing({
  property,
  language,
}: {
  property: ReportProperty
  language: SupportedLanguage
}) {
  const t = reportText(language)
  const f = reportFormat(language)
  const { financing: result, payment, fixedPeriod } = property.results
  if (result.status !== 'available') return <Status result={result} language={language} />
  return (
    <>
      <Metrics
        rows={[
          [t('Available equity'), f.money(result.availableEquityCents)],
          [t('Required equity'), f.money(result.requiredEquityCents)],
          [t('Down payment'), f.money(result.downPaymentCents)],
          [t('Financed acquisition costs'), f.money(result.financedAcquisitionCostsCents)],
          [t('Loan amount'), f.money(result.loanAmountCents)],
          [t('Funding shortfall'), f.money(result.cashGapCents)],
          [
            t('Fixed-interest months'),
            property.results.amortization.status === 'available'
              ? property.results.amortization.cashPurchase
                ? t('Not applicable')
                : f.number(property.results.amortization.fixedInterestMonths)
              : t('Unavailable'),
          ],
        ]}
      />
      <p>
        {t(
          result.fundingStatus === 'funded'
            ? 'Funding covered'
            : 'Equity does not cover the required funding.',
        )}
      </p>
      {payment.status === 'available' ? (
        payment.cashPurchase ? (
          <p>{t('Cash purchase: no mortgage payments or repayment charts apply.')}</p>
        ) : (
          <Metrics
            rows={[
              [t('Nominal interest rate'), f.rate(payment.nominalAnnualRate)],
              [
                t('Initial repayment rate'),
                payment.initialRepaymentRate === null
                  ? t('Not applicable')
                  : f.rate(payment.initialRepaymentRate),
              ],
              [t('Monthly payment'), f.money(payment.monthlyPaymentCents)],
            ]}
          />
        )
      ) : (
        <Status result={payment} language={language} />
      )}
      {fixedPeriod.status === 'available' ? (
        <Metrics rows={[[t('Remaining debt'), f.money(fixedPeriod.remainingDebtCents)]]} />
      ) : (
        <Status result={fixedPeriod} language={language} />
      )}
    </>
  )
}

function Repayment({
  property,
  language,
}: {
  property: ReportProperty
  language: SupportedLanguage
}) {
  const t = reportText(language)
  const f = reportFormat(language)
  const result = property.results.additionalRepaymentComparison
  const plan = property.inputs.financing.additionalRepayments
  const requestedRows: [string, string][] = [
    [
      t('Annual additional repayment'),
      formatCapturedInput(plan.annualAdditionalRepayment, 'money', property.inputLocale, language),
    ],
    [
      t('Annual repayment month'),
      formatCapturedInput(
        plan.annualAdditionalRepaymentMonth,
        'number',
        property.inputLocale,
        language,
      ),
    ],
    ...plan.oneTimeAdditionalRepayments.map(
      (entry, index) =>
        [
          `${t('One-time repayment')} ${f.number(index + 1)}`,
          `${formatCapturedInput(entry.amount, 'money', property.inputLocale, language)} · ${t('Loan month')} ${formatCapturedInput(entry.month, 'number', property.inputLocale, language)}`,
        ] as [string, string],
    ),
  ]
  const requested = (
    <ReportTable
      caption={t('Requested additional repayments')}
      headers={[t('Input'), t('Value')]}
      rows={requestedRows}
    />
  )
  if (result.status !== 'available')
    return (
      <>
        {requested}
        <Status result={result} language={language} />
      </>
    )
  if (result.cashPurchase)
    return <p>{t('Cash purchase: no mortgage payments or repayment charts apply.')}</p>
  return (
    <>
      {requested}
      <p>{t('Requested payments may be capped at the outstanding principal.')}</p>
      <Metrics
        rows={[
          [
            t('Actual additional principal through fixed interest'),
            f.money(result.withAdditionalRepayments.additionalPrincipalThroughFixedPeriodCents),
          ],
          [
            t('Interest saved through fixed interest'),
            f.money(result.interestSavedThroughFixedPeriodCents),
          ],
          [
            t('Debt reduction at fixed-interest end'),
            f.money(result.remainingDebtReductionAtFixedPeriodCents),
          ],
          [
            t('Projected lifetime interest saved'),
            f.money(result.projectedLifetimeInterestSavedCents),
          ],
          [
            t('Projected actual additional principal'),
            f.money(result.withAdditionalRepayments.projectedLifetimeAdditionalPrincipalCents),
          ],
          [t('Baseline payoff month'), f.number(result.baseline.payoffMonth)],
          [t('Selected payoff month'), f.number(result.withAdditionalRepayments.payoffMonth)],
          [t('Projected time saved (months)'), f.number(result.timeSavedMonths)],
        ]}
      />
    </>
  )
}

function Refinancing({
  property,
  language,
}: {
  property: ReportProperty
  language: SupportedLanguage
}) {
  const t = reportText(language)
  const f = reportFormat(language)
  const result = property.results.refinancing
  if (result.status !== 'available') return <Status result={result} language={language} />
  const names: Record<string, ReportLabel> = { lower: 'Lower', base: 'Base', higher: 'Higher' }
  return (
    <>
      <p>{t('Scenarios, not lender quotes.')}</p>
      <Metrics
        rows={[
          [t('Remaining debt'), f.money(result.remainingDebtCents)],
          [t('Fixed-interest months'), f.number(result.fixedInterestMonths)],
        ]}
      />
      <ReportTable
        caption={t('Refinancing stress')}
        headers={[
          t('Schedule'),
          t('Future interest'),
          t('Future initial repayment'),
          t('Future monthly payment'),
          t('Payment change'),
        ]}
        rows={result.scenarios.map((row) => [
          t(names[row.id] ?? 'Base'),
          f.rate(row.futureNominalAnnualRate),
          row.futureInitialRepaymentRate === null
            ? t('Not applicable')
            : f.rate(row.futureInitialRepaymentRate),
          f.money(row.futureMonthlyPaymentCents),
          f.money(row.monthlyPaymentChangeCents),
        ])}
      />
    </>
  )
}

/** Disclose rate extrapolation only when an included repayment schedule actually extends past fixation. */
function hasPostFixedProjection(property: ReportProperty): boolean {
  const { amortization, selectedAmortization, selectedAmortizationBasis } = property.results
  const schedules = [
    amortization,
    ...(selectedAmortizationBasis === 'additional-repayments' ? [selectedAmortization] : []),
  ]
  return schedules.some(
    (schedule) =>
      schedule.status === 'available' &&
      !schedule.cashPurchase &&
      schedule.payoffMonth > schedule.fixedInterestMonths,
  )
}

function Decision({
  property,
  language,
}: {
  property: ReportProperty
  language: SupportedLanguage
}) {
  const t = reportText(language)
  const f = reportFormat(language)
  const mode = property.results.modeSpecific
  if (mode.result.status !== 'available') return <Status result={mode.result} language={language} />
  if (mode.mode === 'owner-occupier' && mode.result.status === 'available') {
    const result = mode.result
    const last = result.atAnalysisMonth
    return (
      <>
        <p>
          {t(
            'Matched budget including actual additional repayments; principal is counted in equity, not deducted twice.',
          )}
        </p>
        <Metrics
          rows={[
            [t('Analysis horizon (months)'), f.number(result.analysisMonths)],
            [t('Buyer net wealth'), f.money(last.buyerNetWealthCents)],
            [t('Renter net wealth'), f.money(last.renterNetWealthCents)],
            [t('Buyer minus renter'), f.money(last.buyerMinusRenterCents)],
            [
              t('Break-even month'),
              result.breakEven.status === 'reached'
                ? f.number(result.breakEven.firstMonth)
                : t('Not reached within the analysis horizon'),
            ],
            [t('Property value'), f.money(last.projectedPropertyValueCents)],
            [t('Selling costs'), f.money(last.hypotheticalSellingCostsCents)],
            [t('Remaining debt'), f.money(last.remainingMortgageDebtCents)],
            [t('Buyer monthly housing outflow'), f.money(last.buyerHousingOutflowCents)],
            [t('Renter monthly housing outflow'), f.money(last.renterHousingOutflowCents)],
            [t('Buyer alternative portfolio'), f.money(last.buyerAlternativePortfolioCents)],
            [t('Renter alternative portfolio'), f.money(last.renterAlternativePortfolioCents)],
          ]}
        />
        {hasPostFixedProjection(property) ? (
          <p>
          {t(
            'Projection beyond the fixed-interest period assumes the initial nominal rate remains unchanged. Payoff timing is not a contractual term.',
          )}
        </p>
        ) : null}
      </>
    )
  }
  if (mode.mode !== 'rental-investment' || mode.result.status !== 'available') return null
  const result = mode.result
  return (
    <>
      <p>
        {t(
          'Reserves are cash contributions, not economic expenses. Personal taxes and tax savings are not modeled.',
        )}
      </p>
      <Metrics
        rows={[
          [t('Analysis horizon (months)'), f.number(result.holdingPeriodMonths)],
          [t('Gross rental yield'), f.rate(result.grossRentalYield)],
          [t('Annual net cold rent'), f.money(result.grossYieldBasis.numeratorCents)],
          [t('Purchase-price denominator'), f.money(result.grossYieldBasis.denominatorCents)],
          [t('Net rental yield'), f.rate(result.netRentalYield)],
          [t('Net operating income'), f.money(result.netYieldBasis.numeratorCents)],
          [t('Investment cost denominator'), f.money(result.netYieldBasis.denominatorCents)],
          [
            t('First-month pre-tax cash flow after additional repayments'),
            f.money(result.firstMonth.preTaxCashFlowAfterExtraCents),
          ],
          [
            t('First-year pre-tax cash flow before additional repayments'),
            f.money(result.firstYearPreTaxCashFlowBeforeExtraCents),
          ],
          [
            t('First-year pre-tax cash flow after additional repayments'),
            f.money(result.firstYearPreTaxCashFlowAfterExtraCents),
          ],
          [
            t('Cash-on-cash return before additional repayments'),
            result.cashOnCash.status === 'available' ? (
              f.rate(result.cashOnCash.annualBeforeExtraReturn)
            ) : (
              <Status result={result.cashOnCash} language={language} />
            ),
          ],
          [t('Annual numerator'), f.money(result.cashOnCash.numeratorCents)],
          [t('Required equity'), f.money(result.cashOnCash.denominatorCents)],
          [
            t('Cumulative pre-tax cash flow'),
            f.money(result.cumulativeCashFlowAfterHoldingPeriodCents),
          ],
          [
            t('Debt reduction over holding period'),
            f.money(result.debtReductionAfterHoldingPeriodCents),
          ],
          [t('Remaining debt'), f.money(result.remainingDebtAfterHoldingPeriodCents)],
        ]}
      />
      {result.sale.status === 'available' ? (
        <Metrics
          rows={[
            [t('Property value'), f.money(result.sale.projectedSalePriceCents)],
            [t('Selling costs'), f.money(result.sale.sellingCostsCents)],
            [t('Net sale proceeds'), f.money(result.sale.netSaleProceedsCents)],
            [t('Estimated profit before tax'), f.money(result.sale.estimatedProfitBeforeTaxCents)],
          ]}
        />
      ) : (
        <Status result={result.sale} language={language} />
      )}
      {hasPostFixedProjection(property) ? (
          <p>
        {t(
          'Projection beyond the fixed-interest period assumes the initial nominal rate remains unchanged. Payoff timing is not a contractual term.',
        )}
      </p>
        ) : null}
    </>
  )
}

function Offer({ property, language }: { property: ReportProperty; language: SupportedLanguage }) {
  const t = reportText(language)
  const f = reportFormat(language)
  const result = property.results.offerPrice
  if (result.status !== 'available') return <Status result={result} language={language} />
  return (
    <>
      <p>{t('No valuation or recommended purchase price is implied.')}</p>
      <Metrics
        rows={[
          ...(
            [
              ['Gross-yield price ceiling', result.grossYieldCeiling],
              ['Net-yield price ceiling', result.netYieldCeiling],
              ['Affordability price ceiling', result.affordabilityCeiling],
            ] as const
          ).map(
            ([label, item]) =>
              [
                t(label),
                item.status === 'available' ? (
                  f.money(item.priceCeilingCents)
                ) : (
                  <Status result={item} language={language} />
                ),
              ] as const,
          ),
        ]}
      />
      {result.comparableOffer.status === 'available' ? (
        <Metrics
          rows={[
            [
              t('Comparable value range'),
              `${f.money(result.comparableOffer.comparableValueLowCents)} – ${f.money(result.comparableOffer.comparableValueHighCents)}`,
            ],
            [t('Asking price'), f.money(result.comparableOffer.askingPriceCents)],
            [t('Proposed offer'), f.money(result.comparableOffer.purchaseOfferCents)],
            [
              t('Opening-offer range'),
              result.comparableOffer.openingOffer.status === 'available'
                ? `${f.money(result.comparableOffer.openingOffer.lowCents)} – ${f.money(result.comparableOffer.openingOffer.highCents)}`
                : t('Not requested'),
            ],
          ]}
        />
      ) : (
        <Status result={result.comparableOffer} language={language} />
      )}
    </>
  )
}

/** Standalone presentational document. Preview/print hosts own capture and export authorization. */
export function PropertyReport({ snapshot }: { snapshot: ReportValue<ReportSnapshot> }) {
  const language = snapshot.language
  const t = reportText(language)
  const property = snapshot.properties[0]
  if (snapshot.kind !== 'property' || snapshot.properties.length !== 1 || !property)
    return <p>{t('Correct the required inputs before creating a report.')}</p>
  return <ReportPropertyDocument snapshot={snapshot} property={property} />
}

/** Reuses every property section without changing or rebuilding the captured comparison. */
export function ReportPropertyDocument({
  snapshot,
  property,
}: {
  snapshot: ReportValue<ReportSnapshot>
  property: ReportProperty
}) {
  const language = snapshot.language
  const t = reportText(language)
  const label = `${language === 'de' ? 'Objekt' : 'Property'} ${property.ordinal}`
  const identity = property.name ? `${label} · ${property.name}` : label
  const comparison = snapshot.kind === 'comparison'
  const section = (title: ReportLabel, content: ReactNode) => (
    <section className="report-section">
      <h3>{t(title)}</h3>
      {content}
    </section>
  )
  return (
    <article
      className="property-report"
      lang={language}
      aria-label={comparison ? identity : t('Property report')}
    >
      <header className="report-header">
        <p className="report-brand">ImmoPilot DE · EUR</p>
        <h2>{comparison ? identity : t('Property report')}</h2>
        <p>
          {comparison ? label : (property.name ?? t('Property 1'))} ·{' '}
          {t(
            property.inputs.analysis.propertyUse === 'owner-occupier'
              ? 'Owner-occupier'
              : 'Rental investment',
          )}
        </p>
        <p>
          <strong>{t(property.status === 'complete' ? 'Complete' : 'Incomplete')}</strong> ·{' '}
          {t('Generated')}:{' '}
          <time dateTime={snapshot.generatedAt}>
            {new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-GB', {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'UTC',
            }).format(new Date(snapshot.generatedAt))}{' '}
            UTC
          </time>
        </p>
      </header>
      {property.status === 'incomplete' ? (
        <p className="report-warning">
          {t('Some results are missing or unavailable. Review the marked sections.')}
        </p>
      ) : null}
      <p>{resources[language].translation.footer.disclaimer}</p>
      <Metrics
        rows={[
          [
            t('Repayment basis'),
            t(
              property.results.amortization.status === 'available' &&
                property.results.amortization.cashPurchase
                ? 'Not applicable'
                : property.results.selectedAmortizationBasis === 'baseline'
                  ? 'Baseline'
                  : property.results.selectedAmortizationBasis === 'additional-repayments'
                    ? 'With additional repayments'
                    : 'Unavailable',
            ),
          ],
        ]}
      />
      {section('Property and acquisition', <Acquisition property={property} language={language} />)}
      {section('Financing', <Financing property={property} language={language} />)}
      {section(
        'Repayment and additional principal',
        <Repayment property={property} language={language} />,
      )}
      {section(
        'Amortization',
        <ReportAmortizationSection property={property} language={language} />,
      )}
      {section('Refinancing stress', <Refinancing property={property} language={language} />)}
      {section(
        property.inputs.analysis.propertyUse === 'owner-occupier'
          ? 'Rent versus buy'
          : 'Rental performance before tax',
        <Decision property={property} language={language} />,
      )}
      {section('Offer-price methods', <Offer property={property} language={language} />)}
      {section('Inputs and assumptions', <Inputs property={property} language={language} />)}
      {section(
        'Methodology and sources',
        <>
          <Metrics
            rows={[
              [t('Contract version'), snapshot.contractVersion],
              [t('Input schema'), property.schemaVersion],
              [t('Source schema'), property.sourceSchemaVersion],
              [t('Input locale'), property.inputLocale],
              [t('Assumption set'), snapshot.calculationMetadata.assumptionSetVersion],
              [t('Assumption schema'), property.provenance.assumptionSchemaVersion],
              [t('Assumptions verified on'), snapshot.calculationMetadata.assumptionSetVerifiedOn],
              [t('Transfer-tax source date'), property.provenance.transferTaxRateSourceDate],
              [t('State tax rate effective from'), property.provenance.stateTaxEffectiveFrom],
              [
                t('Calculation specification'),
                snapshot.calculationMetadata.calculationSpecificationVersion,
              ],
              [t('Effective from'), property.provenance.assumptionEffectiveFrom],
              [
                t('Build identity'),
                snapshot.buildIdentity.status === 'available'
                  ? `${snapshot.buildIdentity.commit}${snapshot.buildIdentity.workingTreeDirty ? ` · ${t('Uncommitted changes')}` : ''}`
                  : t('Unavailable'),
              ],
            ]}
          />
          <p>
            {t('Sources retain their recorded verification dates; generation does not renew them.')}
          </p>
          <p>
            {t('Acquisition cost defaults are planning estimates unless explicitly statutory; user overrides have not been independently verified.')}
          </p>
          <p>
            {t('Fixed-interest results and projected lifetime or payoff results use different calculation horizons; projections are not lender commitments.')}
          </p>
          <ul className="report-sources">
            {property.provenance.sources.map((source) => (
              <li key={source.id}>
                <a href={source.url}>{source.title}</a>
                <br />
                <span>{source.url}</span> · {source.publisher} · {t('Source date')}:{' '}
                {source.sourceDate ?? t('Not provided')} · {t('Verified on')}: {source.verifiedOn}
              </li>
            ))}
          </ul>
          <h4>{t('Financial notice')}</h4>
          <p>{resources[language].translation.footer.disclaimer}</p>
          <h4>{t('Privacy warning')}</h4>
          <p>
            {t(
              'This report can reveal your property plans and financial circumstances. Review its contents before printing, saving or sharing. Generation happens in your browser; the application does not upload the report. Files and printouts may be accessible to other device users, backups, synchronization services or recipients. Deleting a saved scenario does not delete those copies.',
            )}
          </p>
        </>,
      )}
      {snapshot.options.includeMonthlyAppendix
        ? section(
            'Monthly appendix',
            <ReportAmortizationSection property={property} language={language} monthly />,
          )
        : null}
    </article>
  )
}
