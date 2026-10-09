import { Navigate, Route, Routes } from 'react-router-dom'

import { FeaturePlaceholderPage } from '../features/foundation/FeaturePlaceholderPage'
import { HomePage } from '../features/home/HomePage'
import { PurchaseCostsPage } from '../features/purchase-costs/PurchaseCostsPage'
import { FinancingPage } from '../features/financing/FinancingPage'
import { ComparisonPage } from '../features/comparison'
import { PrivacyPage } from '../features/privacy'
import { ResultsPage } from '../features/results'
import { ScenariosPage } from '../features/scenarios'
import { AppShell } from './AppShell'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="purchase-costs" element={<PurchaseCostsPage />} />
        <Route path="financing" element={<FinancingPage />} />
        <Route path="results" element={<ResultsPage />} />
        <Route path="scenarios" element={<ScenariosPage />} />
        <Route path="comparison" element={<ComparisonPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Route>
    </Routes>
  )
}