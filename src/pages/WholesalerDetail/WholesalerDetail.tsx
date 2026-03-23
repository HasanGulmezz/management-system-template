import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Building, Phone, User, Calendar, Truck, 
  Trash2, AlertTriangle, Wallet, FileText, Receipt,
  TrendingDown
} from 'lucide-react'
import { useWholesalers, usePayments, WHOLESALER_PAYMENT_TYPES } from '../../hooks'
import TransactionDetailsModal from '../../components/Modals/TransactionDetailsModal'
import PinGuard from '../../components/Security/PinGuard'
import './WholesalerDetail.css'

interface WholesalerPurchase {
  id: string
  total_amount: number
  created_at: string
  purchase_items: {
    id: string
    quantity: number
    unit_price: number
    product: { name: string } | null
  }[]
}

interface WholesalerWithPurchases {
  id: string
  company_name: string
  contact_person: string | null
  phone: string | null
  created_at: string
  purchases: WholesalerPurchase[]
  total_purchases: number
}

export default function WholesalerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getWholesalerWithPurchases, deleteWholesaler } = useWholesalers()
  const { getWholesalerPayments, addWholesalerPayment, calculateWholesalerDebt } = usePayments()
  
  const [wholesaler, setWholesaler] = useState<WholesalerWithPurchases | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Payment states
  const [debt, setDebt] = useState(0)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPinGuard, setShowPinGuard] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentType, setPaymentType] = useState<'check' | 'promissory_note'>('check')
  const [paymentDueDate, setPaymentDueDate] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [submittingPayment, setSubmittingPayment] = useState(false)

  // Get today's date in YYYY-MM-DD format for min date restriction
  const today = new Date().toISOString().split('T')[0]

  // Details Modal State
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [selectedTransactionType, setSelectedTransactionType] = useState<'purchase' | 'payment'>('purchase')

  useEffect(() => {
    const loadWholesaler = async () => {
      if (!id || deleting) return // Skip if deleting
      
      const { data, error: err } = await getWholesalerWithPurchases(id)
      if (err) {
        setError(err)
      } else {
        setWholesaler(data as WholesalerWithPurchases)
        // Calculate debt
        const currentDebt = await calculateWholesalerDebt(id)
        setDebt(currentDebt)
      }
      setLoading(false)
    }

    loadWholesaler()
  }, [id, getWholesalerWithPurchases, calculateWholesalerDebt, deleting])

  const handleDelete = async () => {
    if (!id) return
    
    // Check if wholesaler has unpaid debt
    if (debt > 0) {
      setError(`Bu toptancının ₺${debt.toLocaleString()} ödenmemiş borcu var. Silmek için önce borcu ödeyin.`)
      setShowDeleteConfirm(false)
      return
    }
    
    setDeleting(true)
    const { error: deleteError } = await deleteWholesaler(id)
    if (deleteError) {
      setError(deleteError)
      setDeleting(false)
    } else {
      navigate('/wholesalers')
    }
  }

  const handlePayment = async () => {
    if (!id || !paymentAmount || !paymentDueDate) return
    
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Geçerli bir tutar girin')
      return
    }

    setSubmittingPayment(true)
    const { error: payError } = await addWholesalerPayment(id, amount, paymentType, paymentNotes, paymentDueDate)
    
    if (payError) {
      setError(payError)
    } else {
      // Recalculate debt
      const newDebt = await calculateWholesalerDebt(id)
      setDebt(newDebt)
      setShowPaymentModal(false)
      setPaymentAmount('')
      setPaymentDueDate('')
      setPaymentNotes('')
    }
    setSubmittingPayment(false)
  }

  // Get wholesaler's payments
  const wholesalerPayments = id ? getWholesalerPayments(id) : []

  if (loading || deleting) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <Link to="/wholesalers" className="btn btn-primary">
          Geri Dön
        </Link>
      </div>
    )
  }

  if (!wholesaler) {
    return (
      <div className="error-container">
        <p>Toptancı bulunamadı</p>
        <Link to="/wholesalers" className="btn btn-primary">
          Geri Dön
        </Link>
      </div>
    )
  }

  return (
    <div className="wholesaler-detail animate-slideUp">
      <Link to="/wholesalers" className="back-link">
        <ArrowLeft size={20} />
        Firmalara Dön
      </Link>

      {/* Wholesaler Info Card */}
      <div className="detail-header card">
        <div className="detail-avatar wholesaler">
          <Building size={32} />
        </div>
        <div className="detail-info">
          <h1 className="detail-name">{wholesaler.company_name}</h1>
          {wholesaler.contact_person && (
            <p className="detail-contact">
              <User size={16} />
              {wholesaler.contact_person}
            </p>
          )}
          {wholesaler.phone && (
            <p className="detail-phone">
              <Phone size={16} />
              {wholesaler.phone}
            </p>
          )}
          <p className="detail-date">
            <Calendar size={16} />
            Kayıt: {new Date(wholesaler.created_at).toLocaleDateString('tr-TR')}
          </p>
        </div>
        <div className="detail-stats">
          <div className="stat-box">
            <span className="stat-value">{wholesaler.purchases.length}</span>
            <span className="stat-label">Alım</span>
          </div>
          <div className="stat-box highlight warning">
            <span className="stat-value">₺{wholesaler.total_purchases.toLocaleString()}</span>
            <span className="stat-label">Toplam</span>
          </div>
        </div>
      </div>

      {/* Debt Section */}
      <div className="debt-section card">
        <div className="debt-info">
          <Wallet size={24} />
          <div>
            <span className="debt-label">Kalan Borç</span>
            <span className={`debt-amount ${debt > 0 ? 'has-debt' : 'no-debt'}`}>
              ₺{debt.toLocaleString()}
            </span>
          </div>
        </div>
        <button 
          className="btn btn-warning"
          onClick={() => setShowPinGuard(true)}
          disabled={debt <= 0}
        >
          <Receipt size={18} />
          Ödeme Yap
        </button>
      </div>

      <PinGuard
        isOpen={showPinGuard}
        onClose={() => setShowPinGuard(false)}
        onSuccess={() => setShowPaymentModal(true)}
        title="Ödeme Onayı"
      />

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal payment-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Toptancıya Ödeme</h2>
            </div>
            <div className="modal-body">
              {error && <div className="form-error">{error}</div>}
              
              <p className="payment-info-text">
                <strong>{wholesaler.company_name}</strong> toptancısına ödeme
              </p>
              <p className="current-debt">Mevcut Borç: <strong>₺{debt.toLocaleString()}</strong></p>

              <div className="form-group">
                <label className="form-label">Ödeme Tutarı</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={debt}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ödeme Tipi</label>
                <div className="payment-types">
                  {WHOLESALER_PAYMENT_TYPES.map(type => (
                    <button
                      key={type.value}
                      className={`payment-type-btn ${paymentType === type.value ? 'active' : ''}`}
                      onClick={() => setPaymentType(type.value as 'check' | 'promissory_note')}
                    >
                      {type.value === 'check' ? <Receipt size={18} /> : <FileText size={18} />}
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Vade Tarihi *</label>
                <input
                  type="date"
                  className="form-input"
                  value={paymentDueDate}
                  onChange={(e) => setPaymentDueDate(e.target.value)}
                  min={today}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Not (Opsiyonel)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ödeme notu..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowPaymentModal(false)}
              >
                İptal
              </button>
              <button 
                className="btn btn-warning" 
                onClick={handlePayment}
                disabled={submittingPayment || !paymentAmount}
              >
                {submittingPayment ? 'Kaydediliyor...' : 'Ödemeyi Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      {wholesalerPayments.length > 0 && (
        <div className="section">
          <h2 className="section-title">
            <Wallet size={20} />
            Ödeme Geçmişi
          </h2>
          <div className="payments-history">
            {wholesalerPayments.map(payment => (
              <div 
                key={payment.id} 
                className="payment-history-item card clickable"
                onClick={() => {
                  setSelectedTransactionId(payment.id)
                  setSelectedTransactionType('payment')
                }}
              >
                <div className="payment-history-icon wholesaler">
                  {payment.payment_type === 'check' ? <Receipt size={18} /> : <FileText size={18} />}
                </div>
                <div className="payment-history-info">
                  <span className="payment-history-type">
                    {WHOLESALER_PAYMENT_TYPES.find(t => t.value === payment.payment_type)?.label}
                  </span>
                  <span className="payment-history-date">
                    {new Date(payment.created_at).toLocaleDateString('tr-TR')}
                  </span>
                  {payment.notes && (
                    <span className="payment-history-notes">{payment.notes}</span>
                  )}
                </div>
                <span className="payment-history-amount wholesaler">-₺{Number(payment.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchase History */}
      <div className="section">
        <h2 className="section-title">
          <Truck size={20} />
          Alım Geçmişi
        </h2>

        {wholesaler.purchases.length === 0 ? (
          <div className="empty-state card">
            <Truck size={48} className="empty-state-icon" />
            <p className="empty-state-title">Henüz alım yok</p>
          </div>
        ) : (
          <div className="purchases-list">
            {wholesaler.purchases.map(purchase => (
              <div 
                key={purchase.id} 
                className="purchase-card-wrapper clickable"
                onClick={() => {
                  setSelectedTransactionId(purchase.id)
                  setSelectedTransactionType('purchase')
                }}
              >
                <div className="purchase-card">
                  <div className="purchase-icon">
                    <TrendingDown size={20} />
                  </div>
                  <div className="purchase-info">
                    <span className="purchase-wholesaler">Alım #{purchase.id.slice(0, 8)}</span>
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
                      {purchase.purchase_items.length} ürün
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTransactionId && (
        <TransactionDetailsModal
          transactionId={selectedTransactionId}
          type={selectedTransactionType}
          onClose={() => setSelectedTransactionId(null)}
        />
      )}

      {/* Delete Button - At the very bottom */}
      <div className="action-buttons danger-zone">
        <button 
          className="btn btn-danger"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 size={18} />
          Toptancıyı Sil
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">
              <AlertTriangle size={48} />
            </div>
            <h3>Toptancıyı Silmek İstediğinize Emin Misiniz?</h3>
            <p className="confirm-text">
              <strong>{wholesaler.company_name}</strong> toptancısını silmek üzeresiniz.
              {wholesaler.purchases.length > 0 && (
                <span className="warning-text">
                  Bu toptancının {wholesaler.purchases.length} alış kaydı bulunmaktadır.
                </span>
              )}
            </p>
            <div className="confirm-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                İptal
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
