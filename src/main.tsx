import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import './styles/shell.css'
import './styles/app.css'

// The v14 standalone planner is the canonical public application.
// The previous React feature modules are retained for a gradual migration.
const root = document.getElementById('root')
if (!root) throw new Error('Application root element was not found')

document.title = 'ImmoPilot DE · Household Wealth Planner'
const plannerUrl = `${import.meta.env.BASE_URL}wealth-planner.html`
createRoot(root).render(
  <main style={{ margin: 0, padding: 0, width: '100%', height: '100dvh' }}>
    <iframe
      title="ImmoPilot Household Wealth Planner"
      src={plannerUrl}
      style={{ display: 'block', border: 0, width: '100%', height: '100%', minHeight: '100dvh' }}
    />
  </main>,
)
