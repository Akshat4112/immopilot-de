import { useState } from 'react'
import type { RefObject } from 'react'
import { payroll2026 } from '../domain/payroll2026'
import type { Payroll2026Request } from '../domain/payroll2026'

const defaultInput: Payroll2026Request = {
  monthlyGrossEuro: 100000 / 12,
  taxClass: 4,
  healthInsurance: 'pkv',
  gkvSupplementPercent: 2.9,
  childlessCareSurcharge: true,
  saxony: false,
  pkvBasicPremiumMonthlyEuro: 450,
  pkvEmployerSubsidyMonthlyEuro: 225,
  pensionInsured: true,
  unemploymentInsured: true,
  childAllowances: 0,
}

const fieldStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 12,
} as const

const inputStyle = {
  maxWidth: 145,
  padding: 8,
  border: '1px solid #b2c3d1',
  borderRadius: 6,
  background: '#fff',
  color: '#152a40',
} as const

function numberOrZero(value: string) {
  return Number(value) || 0
}

export function Payroll2026Panel({ plannerFrame }: { plannerFrame: RefObject<HTMLIFrameElement | null> }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState(defaultInput)
  const [error, setError] = useState('')
  const change = <K extends keyof Payroll2026Request>(key: K, value: Payroll2026Request[K]) =>
    setInput((prior) => ({ ...prior, [key]: value }))
  const syncFromPlanner = () => {
    const doc = plannerFrame.current?.contentDocument
    const gross = doc?.getElementById('grossH') as HTMLInputElement | null
    const insurance = doc?.getElementById('healthH') as HTMLSelectElement | null
    const payrollTaxClass = doc?.getElementById('taxClassH') as HTMLSelectElement | null
    const premium = doc?.getElementById('pkvH') as HTMLInputElement | null
    if (!gross) {
      setError('Open Household in the main planner first, then try again.')
      return
    }
    const grossAnnual = Number(gross.value)
    if (!Number.isFinite(grossAnnual)) {
      setError('Annual gross salary is not a valid number.')
      return
    }
    setInput((old) => ({
      ...old,
      monthlyGrossEuro: Math.round((grossAnnual / 12) * 100) / 100,
      healthInsurance: insurance?.value === 'gkv' ? 'gkv' : 'pkv',
      taxClass: (['I', 'II', 'III', 'IV', 'V', 'VI'].indexOf(payrollTaxClass?.value ?? '') + 1 || old.taxClass) as Payroll2026Request['taxClass'],
      pkvBasicPremiumMonthlyEuro: premium ? Number(premium.value) : old.pkvBasicPremiumMonthlyEuro,
    }))
    setError('')
  }
  let validationError = error
  let calculation: ReturnType<typeof payroll2026> | undefined
  try {
    calculation = payroll2026(input)
  } catch (caught) {
    validationError = caught instanceof Error ? caught.message : 'Calculation error'
  }
  const euro = (value: number) => new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR',
  }).format(value)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="pap-payroll-panel"
        style={{
          position: 'fixed', right: 16, bottom: 16, zIndex: 100,
          border: 0, borderRadius: 12, background: '#175c53',
          color: '#fff', padding: '13px 17px', cursor: 'pointer',
          boxShadow: '0 4px 18px #14362d55', fontWeight: 750,
        }}
      >
        {open ? 'Close payroll check' : '2026 Payroll check'}
      </button>
      {open && (
        <section
          id="pap-payroll-panel"
          aria-label="2026 BMF payroll check"
          style={{
            position: 'fixed', right: 12, bottom: 75, zIndex: 100,
            width: 'min(440px, calc(100vw - 24px))',
            maxHeight: 'min(76dvh, 740px)', overflowY: 'auto',
            padding: 20, borderRadius: 14, background: '#fff',
            color: '#152a40', boxShadow: '0 8px 36px #0004',
            fontFamily: 'system-ui, sans-serif', fontSize: 14,
          }}
        >
          <h2 style={{ marginTop: 0 }}>2026 monthly Lohnsteuer</h2>
          <p style={{ fontSize: 12, lineHeight: 1.6 }}>
            PAP-2026 calculation using a third-party MIT-licensed translation of the BMF algorithm.
            This is <strong>payroll withholding, not final annual income tax</strong>.
            Social-insurance deductions and your actual net salary are handled separately.
          </p>
          <button type="button" onClick={syncFromPlanner} style={{ ...inputStyle, maxWidth: '100%', cursor: 'pointer', marginBottom: 16 }}>
            Read salary from Household planner
          </button>
          <label style={fieldStyle}>Monthly taxable gross (€)
            <input aria-label="Monthly taxable gross" type="number" min="0" step="0.01" style={inputStyle}
              value={input.monthlyGrossEuro} onChange={(e) => change('monthlyGrossEuro', numberOrZero(e.target.value))} />
          </label>
          <label style={fieldStyle}>Tax class
            <select aria-label="Tax class" style={inputStyle} value={input.taxClass}
              onChange={(e) => change('taxClass', Number(e.target.value) as Payroll2026Request['taxClass'])}>
              {[1, 2, 3, 4, 5, 6].map((i) => <option value={i} key={i}>{i}</option>)}
            </select>
          </label>
          <label style={fieldStyle}>Health insurance
            <select aria-label="Health insurance" style={inputStyle} value={input.healthInsurance}
              onChange={(e) => change('healthInsurance', e.target.value as Payroll2026Request['healthInsurance'])}>
              <option value="gkv">GKV</option><option value="pkv">PKV</option>
            </select>
          </label>
          {input.healthInsurance === 'gkv' ? (
            <label style={fieldStyle}>Full GKV Zusatzbeitrag (%)
              <input type="number" style={inputStyle} min="0" max="10" step="0.01" value={input.gkvSupplementPercent}
                onChange={(e) => change('gkvSupplementPercent', numberOrZero(e.target.value))} />
            </label>
          ) : (
            <>
              <label style={fieldStyle}>PKV eligible monthly premium (€)
                <input type="number" style={inputStyle} min="0" step="0.01" value={input.pkvBasicPremiumMonthlyEuro}
                  onChange={(e) => change('pkvBasicPremiumMonthlyEuro', numberOrZero(e.target.value))} />
              </label>
              <label style={fieldStyle}>PKV employer subsidy (€)
                <input type="number" style={inputStyle} min="0" step="0.01" value={input.pkvEmployerSubsidyMonthlyEuro}
                  onChange={(e) => change('pkvEmployerSubsidyMonthlyEuro', numberOrZero(e.target.value))} />
              </label>
            </>
          )}
          <label style={fieldStyle}>Care insurance
            <select style={inputStyle} value={input.childlessCareSurcharge ? 'childless' : 'no-surcharge'}
              onChange={(e) => change('childlessCareSurcharge', e.target.value === 'childless')}>
              <option value="childless">Childless surcharge</option><option value="no-surcharge">No surcharge</option>
            </select>
          </label>
          <label style={fieldStyle}>Saxony
            <input type="checkbox" checked={input.saxony}
              onChange={(e) => change('saxony', e.target.checked)} />
          </label>
          <label style={fieldStyle}>Pension insured
            <input type="checkbox" checked={input.pensionInsured}
              onChange={(e) => change('pensionInsured', e.target.checked)} />
          </label>
          <label style={fieldStyle}>Unemployment insured
            <input type="checkbox" checked={input.unemploymentInsured}
              onChange={(e) => change('unemploymentInsured', e.target.checked)} />
          </label>
          <label style={fieldStyle}>Child allowances (ZKF)
            <input type="number" min="0" step="0.5" style={inputStyle} value={input.childAllowances}
              onChange={(e) => change('childAllowances', numberOrZero(e.target.value))} />
          </label>
          {validationError && <p role="alert" style={{ color: '#a23a3a' }}>{validationError}</p>}
          {calculation && (
            <div aria-live="polite" style={{ background: '#f1f6f4', borderRadius: 10, padding: 14 }}>
              <p><strong>Monthly Lohnsteuer:</strong> {euro(calculation.wageTaxEuro)}</p>
              <p><strong>Monthly Solidaritätszuschlag:</strong> {euro(calculation.solidarityEuro)}</p>
              <p><strong>Church-tax assessment base:</strong> {euro(calculation.churchTaxBaseEuro)}</p>
              <p style={{ fontSize: 12 }}>Church tax payable depends on your federal state and church membership.
                This tool does not replace the existing planner tax estimate or infer a tax refund.</p>
            </div>
          )}
          <p style={{ fontSize: 12, lineHeight: 1.5 }}>
            Source: <a href="https://www.bundesfinanzministerium.de/Content/DE/Downloads/Steuern/Steuerarten/Lohnsteuer/Programmablaufplan/2025-11-12-PAP-2026.html" target="_blank" rel="noreferrer">BMF 2026 PAP</a>.
            Results remain subject to payroll-specific details, including bonuses and allowances.
          </p>
        </section>
      )}
    </>
  )
}
