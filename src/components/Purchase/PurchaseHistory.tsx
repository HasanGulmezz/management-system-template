import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Truck, Search, Info, TrendingDown, Calendar 
} from 'lucide-react'
import { usePurchases } from '../../hooks'
import TransactionDetailsModal from '../../components/Modals/TransactionDetailsModal'
import './PurchaseHistory.css'

export default function PurchaseHistory() {
  const { purchases, loading } = usePurchases()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)

  // Filter purchases by wholesaler name OR product name
  const filteredPurchases = purchases.filter(p => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    
    // Search in wholesaler name
    if (p.wholesaler_name.toLowerCase().includes(query)) return true
    
    // Search in product names
    if (p.product_names.some(name => name.toLowerCase().includes(query))) return true
    
    return false
  })

  return (
    <div className="purchase-history">
      {/* Filters */}
      <div className="purchases-filters card">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Toptancı veya ürün adı ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Purchases Table */}
      <div className="card">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="purchases-list">
            {filteredPurchases.length === 0 ? (
              <div className="empty-state">
                <Truck size={48} className="empty-state-icon" />
                <p className="empty-state-title">Henüz alış yapılmamış</p>
                <p>Yeni alış ekleyerek başlayın</p>
              </div>
            ) : (
              filteredPurchases.map(purchase => (
                <div key={purchase.id} className="purchase-card-wrapper">
                  <Link 
                    to={`/wholesalers/${purchase.wholesaler_id}`}
                    className="purchase-card"
                  >
                    <div className="purchase-icon">
                      <TrendingDown size={20} />
                    </div>
                    <div className="purchase-info">
                      <span className="purchase-wholesaler">{purchase.wholesaler_name}</span>
                      <span className="purchase-date">
                        <Calendar size={12} />
                        {new Date(purchase.created_at).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="purchase-amount-wrapper">
                      <span className="purchase-amount">
                        -₺{Number(purchase.total_amount).toLocaleString()}
                      </span>
                      <span className="purchase-item-count">
                        {purchase.item_count} ürün
                      </span>
                    </div>
                  </Link>
                  <button 
                    className="btn-icon-soft info-btn"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSelectedTransactionId(purchase.id)
                    }}
                    title="Detaylar"
                  >
                    <Info size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransactionId && (
        <TransactionDetailsModal
          transactionId={selectedTransactionId}
          type="purchase"
          onClose={() => setSelectedTransactionId(null)}
          initialSearchQuery={searchQuery}
        />
      )}
    </div>
  )
}
