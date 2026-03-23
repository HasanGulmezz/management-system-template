import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Phone, ShoppingCart, Calendar, 
  Trash2, AlertTriangle, Wallet, CreditCard, Banknote,
  TrendingUp, FileText
} from 'lucide-react'
import { useCustomers, usePayments, CUSTOMER_PAYMENT_TYPES } from '../../hooks'
import { generateCustomerStatement, generateSaleInvoice } from '../../utils/pdfExport'
import TransactionDetailsModal from '../../components/Modals/TransactionDetailsModal'
import './CustomerDetail.css'

interface CustomerSale {
  id: string
  total_amount: number
  created_at: string
  sale_items: {
    id: string
    quantity: number
    unit_price: number
    product: { name: string } | null
    warehouse: { name: string } | null
  }[]
}

interface CustomerWithSales {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  created_at: string
  sales: CustomerSale[]
  total_spent: number
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getCustomerWithSales, deleteCustomer } = useCustomers()
  const { getCustomerPayments, addCustomerPayment, closeCustomerDebt, calculateCustomerDebt } = usePayments()
  
  const [customer, setCustomer] = useState<CustomerWithSales | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Payment states
  const [debt, setDebt] = useState(0)
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentType, setPaymentType] = useState<'cash' | 'credit_card'>('cash')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [closeAllDebt, setCloseAllDebt] = useState(false)

  // Details Modal State
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [selectedTransactionType, setSelectedTransactionType] = useState<'sale' | 'payment'>('sale')

  // Statement Export Modal State
  const [showStatementModal, setShowStatementModal] = useState(false)
  const [statementFilterType, setStatementFilterType] = useState<'all' | 'range'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dateError, setDateError] = useState<string | null>(null)

  useEffect(() => {
    const loadCustomer = async () => {
      if (!id || deleting) return // Skip if deleting
      
      const { data, error: err } = await getCustomerWithSales(id)
      if (err) {
        setError(err)
      } else {
        setCustomer(data as CustomerWithSales)
        // Calculate debt
        const currentDebt = await calculateCustomerDebt(id)
        setDebt(currentDebt)
      }
      setLoading(false)
    }

    loadCustomer()
  }, [id, getCustomerWithSales, calculateCustomerDebt, deleting])

  const handleDelete = async () => {
    if (!id) return
    
    // Check if customer has unpaid debt
    if (debt > 0) {
      setError(`Bu müşterinin ₺${debt.toLocaleString()} ödenmemiş borcu var. Silmek için önce borcu tahsil edin.`)
      setShowDeleteConfirm(false)
      return
    }
    
    setDeleting(true)
    const { error: deleteError } = await deleteCustomer(id)
    if (deleteError) {
      setError(deleteError)
      setDeleting(false)
    } else {
      navigate('/customers')
    }
  }

  const handlePayment = async () => {
    if (!id || !paymentAmount || submittingPayment) return
    
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Geçerli bir tutar girin')
      return
    }

    setSubmittingPayment(true)
    
    let payError: string | null = null
    
    if (closeAllDebt && amount < debt) {
      // Use closeCustomerDebt: records payment + forgives remainder
      const result = await closeCustomerDebt(id, amount, debt, paymentType, paymentNotes)
      payError = result.error
    } else {
      // Normal payment
      const result = await addCustomerPayment(id, amount, paymentType, paymentNotes)
      payError = result.error
    }
    
    if (payError) {
      setError(payError)
    } else {
      // Recalculate debt
      const newDebt = await calculateCustomerDebt(id)
      setDebt(newDebt)
      setShowPaymentModal(false)
      setPaymentAmount('')
      setPaymentNotes('')
      setCloseAllDebt(false)
    }
    setSubmittingPayment(false)
  }

  // Get customer's payments
  const customerPayments = id ? getCustomerPayments(id) : []

  const validateDates = () => {
    if (statementFilterType === 'all') return true

    if (!startDate || !endDate) {
      setDateError('Lütfen başlangıç ve bitiş tarihlerini seçin')
      return false
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const today = new Date()

    // Reset time parts for accurate date comparison
    today.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    if (start > end) {
      setDateError('Başlangıç tarihi bitiş tarihinden sonra olamaz')
      return false
    }

    if (start > today || end > today) {
      setDateError('İleri bir tarih seçilemez')
      return false
    }

    setDateError(null)
    return true
  }

  const handleDownloadStatement = () => {
    if (!customer) return
    if (!validateDates()) return
    
    // Get filter dates if range selected
    let filterStart: Date | null = null
    let filterEnd: Date | null = null

    if (statementFilterType === 'range') {
      filterStart = new Date(startDate)
      filterStart.setHours(0, 0, 0, 0)
      
      filterEnd = new Date(endDate)
      filterEnd.setHours(23, 59, 59, 999)
    }

    // Filter transactions
    const filteredSales = customer.sales.filter(s => {
      if (!filterStart || !filterEnd) return true
      const date = new Date(s.created_at)
      return date >= filterStart && date <= filterEnd
    })

    const filteredPayments = customerPayments.filter(p => {
      if (!filterStart || !filterEnd) return true
      const date = new Date(p.created_at)
      return date >= filterStart && date <= filterEnd
    })

    // Calculate previous balance (if filtering by date)
    let openingBalance = 0
    
    if (filterStart) {
      // Calculate total balance up to the start date
      const previousSales = customer.sales
        .filter(s => new Date(s.created_at) < filterStart!)
        .reduce((sum, s) => sum + Number(s.total_amount), 0)
        
      const previousPayments = customerPayments
        .filter(p => new Date(p.created_at) < filterStart!)
        .reduce((sum, p) => sum + Number(p.amount), 0)
        
      openingBalance = previousSales - previousPayments
    }
    
    generateCustomerStatement({
      customer: {
        id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone || undefined
      },
      sales: filteredSales.map(s => ({
        id: s.id,
        created_at: s.created_at,
        total_amount: Number(s.total_amount),
        sale_items: s.sale_items
      })),
      payments: filteredPayments.map(p => ({
        id: p.id,
        created_at: p.created_at,
        amount: Number(p.amount),
        payment_type: p.payment_type,
        notes: p.notes || undefined
      })),
      currentBalance: statementFilterType === 'all' ? debt : (openingBalance + 
        filteredSales.reduce((sum, s) => sum + Number(s.total_amount), 0) - 
        filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      )
    })

    setShowStatementModal(false)
  }

  const handleDownloadInvoice = (sale: CustomerSale) => {
    if (!customer) return
    
    generateSaleInvoice({
      sale: {
        id: sale.id,
        created_at: sale.created_at,
        total_amount: Number(sale.total_amount)
      },
      customer: {
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone || undefined
      },
      items: sale.sale_items.map(item => ({
        id: item.id,
        product_id: item.product?.name || '',
        product_name: item.product?.name,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        total_price: Number(item.unit_price) * item.quantity
      }))
    })
  }

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
        <Link to="/customers" className="btn btn-primary">
          Geri Dön
        </Link>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="error-container">
        <p>Müşteri bulunamadı</p>
        <Link to="/customers" className="btn btn-primary">
          Geri Dön
        </Link>
      </div>
    )
  }

  return (
    <div className="customer-detail animate-slideUp">
      <Link to="/customers" className="back-link">
        <ArrowLeft size={20} />
        Müşterilere Dön
      </Link>

      {/* Customer Info Card */}
      <div className="detail-header card">
        <div className="detail-avatar">
          {customer.first_name[0]}{customer.last_name[0]}
        </div>
        <div className="detail-info">
          <h1 className="detail-name">{customer.first_name} {customer.last_name}</h1>
          {customer.phone && (
            <p className="detail-phone">
              <Phone size={16} />
              {customer.phone}
            </p>
          )}
          <p className="detail-date">
            <Calendar size={16} />
            Kayıt: {new Date(customer.created_at).toLocaleDateString('tr-TR')}
          </p>
        </div>
        <div className="detail-stats">
          <div className="stat-box">
            <span className="stat-value">{customer.sales.length}</span>
            <span className="stat-label">İşlem</span>
          </div>
          <div className="stat-box highlight">
            <span className="stat-value">₺{customer.total_spent.toLocaleString()}</span>
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
            {(() => {
              const totalDiscount = customerPayments
                .filter(p => p.payment_type === 'debt_forgiveness')
                .reduce((sum, p) => sum + Number(p.amount), 0)
              return totalDiscount > 0 ? (
                <span style={{ 
                  display: 'block', 
                  fontSize: '0.8rem', 
                  color: 'var(--color-text-muted)', 
                  marginTop: '4px' 
                }}>
                  Toplam Uygulanan İndirim: <strong style={{ color: '#f59e0b' }}>₺{totalDiscount.toLocaleString()}</strong>
                </span>
              ) : null
            })()}
          </div>
        </div>
        <div className="action-buttons">
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setStatementFilterType('all')
              setDateError(null)
              setShowStatementModal(true)
            }}
          >
            <FileText size={18} />
            Hesap Ekstresi
          </button>
          <button 
            className="btn btn-success"
            onClick={() => setShowPaymentConfirm(true)}
            disabled={debt <= 0}
          >
            <Banknote size={18} />
            Tahsilat Al
          </button>
        </div>
      </div>

      {/* Payment Confirmation Popup */}
      {showPaymentConfirm && (
        <div className="modal-overlay" onClick={() => setShowPaymentConfirm(false)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="confirm-icon" style={{ color: 'var(--color-success)' }}>
              <Wallet size={48} />
            </div>
            <h3>Tahsilat İşlemi</h3>
            <p className="confirm-text">
              <strong>{customer.first_name} {customer.last_name}</strong> müşterisinden tahsilat almak üzeresiniz.
              <br />
              <span style={{ color: 'var(--color-text-secondary)', marginTop: '8px', display: 'block' }}>
                Mevcut Borç: <strong style={{ color: 'var(--color-error)' }}>₺{debt.toLocaleString()}</strong>
              </span>
            </p>
            <div className="confirm-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowPaymentConfirm(false)}
              >
                Vazgeç
              </button>
              <button 
                className="btn btn-success" 
                onClick={() => {
                  setShowPaymentConfirm(false)
                  setShowPaymentModal(true)
                }}
              >
                Devam Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal payment-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Tahsilat Al</h2>
            </div>
            <div className="modal-body">
              {error && <div className="form-error">{error}</div>}
              
              <p className="payment-info-text">
                <strong>{customer.first_name} {customer.last_name}</strong> müşterisinden tahsilat
              </p>
              <p className="current-debt">Mevcut Borç: <strong>₺{debt.toLocaleString()}</strong></p>

              <div className="form-group">
                <label className="form-label">Tahsilat Tutarı</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => {
                    setPaymentAmount(e.target.value)
                    setCloseAllDebt(false)
                  }}
                />
              </div>

              {/* Tamamını Kapat checkbox - only show when amount < debt */}
              {paymentAmount && parseFloat(paymentAmount) > 0 && parseFloat(paymentAmount) < debt && (
                <div className="form-group" style={{ 
                  padding: '12px 16px', 
                  borderRadius: '10px',
                  backgroundColor: closeAllDebt ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  border: closeAllDebt ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.2s ease'
                }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    cursor: 'pointer',
                    fontSize: '0.95rem'
                  }}>
                    <input
                      type="checkbox"
                      checked={closeAllDebt}
                      onChange={(e) => setCloseAllDebt(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#22c55e' }}
                    />
                    <span>Tamamını Kapat</span>
                  </label>
                  {closeAllDebt && (
                    <p style={{ 
                      marginTop: '8px', 
                      marginLeft: '28px',
                      fontSize: '0.85rem', 
                      color: 'var(--color-text-secondary)',
                      lineHeight: '1.4'
                    }}>
                      ₺{parseFloat(paymentAmount).toLocaleString()} tahsil edilecek, 
                      kalan <strong style={{ color: '#f59e0b' }}>₺{(debt - parseFloat(paymentAmount)).toLocaleString()}</strong> fark helalleştirilecek.
                    </p>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Ödeme Tipi</label>
                <div className="payment-types">
                  {CUSTOMER_PAYMENT_TYPES.map(type => (
                    <button
                      key={type.value}
                      className={`payment-type-btn ${paymentType === type.value ? 'active' : ''}`}
                      onClick={() => setPaymentType(type.value as 'cash' | 'credit_card')}
                    >
                      {type.value === 'cash' ? <Banknote size={18} /> : <CreditCard size={18} />}
                      {type.label}
                    </button>
                  ))}
                </div>
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
                className="btn btn-success" 
                onClick={handlePayment}
                disabled={submittingPayment || !paymentAmount}
              >
                {submittingPayment ? 'Kaydediliyor...' : 'Tahsilatı Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      {customerPayments.length > 0 && (
        <div className="section">
          <h2 className="section-title">
            <Wallet size={20} />
            Tahsilat Geçmişi
          </h2>
          <div className="payments-history">
            {customerPayments.map(payment => (
              <div 
                key={payment.id} 
                className="payment-history-item card clickable"
                onClick={() => {
                  setSelectedTransactionId(payment.id)
                  setSelectedTransactionType('payment')
                }}
              >
                <div className="payment-history-icon">
                  {payment.payment_type === 'cash' ? <Banknote size={18} /> : <CreditCard size={18} />}
                </div>
                <div className="payment-history-info">
                  <span className="payment-history-type">
                    {CUSTOMER_PAYMENT_TYPES.find(t => t.value === payment.payment_type)?.label}
                  </span>
                  <span className="payment-history-date">
                    {new Date(payment.created_at).toLocaleDateString('tr-TR')}
                  </span>
                  {payment.notes && (
                    <span className="payment-history-notes">{payment.notes}</span>
                  )}
                </div>
                <span className="payment-history-amount">+₺{Number(payment.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales History */}
      <div className="section">
        <h2 className="section-title">
          <ShoppingCart size={20} />
          İşlem Geçmişi
        </h2>

        {customer.sales.length === 0 ? (
          <div className="empty-state card">
            <ShoppingCart size={48} className="empty-state-icon" />
            <p className="empty-state-title">Henüz işlem yok</p>
          </div>
        ) : (
          <div className="sales-list">
            {customer.sales.map((sale: CustomerSale) => (
              <div 
                key={sale.id} 
                className="sale-card-wrapper"
              >
                <div 
                  className="sale-card clickable"
                  onClick={() => {
                    setSelectedTransactionId(sale.id)
                    setSelectedTransactionType('sale')
                  }}
                >
                  <div className="sale-icon">
                    <TrendingUp size={20} />
                  </div>
                  <div className="sale-info">
                    <span className="sale-customer">İşlem #{sale.id.slice(0, 8)}</span>
                    <span className="sale-date">
                      <Calendar size={12} />
                      {new Date(sale.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="sale-amount-wrapper">
                    <span className="sale-amount">
                      +₺{Number(sale.total_amount).toLocaleString()}
                    </span>
                    <span className="sale-item-count">
                      {sale.sale_items.length} ürün
                    </span>
                  </div>
                </div>
                <button 
                  className="info-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownloadInvoice(sale)
                  }}
                  title="Fatura İndir"
                >
                  <FileText size={20} />
                </button>
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
          Müşteriyi Sil
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">
              <AlertTriangle size={48} />
            </div>
            <h3>Müşteriyi Silmek İstediğinize Emin Misiniz?</h3>
            <p className="confirm-text">
              <strong>{customer.first_name} {customer.last_name}</strong> müşterisini silmek üzeresiniz.
              {customer.sales.length > 0 && (
                <span className="warning-text">
                  Bu müşterinin {customer.sales.length} satış kaydı bulunmaktadır.
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
      {/* Statement Export Modal */}
      {showStatementModal && (
        <div className="modal-overlay" onClick={() => setShowStatementModal(false)}>
          <div className="modal payment-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Hesap Ekstresi Oluştur</h2>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Kapsam Seçin</label>
                <div className="payment-types">
                  <button
                    className={`payment-type-btn ${statementFilterType === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      setStatementFilterType('all')
                      setDateError(null)
                    }}
                  >
                    <FileText size={18} />
                    Tüm Zamanlar
                  </button>
                  <button
                    className={`payment-type-btn ${statementFilterType === 'range' ? 'active' : ''}`}
                    onClick={() => setStatementFilterType('range')}
                  >
                    <Calendar size={18} />
                    Tarih Aralığı
                  </button>
                </div>
              </div>

              {statementFilterType === 'range' && (
                <div className="date-range-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Başlangıç Tarihi</label>
                    <input
                      type="date"
                      className="form-input"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value)
                        setDateError(null)
                      }}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bitiş Tarihi</label>
                    <input
                      type="date"
                      className="form-input"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value)
                        setDateError(null)
                      }}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              )}

              {dateError && (
                <div className="form-error" style={{ marginTop: '10px' }}>
                  <AlertTriangle size={16} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
                  {dateError}
                </div>
              )}

              <p className="payment-info-text" style={{ marginTop: '15px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                {statementFilterType === 'all' 
                  ? 'Müşterinin başlangıçtan bugüne tüm hesap hareketleri rapora dahil edilecektir.'
                  : 'Seçilen tarih aralığındaki ve öncesinden devreden bakiye rapora dahil edilecektir.'}
              </p>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowStatementModal(false)}
              >
                Vazgeç
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleDownloadStatement}
              >
                İndir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
