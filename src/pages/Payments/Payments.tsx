import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PinGuard from '../../components/Security/PinGuard'
import { 
  Wallet, TrendingUp, TrendingDown, Search, Calendar,
  Users, Truck, AlertTriangle, ShoppingCart
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { usePayments, CUSTOMER_PAYMENT_TYPES, WHOLESALER_PAYMENT_TYPES } from '../../hooks'
import './Payments.css'

type TabType = 'customers' | 'wholesalers' | 'debts'
type DebtFilterType = 'all' | 'customer' | 'wholesaler'

interface DebtInfo {
  id: string
  name: string
  debt: number
  type: 'customer' | 'wholesaler'
}

interface SalesStats {
  today: number
  month: number
  year: number
}

export default function Payments() {
  const { 
    customerPayments, 
    wholesalerPayments, 
    loading,
    fetchDebts
  } = usePayments()
  
  const [activeTab, setActiveTab] = useState<TabType>('debts')
  const [searchQuery, setSearchQuery] = useState('')
  const [debts, setDebts] = useState<DebtInfo[]>([])
  const [debtsLoading, setDebtsLoading] = useState(true)
  const [debtFilter, setDebtFilter] = useState<DebtFilterType>('all')
  const [isVerified, setIsVerified] = useState(false)
  const [salesStats, setSalesStats] = useState<SalesStats>({ today: 0, month: 0, year: 0 })
  const navigate = useNavigate()
  // Fetch all debts once (High Performance)
  useEffect(() => {
    const loadData = async () => {
      setDebtsLoading(true)
      
      // Fetch debts and sales stats in parallel
      const [debtsResult, salesResult] = await Promise.all([
        fetchDebts(),
        supabase.rpc('get_dashboard_stats')
      ])
      
      // Map debts
      const mappedDebts = debtsResult.map((d: any) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        debt: Number(d.total_debt)
      }))
      setDebts(mappedDebts)

      // Map sales stats
      if (salesResult.data) {
        setSalesStats({
          today: salesResult.data.today_sales || 0,
          month: salesResult.data.month_sales || 0,
          year: salesResult.data.year_sales || 0
        })
      }

      setDebtsLoading(false)
    }

    loadData()
  }, [fetchDebts])

  // Filter payments
  const filteredPayments = activeTab === 'customers' 
    ? customerPayments.filter(p => 
        p.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeTab === 'wholesalers'
    ? wholesalerPayments.filter(p => 
        p.wholesaler_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  // Filter debts by search and type
  const filteredDebts = debts.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (debtFilter === 'all' || d.type === debtFilter)
  )

  // Get payment type label
  const getPaymentTypeLabel = (type: string) => {
    const allTypes = [...CUSTOMER_PAYMENT_TYPES, ...WHOLESALER_PAYMENT_TYPES]
    return allTypes.find(t => t.value === type)?.label || type
  }

  // Stats
  const totalCustomerPayments = customerPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalWholesalerPayments = wholesalerPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalCustomerDebt = debts.filter(d => d.type === 'customer').reduce((sum, d) => sum + d.debt, 0)
  const totalWholesalerDebt = debts.filter(d => d.type === 'wholesaler').reduce((sum, d) => sum + d.debt, 0)

  if (!isVerified) {
    return (
      <PinGuard
        isOpen={true}
        onClose={() => navigate('/')}
        onSuccess={() => setIsVerified(true)}
        title="Güvenlik Doğrulaması"
        autoCloseOnSuccess={false}
      />
    )
  }

  return (
    <div className="payments-page animate-slideUp">
      <header className="page-header">
        <h1 className="page-title">Tahsilat</h1>
      </header>

      {/* Sales Stats Grid */}
      <div className="grid grid-cols-3 sales-stats-grid">
        <div className="card stat-card">
          <div className="stat-icon info">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">₺{salesStats.today.toLocaleString()}</span>
            <span className="stat-label">Bugünkü Satış</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon accent">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">₺{salesStats.month.toLocaleString()}</span>
            <span className="stat-label">Bu Ayki Satış</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon info-alt">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">₺{salesStats.year.toLocaleString()}</span>
            <span className="stat-label">Yıllık Satış</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="payment-stats four-cols">
        <div className="payment-stat-card debt">
          <AlertTriangle size={24} />
          <div className="stat-info">
            <span className="stat-label">Müşteri Borçları</span>
            <span className="stat-value">₺{totalCustomerDebt.toLocaleString()}</span>
          </div>
        </div>
        <div className="payment-stat-card debt-out">
          <AlertTriangle size={24} />
          <div className="stat-info">
            <span className="stat-label">Toptancı Borçları</span>
            <span className="stat-value">₺{totalWholesalerDebt.toLocaleString()}</span>
          </div>
        </div>
        <div className="payment-stat-card incoming">
          <TrendingUp size={24} />
          <div className="stat-info">
            <span className="stat-label">Müşterilerden Alınan</span>
            <span className="stat-value">₺{totalCustomerPayments.toLocaleString()}</span>
          </div>
        </div>
        <div className="payment-stat-card outgoing">
          <TrendingDown size={24} />
          <div className="stat-info">
            <span className="stat-label">Firmalara Ödenen</span>
            <span className="stat-value">₺{totalWholesalerPayments.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="filters-row card">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'debts' ? 'active' : ''}`}
            onClick={() => setActiveTab('debts')}
          >
            <AlertTriangle size={16} />
            Borçlar
          </button>
          <button 
            className={`tab ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <Users size={16} />
            Müşteri Tahsilatları
          </button>
          <button 
            className={`tab ${activeTab === 'wholesalers' ? 'active' : ''}`}
            onClick={() => setActiveTab('wholesalers')}
          >
            <Truck size={16} />
            Toptancı Ödemeleri
          </button>
        </div>
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="İsim ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content based on tab */}
      {activeTab === 'debts' ? (
        // Debts List
        <div className="debts-list">
          {/* Debt Type Filter Segments */}
          <div className="debt-filter-segments">
            <button 
              className={`segment-btn ${debtFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDebtFilter('all')}
            >
              Tümü
            </button>
            <button 
              className={`segment-btn ${debtFilter === 'customer' ? 'active' : ''}`}
              onClick={() => setDebtFilter('customer')}
            >
              <Users size={14} />
              Müşteriler
            </button>
            <button 
              className={`segment-btn ${debtFilter === 'wholesaler' ? 'active' : ''}`}
              onClick={() => setDebtFilter('wholesaler')}
            >
              <Truck size={14} />
              Toptancılar
            </button>
          </div>
          
          {debtsLoading || loading ? (
            <div className="loading-container card">
              <div className="spinner"></div>
            </div>
          ) : filteredDebts.length === 0 ? (
            <div className="empty-state card">
              <Wallet size={48} className="empty-state-icon" />
              <p className="empty-state-title">Borç yok!</p>
              <p>Tüm hesaplar temiz</p>
            </div>
          ) : (
            filteredDebts.map(debt => (
              <Link
                key={`${debt.type}-${debt.id}`}
                to={debt.type === 'customer' ? `/customers/${debt.id}` : `/wholesalers/${debt.id}`}
                className={`debt-card card ${debt.type}`}
              >
                <div className="debt-icon">
                  {debt.type === 'customer' ? <Users size={20} /> : <Truck size={20} />}
                </div>
                <div className="debt-info">
                  <span className="debt-name">{debt.name}</span>
                  <span className="debt-type-label">
                    {debt.type === 'customer' ? 'Müşteri' : 'Toptancı'}
                  </span>
                </div>
                <div className="debt-amount-section">
                  <span className="debt-amount">₺{debt.debt.toLocaleString()}</span>
                  <span className="debt-action">
                    {debt.type === 'customer' ? 'Tahsilat Al →' : 'Ödeme Yap →'}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      ) : (
        // Payments List
        <>
          <div className="info-banner">
            <Wallet size={18} />
            <span>
              {activeTab === 'customers' 
                ? 'Müşterilerden tahsilat almak için müşteri detay sayfasına gidin.'
                : 'Firmalara ödeme yapmak için firma detay sayfasına gidin.'}
            </span>
          </div>

          <div className="payments-list">
            {loading ? (
              <div className="loading-container card">
                <div className="spinner"></div>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="empty-state card">
                <Wallet size={48} className="empty-state-icon" />
                <p className="empty-state-title">Henüz tahsilat yok</p>
                <p>
                  {activeTab === 'customers' 
                    ? 'Müşteri detay sayfasından tahsilat alabilirsiniz'
                    : 'Toptancı detay sayfasından ödeme yapabilirsiniz'}
                </p>
              </div>
            ) : (
              filteredPayments.map(payment => (
                <Link
                  key={payment.id}
                  to={activeTab === 'customers' 
                    ? `/customers/${payment.customer_id}` 
                    : `/wholesalers/${payment.wholesaler_id}`}
                  className={`payment-card card ${activeTab}`}
                >
                  <div className="payment-icon">
                    {activeTab === 'customers' ? (
                      <TrendingUp size={20} />
                    ) : (
                      <TrendingDown size={20} />
                    )}
                  </div>
                  <div className="payment-info">
                    <span className="payment-name">
                      {activeTab === 'customers' ? payment.customer_name : payment.wholesaler_name}
                    </span>
                    <span className="payment-date">
                      <Calendar size={12} />
                      {new Date(payment.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="payment-details">
                    <span className={`payment-amount ${activeTab}`}>
                      {activeTab === 'customers' ? '+' : '-'}₺{Number(payment.amount).toLocaleString()}
                    </span>
                    <span className="payment-type">
                      {getPaymentTypeLabel(payment.payment_type)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
