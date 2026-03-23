import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PinGuard from '../../components/Security/PinGuard'
import { Truck, Search, Phone, Building, ChevronRight, Plus, History, List } from 'lucide-react'
import { useWholesalers, usePurchases } from '../../hooks'
import PurchaseHistory from '../../components/Purchase/PurchaseHistory'
import NewPurchase from '../../components/Purchase/NewPurchase'
import './Wholesalers.css'

type TabType = 'list' | 'history'

export default function Wholesalers() {
  const { wholesalers, loading } = useWholesalers()
  const { refetch } = usePurchases()
  
  const [activeTab, setActiveTab] = useState<TabType>('list')
  const [showNewPurchase, setShowNewPurchase] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  
  const navigate = useNavigate()

  const filteredWholesalers = wholesalers.filter(w => 
    w.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handlePurchaseSuccess = async () => {
    await refetch()
    setShowNewPurchase(false)
    setActiveTab('history') // Switch to history tab to show the new purchase
  }

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
    <div className="wholesalers-page animate-slideUp">
      <header className="page-header">
        <div>
          <h1 className="page-title">Firmalar & Alış</h1>
          <p className="page-subtitle">Toptancı yönetimi ve mal alım işlemleri</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewPurchase(true)}>
          <Plus size={18} />
          Alış Yap
        </button>
      </header>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            <List size={18} />
            Firma Listesi
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} />
            İşlem Geçmişi
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'history' ? (
          <PurchaseHistory />
        ) : (
          /* Wholesaler List */
          <div className="wholesaler-list-view">
             {/* Filters */}
            <div className="wholesalers-filters card">
              <div className="search-box">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  className="form-input search-input"
                  placeholder="Toptancı adı ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="wholesaler-list">
              {loading ? (
                <div className="loading-container card">
                  <div className="spinner"></div>
                </div>
              ) : filteredWholesalers.length === 0 ? (
                <div className="empty-state card">
                  <Truck size={48} className="empty-state-icon" />
                  <p className="empty-state-title">
                    {searchQuery ? 'Firma bulunamadı' : 'Henüz firma eklenmemiş'}
                  </p>
                  <p>{searchQuery ? 'Farklı bir arama deneyin' : 'Alış yaparak firma ekleyebilirsiniz'}</p>
                </div>
              ) : (
                filteredWholesalers.map(wholesaler => (
                  <Link 
                    key={wholesaler.id} 
                    to={`/wholesalers/${wholesaler.id}`} 
                    className="wholesaler-card card"
                  >
                    <div className={`wholesaler-avatar ${wholesaler.debt > 0 ? 'has-debt' : ''}`}>
                      <Building size={24} />
                    </div>
                    <div className="wholesaler-info">
                      <h3 className="wholesaler-name">{wholesaler.company_name}</h3>
                      {wholesaler.contact_person && (
                        <p className="wholesaler-contact">{wholesaler.contact_person}</p>
                      )}
                      {wholesaler.phone && (
                        <p className="wholesaler-phone">
                          <Phone size={14} />
                          {wholesaler.phone}
                        </p>
                      )}
                      <p className="wholesaler-stats">
                        {wholesaler.purchase_count} alım • ₺{wholesaler.total_purchases.toLocaleString()}
                      </p>
                    </div>
                    <div className="wholesaler-actions">
                      <span className="wholesaler-purchases">₺{wholesaler.total_purchases.toLocaleString()}</span>
                      <ChevronRight size={20} className="wholesaler-arrow" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Purchase Modal */}
      {showNewPurchase && (
        <NewPurchase 
          onClose={() => setShowNewPurchase(false)}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  )
}
