import { Navigate, Route, Routes } from 'react-router-dom'

import { FeaturePlaceholderPage } from '../features/foundation/FeaturePlaceholderPage'
import { FinancingPage } from '../features/financing'
import { HomePage } from '../features/home/HomePage'
import { PurchaseCostsPage } from '../features/purchase-costs/PurchaseCostsPage'
import { AppShell } from './AppShell'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="purchase-costs" element={<PurchaseCostsPage />} />
        <Route path="financing" element={<FinancingPage />} />
        <Route path="comparison" element={<FeaturePlaceholderPage feature="comparison" />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Route>
    </Routes>
  )
}
