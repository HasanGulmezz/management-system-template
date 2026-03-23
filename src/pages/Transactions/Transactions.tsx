import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  History, TrendingUp, Search, Calendar, Info, Wallet
} from 'lucide-react'
import { useSales, usePayments } from '../../hooks'
import TransactionDetailsModal from '../../components/Modals/TransactionDetailsModal'
import './Transactions.css'

type TabType = 'all' | 'sales' | 'payments'

interface Transaction {
  id: string
  type: 'sale' | 'payment'
  name: string
  amount: number
  created_at: string
  link: string
  payment_type?: string // 'cash' | 'credit_card'
}

export default function Transactions() {
  const { sales, loading: salesLoading } = useSales()
  const { customerPayments, loading: paymentsLoading } = usePayments()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Details Modal State
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  
  // Note: For payments, we might not have a details modal yet, or we reuse one?
  // Current TransactionDetailsModal supports 'sale' and 'purchase'. 
  // We'll keep it simple for payments (maybe just no details or simple alert).
  const [selectedTransactionType, setSelectedTransactionType] = useState<'sale' | 'payment'>('sale')

  const loading = salesLoading || paymentsLoading

  // Combine transactions (Sales + Customer Payments)
  const allTransactions: Transaction[] = [
    ...sales.map(s => ({
      id: s.id,
      type: 'sale' as const,
      name: s.customer_name || 'Bilinmeyen Müşteri',
      amount: Number(s.total_amount),
      created_at: s.created_at,
      link: s.customer_id ? `/customers/${s.customer_id}` : '#'
    })),
    ...customerPayments.map(p => ({
      id: p.id,
      type: 'payment' as const,
      name: p.customer_name || 'Bilinmeyen Müşteri',
      amount: Number(p.amount),
      created_at: p.created_at,
      link: p.customer_id ? `/customers/${p.customer_id}` : '#',
      payment_type: p.payment_type
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Filter by tab
  const filteredTransactions = allTransactions.filter(t => {
    if (activeTab === 'sales') return t.type === 'sale'
    if (activeTab === 'payments') return t.type === 'payment'
    return true
  }).filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="transactions-page animate-slideUp">
      <header className="page-header">
        <h1 className="page-title">İşlem Geçmişi</h1>
      </header>

      {/* Tabs & Search */}
      <div className="filters-row card">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tümü
          </button>
          <button 
            className={`tab ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            <TrendingUp size={16} />
            Satışlar
          </button>
          <button 
            className={`tab ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <Wallet size={16} />
            Tahsilatlar
          </button>
        </div>
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Müşteri adı ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="transactions-list">
        {loading ? (
          <div className="loading-container card">
            <div className="spinner"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state card">
            <History size={48} className="empty-state-icon" />
            <p className="empty-state-title">Henüz işlem yok</p>
          </div>
        ) : (
          filteredTransactions.map(transaction => (
            <div key={`${transaction.type}-${transaction.id}`} className="transaction-card-wrapper">
              <Link 
                to={transaction.link}
                className={`transaction-card ${transaction.type}`}
                onClick={e => transaction.link === '#' && e.preventDefault()}
              >
                <div className="transaction-icon">
                  {transaction.type === 'sale' ? (
                    <TrendingUp size={20} />
                  ) : (
                    <Wallet size={20} />
                  )}
                </div>
                <div className="transaction-info">
                  <span className="transaction-name">{transaction.name}</span>
                  <span className="transaction-date">
                    <Calendar size={12} />
                    {new Date(transaction.created_at).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="transaction-amount">
                  <span className={`amount ${transaction.type}`}>
                    {transaction.type === 'sale' ? '+' : '-'}
                    ₺{transaction.amount.toLocaleString()}
                  </span>
                  <span className="transaction-type-label">
                    {transaction.type === 'sale' ? 'Satış' : 'Tahsilat'}
                  </span>
                </div>
              </Link>
              <button 
                className="btn-icon-soft info-btn"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSelectedTransactionId(transaction.id)
                  setSelectedTransactionType(transaction.type)
                }}
                title="Detaylar"
              >
                <Info size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransactionId && (
        <TransactionDetailsModal
          transactionId={selectedTransactionId}
          type={selectedTransactionType}
          onClose={() => setSelectedTransactionId(null)}
        />
      )}
    </div>
  )
}
