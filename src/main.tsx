import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { BrowserRouter } from 'react-router-dom'
import App from './app/App.tsx'
import i18n from './i18n/config.ts'
import './styles/tokens.css'
import './styles/global.css'
import './styles/app.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Application root element was not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </I18nextProvider>
  </StrictMode>,
)
