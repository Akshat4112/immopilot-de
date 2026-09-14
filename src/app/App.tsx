import { Navigate, Route, Routes } from 'react-router-dom'

import { FeaturePlaceholderPage } from '../features/foundation/FeaturePlaceholderPage'
import { HomePage } from '../features/home/HomePage'
import { AppShell } from './AppShell'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="purchase-costs" element={<FeaturePlaceholderPage feature="purchaseCosts" />} />
        <Route path="financing" element={<FeaturePlaceholderPage feature="financing" />} />
        <Route path="comparison" element={<FeaturePlaceholderPage feature="comparison" />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Route>
    </Routes>
  )
}
