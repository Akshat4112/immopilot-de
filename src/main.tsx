import { useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Payroll2026Panel } from './components/Payroll2026Panel'
import './styles/tokens.css'
import './styles/global.css'
import './styles/shell.css'
import './styles/app.css'

// The original standalone planner stays as the canonical budgeting application.
// The validated PAP withholding checker is additive, not a replacement for cash flow.
const root = document.getElementById('root')
if (!root) throw new Error('Application root element was not found')

document.title = 'ImmoPilot DE · Household Wealth Planner'
const plannerUrl = `${import.meta.env.BASE_URL}wealth-planner.html`

function Planner() {
  const plannerFrame = useRef<HTMLIFrameElement>(null)

  return (
    <main style={{ margin: 0, padding: 0, width: '100%', height: '100dvh' }}>
      <iframe
        ref={plannerFrame}
        title="ImmoPilot Household Wealth Planner"
        src={plannerUrl}
        style={{ display: 'block', border: 0, width: '100%', height: '100%', minHeight: '100dvh' }}
      />
      <Payroll2026Panel plannerFrame={plannerFrame} />
    </main>
  )
}

createRoot(root).render(<Planner />)
