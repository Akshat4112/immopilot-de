import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import i18n from '../../i18n/config'
import { resources } from '../../i18n/resources'
import {
  createSavedScenario,
  SCENARIO_LIBRARY_STORAGE_KEY,
  writeScenarioLibrary,
} from '../../storage'
import { reportInputs } from '../../test/reportFixtures'
import { ComparisonPage } from '../comparison/ComparisonPage'
import { comparisonMetricIds } from '../comparison/comparisonCalculations'
import { comparisonMetricGroups } from '../comparison/comparisonMetricGroups'
import { ComparisonReport } from './ComparisonReport'
import { ComparisonReportPreview } from './ComparisonReportPreview'
import { captureComparisonReport } from './reportSnapshot'

function fixtures() {
  const owner = createSavedScenario('Private owner address', reportInputs(), {
    id: 'private-owner',
  })
  owner.inputs.financing.additionalRepayments.annualAdditionalRepayment = '5000'
  const rental = createSavedScenario('Private rental address', reportInputs(), {
    id: 'private-rental',
    locale: 'en-GB',
  })
  Object.assign(rental.inputs.purchaseCosts, { purchasePrice: '275,000.50' })
  Object.assign(rental.inputs.financing, {
    availableEquity: '90,000',
    downPayment: '55,000',
    fixedInterestYears: '15',
  })
  Object.assign(rental.inputs.analysis, {
    propertyUse: 'rental-investment',
    monthlyNetColdRent: '600',
    monthlyNonRecoverableHausgeld: '150',
    monthlyReserveContribution: '50',
    annualMaintenanceAllowance: '1200',
    rentalHoldingYears: '7',
    rentalPropertyAppreciationRate: '2',
    rentalSellingCostRate: '3',
    targetGrossYield: '4.5',
    targetNetYield: '3.5',
  })
  const cash = createSavedScenario('Private cash address', reportInputs(), { id: 'private-cash' })
  Object.assign(cash.inputs.purchaseCosts, { purchasePrice: '300000' })
  Object.assign(cash.inputs.financing, { downPayment: '300000', availableEquity: '350000' })
  cash.inputs.analysis.currentComparableRent = ''
  const excluded = createSavedScenario('UNSELECTED SECRET', reportInputs(), { id: 'excluded-id' })
  excluded.inputs.purchaseCosts.purchasePrice = '987654'
  return [owner, rental, cash, excluded]
}

function snapshot(
  documents = fixtures(),
  selectedIds = documents.slice(0, 3).map((item) => item.id),
  language: 'de' | 'en' = 'en',
  monthly = false,
  names = false,
) {
  const result = captureComparisonReport(
    { documents, selectedIds },
    {
      language,
      generatedAt: '2026-10-25T10:15:00Z',
      includeMonthlyAppendix: monthly,
      includeScenarioNames: names,
    },
  )
  if (result.status !== 'captured') throw new Error(`Fixture blocked: ${result.issue}`)
  return result.snapshot
}

beforeEach(async () => {
  localStorage.clear()
  await i18n.changeLanguage('de')
})

describe('comparison report contract', () => {
  it.each(['de', 'en'] as const)(
    'preserves all groups, metrics, order and heterogeneous bases in %s',
    (language) => {
      const documents = fixtures()
      const before = JSON.stringify(documents)
      const capture = snapshot(
        documents,
        ['private-rental', 'private-owner', 'private-cash'],
        language,
      )
      const markup = renderToStaticMarkup(<ComparisonReport snapshot={capture} />)
      const root = new DOMParser().parseFromString(markup, 'text/html')
      const table = root.querySelector('.report-comparison-table')!
      const copy = resources[language].translation.comparison
      expect(comparisonMetricGroups.flatMap((group) => group.metrics)).toEqual(comparisonMetricIds)
      const metricLabels = [...table.querySelectorAll('tbody th[scope="row"]')].map(
        (cell) => cell.textContent,
      )
      expect(metricLabels).toHaveLength(22)
      comparisonMetricIds.forEach((metric, index) =>
        expect(metricLabels[index]).toContain(copy.metrics[metric]),
      )
      expect(
        [...table.querySelectorAll('th[scope="colgroup"]')].map((cell) => cell.textContent),
      ).toEqual(
        ['purchase', 'financing', 'repayment', 'performance', 'offer'].map(
          (group) => copy.groups[group as keyof typeof copy.groups],
        ),
      )
      const price = table.querySelector('tbody tr:nth-child(2)')!
      expect(price.textContent).toContain(language === 'de' ? '275.000,50' : '275,000.50')
      expect([...price.querySelectorAll('td')].map((cell) => cell.textContent)).toEqual(
        language === 'de'
          ? ['275.000,50 €', '250.000 €', '300.000 €']
          : ['€275,000.50', '€250,000', '€300,000'],
      )
      expect(table.textContent).toContain(language === 'de' ? '15 Jahren' : '15-year')
      expect(table.textContent).toContain(language === 'de' ? '10 Jahren' : '10-year')
      expect(table.textContent).toContain(copy.nonComparable.projectedReturn)
      expect(table.textContent).toContain(copy.nonComparable.remainingDebt)
      expect(table.textContent).toContain(
        language === 'de' ? 'Gewinn vor Steuern' : 'pre-tax profit',
      )
      expect(table.textContent).toContain(
        language === 'de' ? 'Vorteil ggü. Miete' : 'advantage over renting',
      )
      expect(table.textContent).toContain(copy.status.notApplicable)
      expect(table.textContent).toContain(copy.status.missingCount.replace('{{count}}', '1'))
      expect(table.textContent).toContain(
        language === 'de' ? '0 Jahre · 0 Monate' : '0 years · 0 months',
      )
      expect(root.querySelectorAll('.comparison-report > article')).toHaveLength(3)
      expect(root.querySelectorAll('svg')).toHaveLength(4)
      const sections = [...root.querySelectorAll('.comparison-report > article')]
      expect(sections.map((section) => section.getAttribute('aria-label'))).toEqual(
        language === 'de'
          ? ['Objekt 1', 'Objekt 2', 'Objekt 3']
          : ['Property 1', 'Property 2', 'Property 3'],
      )
      expect(sections[0]!.textContent).toContain('en-GB')
      expect(sections[1]!.textContent).toContain('de-DE')
      expect(sections[1]!.textContent).toContain(
        language === 'de' ? 'Monate 193–203 · Teiljahr' : 'Months 193–203 · Partial year',
      )
      for (const secret of [
        'Private owner address',
        'Private rental address',
        'Private cash address',
        'UNSELECTED SECRET',
        'private-owner',
        'private-rental',
        'private-cash',
        'excluded-id',
        '987654',
      ])
        expect(markup).not.toContain(secret)
      expect(root.querySelector('button, input, select')).toBeNull()
      const ids = [...root.querySelectorAll('[id]')].map((element) => element.id)
      expect(new Set(ids).size).toBe(ids.length)
      const landmarks = [...root.querySelectorAll('[role="region"]')].map((element) =>
        element.getAttribute('aria-label'),
      )
      expect(new Set(landmarks).size).toBe(landmarks.length)
      expect(JSON.stringify(documents)).toBe(before)
    },
  )

  it('retains one-property comparison layout, zero values and optional complete monthly detail for each property', () => {
    const documents = fixtures().slice(0, 3)
    for (const document of documents) {
      Object.assign(document.inputs.financing, {
        nominalAnnualRate: '0',
        initialRepaymentRate: '100',
        additionalRepayments: {
          annualAdditionalRepayment: '',
          annualAdditionalRepaymentMonth: '12',
          oneTimeAdditionalRepayments: [],
        },
      })
    }
    const single = new DOMParser().parseFromString(
      renderToStaticMarkup(<ComparisonReport snapshot={snapshot(documents, [documents[0]!.id])} />),
      'text/html',
    )
    expect(single.querySelectorAll('.report-comparison-table thead th')).toHaveLength(2)
    expect(single.querySelectorAll('.comparison-report > article')).toHaveLength(1)
    const root = new DOMParser().parseFromString(
      renderToStaticMarkup(
        <ComparisonReport
          snapshot={snapshot(
            documents,
            documents.map((item) => item.id),
            'en',
            true,
          )}
        />,
      ),
      'text/html',
    )
    const detail = [...root.querySelectorAll('.comparison-report > article')]
    expect(detail).toHaveLength(3)
    for (const section of detail.slice(0, 2)) {
      const monthly = [...section.querySelectorAll('table')].find(
        (table) => table.caption?.textContent === 'Monthly appendix · Baseline · EUR',
      )!
      expect(monthly.querySelectorAll('tbody tr')).toHaveLength(12)
      expect(monthly.querySelector('tbody tr:last-child')!.textContent).toContain('Payoff')
    }
  })

  it('marks an invalid selected plan unavailable while retaining only a labelled baseline reference', () => {
    const documents = fixtures()
    documents[0]!.inputs.financing.additionalRepayments.oneTimeAdditionalRepayments = [
      { amount: '1000', month: '' },
    ]
    const capture = snapshot(documents, ['private-owner'])
    render(<ComparisonReport snapshot={capture} />)
    const summary = screen.getByRole('table', { name: 'Comparison summary · EUR' })
    const saving = within(summary).getByRole('row', { name: /^Interest saved during/ })
    expect(saving).toHaveTextContent('Cannot be calculated')
    expect(saving).toHaveTextContent('Check financing and additional-repayment inputs')
    expect(within(saving).queryByText('€0')).toBeNull()
    expect(
      screen.getByText('Baseline reference only: the requested repayment plan is unavailable.'),
    ).toBeVisible()
    expect(capture.status).toBe('incomplete')
  })

  it('renders opt-in names only as escaped text and keeps the anonymous ordinal', () => {
    const documents = fixtures()
    documents[0]!.name = '<img src=x onerror=alert(1)>'
    const root = new DOMParser().parseFromString(
      renderToStaticMarkup(
        <ComparisonReport snapshot={snapshot(documents, ['private-owner'], 'en', false, true)} />,
      ),
      'text/html',
    )
    expect(root.querySelector('img')).toBeNull()
    expect(root.querySelector('thead')!.textContent).toContain('<img src=x onerror=alert(1)>')
    expect(root.querySelector('.comparison-report > article')!.getAttribute('aria-label')).toBe(
      'Property 1 · <img src=x onerror=alert(1)>',
    )
  })

  it('keeps the captured language independent from later interface changes and rejects non-comparison input', async () => {
    const capture = snapshot(fixtures(), ['private-owner'], 'en')
    await i18n.changeLanguage('de')
    render(<ComparisonReport snapshot={capture} />)
    expect(screen.getByRole('article', { name: 'Property comparison' })).toHaveAttribute(
      'lang',
      'en',
    )
    expect(screen.getByRole('table', { name: 'Comparison summary · EUR' })).toHaveTextContent(
      'Purchase price',
    )
    const invalid = { ...capture, kind: 'property' as const }
    expect(renderToStaticMarkup(<ComparisonReport snapshot={invalid} />)).toContain(
      'Correct the required inputs',
    )
  })
})

describe('comparison capture lifecycle', () => {
  it('captures visible reordered selection, invalidates on removal/language changes and restores focus on close without writes', async () => {
    const documents = fixtures()
    writeScenarioLibrary(localStorage, documents)
    const before = JSON.stringify(localStorage)
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ComparisonPage />
      </MemoryRouter>,
    )
    await user.click(
      screen.getByRole('button', { name: 'Private rental address nach links verschieben' }),
    )
    await user.click(screen.getByRole('button', { name: 'Vergleichsbericht ansehen' }))
    let report = screen.getByRole('article', { name: 'Immobilienvergleich' })
    expect(
      within(report)
        .getByRole('table', { name: 'Vergleichsübersicht · EUR' })
        .querySelector('tbody td')!.textContent,
    ).toContain('275.000,50')
    expect(screen.getByRole('heading', { name: 'Berichtsvorschau' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Bericht schließen' }))
    expect(screen.queryByRole('article', { name: 'Immobilienvergleich' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Vergleichsbericht ansehen' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Vergleichsbericht ansehen' }))
    const column = screen
      .getAllByRole('columnheader')
      .find((cell) => cell.textContent?.includes('Private owner address'))!
    await user.click(within(column).getByRole('button', { name: 'Entfernen' }))
    expect(screen.queryByRole('article')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Vergleichsbericht ansehen' }))
    report = screen.getByRole('article', { name: 'Immobilienvergleich' })
    expect(report.querySelectorAll('.report-comparison-table thead th')).toHaveLength(2)
    await i18n.changeLanguage('en')
    expect(screen.queryByRole('article')).toBeNull()
    expect(JSON.stringify(localStorage)).toBe(before)
  })

  it.each(['missing', 'changed', 'corrupted', 'unsupported', 'denied'] as const)(
    'blocks %s saved data at the actual capture boundary',
    async (kind) => {
      const documents = fixtures()
      writeScenarioLibrary(localStorage, documents)
      render(
        <ComparisonReportPreview
          selectedIds={['private-owner', 'private-rental']}
          scenarios={documents}
          language="en"
        />,
      )
      let restore = () => {}
      if (kind === 'missing') writeScenarioLibrary(localStorage, documents.slice(1))
      if (kind === 'changed') {
        const changed = structuredClone(documents)
        changed[0]!.inputs.purchaseCosts.purchasePrice = '300000'
        writeScenarioLibrary(localStorage, changed)
      }
      if (kind === 'corrupted') localStorage.setItem(SCENARIO_LIBRARY_STORAGE_KEY, '{broken')
      if (kind === 'unsupported')
        localStorage.setItem(
          SCENARIO_LIBRARY_STORAGE_KEY,
          JSON.stringify({ schemaVersion: '99.0.0', scenarios: documents }),
        )
      if (kind === 'denied') {
        const spy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
          throw new Error('denied')
        })
        restore = () => spy.mockRestore()
      }
      const user = userEvent.setup()
      try {
        await user.click(screen.getByRole('button', { name: 'View comparison report' }))
        expect(screen.getByRole('alert')).toHaveTextContent('Reload the comparison')
        expect(screen.queryByRole('article')).toBeNull()
      } finally {
        restore()
      }
    },
  )

  it('clears snapshots after option, storage and window-focus events and shows incomplete input errors', async () => {
    const documents = fixtures()
    writeScenarioLibrary(localStorage, documents)
    const user = userEvent.setup()
    render(
      <ComparisonReportPreview
        selectedIds={['private-owner']}
        scenarios={documents}
        language="en"
      />,
    )
    const trigger = screen.getByRole('button', { name: 'View comparison report' })
    await user.click(trigger)
    await user.selectOptions(screen.getByRole('combobox'), 'de')
    expect(screen.queryByRole('article')).toBeNull()
    await user.click(trigger)
    await user.click(screen.getByRole('checkbox'))
    expect(screen.queryByRole('article')).toBeNull()
    await user.click(trigger)
    fireEvent(window, new StorageEvent('storage', { key: SCENARIO_LIBRARY_STORAGE_KEY }))
    expect(screen.queryByRole('article')).toBeNull()
    await user.click(trigger)
    fireEvent.focus(window)
    expect(screen.queryByRole('article')).toBeNull()
    documents[0]!.inputs.purchaseCosts.purchasePrice = ''
    writeScenarioLibrary(localStorage, documents)
    await user.click(trigger)
    expect(screen.getByRole('alert')).toHaveTextContent('Correct the required inputs')
  })
})
