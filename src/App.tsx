import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Stock from './pages/Stock'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Wholesalers from './pages/Wholesalers'
import WholesalerDetail from './pages/WholesalerDetail'
import Sales from './pages/Sales'
import Transactions from './pages/Transactions'
import Calendar from './pages/Calendar'
import Payments from './pages/Payments'
import PinGuard from './components/Security/PinGuard'
import { SecurityProvider, useSecurity } from './context/SecurityContext'
import './index.css'

function AppContent() {
  const { isUnlocked, unlock } = useSecurity()

  return (
    <>
      <PinGuard 
        isOpen={!isUnlocked}
        onClose={() => {}} // Prevent closing without PIN
        onSuccess={unlock}
        title="Güvenlik Kilidi"
        correctPin={import.meta.env.VITE_GLOBAL_PIN} // Use Global PIN (2023)
      />
      
      {/* Optional: We can hide the app content when locked if desired, 
          but PinGuard overlay usually covers it. 
          For extra security, we can blur or hide. */}
      <div style={{ filter: isUnlocked ? 'none' : 'blur(5px)', pointerEvents: isUnlocked ? 'auto' : 'none' }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="stock" element={<Stock />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="wholesalers" element={<Wholesalers />} />
              <Route path="wholesalers/:id" element={<WholesalerDetail />} />
              <Route path="sales" element={<Sales />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="payments" element={<Payments />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </div>
    </>
  )
}

function App() {
  return (
    <SecurityProvider>
      <AppContent />
    </SecurityProvider>
  )
}

export default App
