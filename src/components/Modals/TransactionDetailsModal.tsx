import { useState, useEffect } from 'react'
import { X, Package, Calendar, User, Building, MapPin, Wallet, CreditCard, Banknote, FileText, Search, Trash2, AlertCircle, Pencil, Save } from 'lucide-react'
import { useSales, usePurchases, usePayments } from '../../hooks'
import './TransactionDetailsModal.css'

interface TransactionDetailsModalProps {
  transactionId: string
  type: 'sale' | 'purchase' | 'payment'
  onClose: () => void
  initialSearchQuery?: string
}

export default function TransactionDetailsModal({ 
  transactionId, 
  type, 
  onClose,
  initialSearchQuery = ''
}: TransactionDetailsModalProps) {
  const { getSaleDetails, deleteSale, updateSaleItems } = useSales()
  const { getPurchaseDetails, deletePurchase, updatePurchaseItems } = usePurchases()
  const { getPaymentDetails, deletePayment } = usePayments()
  
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [itemSearchQuery, setItemSearchQuery] = useState(initialSearchQuery)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editedItems, setEditedItems] = useState<{ id: string; unit_price: number; quantity: number }[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true)
      setError(null)
      
      let result
      if (type === 'sale') {
        result = await getSaleDetails(transactionId)
      } else if (type === 'payment') {
        result = await getPaymentDetails(transactionId)
      } else {
        result = await getPurchaseDetails(transactionId)
      }

      if (result.error) {
        setError(result.error)
      } else {
        setData(result.data)
      }
      setLoading(false)
    }

    loadDetails()
  }, [transactionId, type]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    setIsDeleting(true)
    let result
    if (type === 'sale') {
      result = await deleteSale(transactionId)
    } else if (type === 'purchase') {
      result = await deletePurchase(transactionId)
    } else {
      result = await deletePayment(transactionId)
    }

    if (result.error) {
      setError(result.error)
      setShowDeleteConfirm(false)
      setIsDeleting(false)
    } else {
      onClose()
    }
  }

  // Start editing
  const handleStartEdit = () => {
    const items = type === 'sale' ? data.sale_items : data.purchase_items
    setEditedItems(items.map((item: any) => ({
      id: item.id,
      unit_price: Number(item.unit_price),
      quantity: item.quantity
    })))
    setIsEditing(true)
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedItems([])
  }

  // Update edited price
  const handlePriceChange = (itemId: string, newPrice: number) => {
    setEditedItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, unit_price: newPrice } : item
    ))
  }

  // Save edits
  const handleSaveEdit = async () => {
    setIsSaving(true)
    setError(null)

    let result
    if (type === 'sale') {
      result = await updateSaleItems(transactionId, editedItems)
    } else {
      result = await updatePurchaseItems(transactionId, editedItems)
    }

    if (result.error) {
      setError(result.error)
    } else {
      // Reload data
      let reloadResult
      if (type === 'sale') {
        reloadResult = await getSaleDetails(transactionId)
      } else {
        reloadResult = await getPurchaseDetails(transactionId)
      }
      if (reloadResult.data) {
        setData(reloadResult.data)
      }
      setIsEditing(false)
      setEditedItems([])
    }
    setIsSaving(false)
  }

  // Get edited price for an item
  const getEditedPrice = (itemId: string): number => {
    const edited = editedItems.find(e => e.id === itemId)
    return edited?.unit_price ?? 0
  }

  // Calculate edited total
  const editedTotal = editedItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

  if (!transactionId) return null

  const getPaymentLabel = (type: string) => {
    switch(type) {
      case 'cash': return 'Nakit'
      case 'credit_card': return 'Kredi Kartı'
      case 'check': return 'Çek'
      case 'promissory_note': return 'Senet'
      case 'debt_forgiveness': return 'Borç Helalleştirme'
      default: return type
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="modal-loading">
          <div className="spinner"></div>
          <p>Detaylar yükleniyor...</p>
        </div>
      )
    }

    if (error || !data) {
      return (
        <div className="modal-error">
          <p>{error || 'İşlem detayları bulunamadı'}</p>
        </div>
      )
    }

    // Payment Layout
    if (type === 'payment') {
      const partyName = data.customer 
        ? `${data.customer.first_name} ${data.customer.last_name}` 
        : (data.wholesaler?.company_name || 'Bilinmeyen')
      
      return (
        <div className="transaction-details">
           {/* Header Info */}
           <div className="detail-row header-info">
            <div className="info-group">
              <span className="info-label">
                {type === 'payment' ? <Wallet size={14} /> : <User size={14} />}
                {type === 'payment' ? 'Hesap' : 'Müşteri / Toptancı'}
              </span>
              <span className="info-value">{partyName}</span>
            </div>
            <div className="info-group">
              <span className="info-label">
                <Calendar size={14} />
                Tarih
              </span>
              <span className="info-value">
                {new Date(data.created_at).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          <div className="payment-details-card">
             <div className="payment-amount-row">
                <span className="label">Tutar</span>
                <span className="amount">₺{Number(data.amount).toLocaleString()}</span>
             </div>
             
             <div className="payment-method-row">
               <span className="label">Ödeme Yöntemi</span>
               <div className="method-badge">
                 {data.payment_type === 'cash' ? <Banknote size={16} /> : 
                  data.payment_type === 'debt_forgiveness' ? <AlertCircle size={16} /> :
                  <CreditCard size={16} />}
                 <span>{getPaymentLabel(data.payment_type)}</span>
               </div>
             </div>

             {data.notes && (
               <div className="payment-notes">
                 <div className="notes-label">
                   <FileText size={14} />
                   <span>Notlar</span>
                 </div>
                 <p className="notes-text">{data.notes}</p>
               </div>
             )}
          </div>
        </div>
      )
    }

    // Existing Sale/Purchase Layout
    const items = type === 'sale' ? data.sale_items : data.purchase_items
    const partyName = type === 'sale' 
      ? (data.customer ? `${data.customer.first_name} ${data.customer.last_name}` : 'Anonim Müşteri')
      : (data.wholesaler?.company_name || 'Bilinmeyen Toptancı')
    
    // Filter items by search query
    const filteredItems = items.filter((item: any) => {
      if (!itemSearchQuery) return true
      const productName = item.product?.name || ''
      return productName.toLowerCase().includes(itemSearchQuery.toLowerCase())
    })

    const showSearchBar = items.length > 5
    
    return (
      <div className="transaction-details">
        {/* Header Info */}
        <div className="detail-row header-info">
          <div className="info-group">
            <span className="info-label">
              {type === 'sale' ? <User size={14} /> : <Building size={14} />}
              {type === 'sale' ? 'Müşteri' : 'Toptancı'}
            </span>
            <span className="info-value">{partyName}</span>
          </div>
          <div className="info-group">
            <span className="info-label">
              <Calendar size={14} />
              Tarih
            </span>
            <span className="info-value">
              {new Date(data.created_at).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* Search Bar (only show when > 5 items) */}
        {showSearchBar && (
          <div className="items-search-container">
            <div className="items-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="form-input items-search-input"
                placeholder="Ürün adı ile ara..."
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
              />
            </div>
            {itemSearchQuery && (
              <span className="items-search-count">
                {filteredItems.length} / {items.length} ürün
              </span>
            )}
          </div>
        )}

        {/* Edit mode indicator */}
        {isEditing && (
          <div style={{
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            marginBottom: '12px',
            fontSize: '0.85rem',
            color: 'var(--color-primary)'
          }}>
            <Pencil size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} />
            Düzenleme modu — Birim fiyatları değiştirip kaydedin
          </div>
        )}

        {/* Items Table */}
        <div className="items-table-container">
          <table className="items-table">
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Depo</th>
                <th className="text-right">Birim Fiyat</th>
                <th className="text-center">Adet</th>
                <th className="text-right">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted" style={{ padding: '24px' }}>
                    Aramayla eşleşen ürün bulunamadı
                  </td>
                </tr>
              ) : (
                filteredItems.map((item: any) => {
                  const currentPrice = isEditing ? getEditedPrice(item.id) : Number(item.unit_price)
                  const itemTotal = item.quantity * currentPrice

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="item-cell">
                          <Package size={14} className="text-muted" />
                          <span>{item.product?.name || 'Silinmiş Ürün'}</span>
                        </div>
                      </td>
                      <td>
                        {item.warehouse && (
                          <div className="warehouse-cell">
                            <MapPin size={12} />
                            {item.warehouse.name}
                          </div>
                        )}
                      </td>
                      <td className="text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            className="form-input"
                            value={currentPrice}
                            onChange={(e) => handlePriceChange(item.id, Math.max(0, parseFloat(e.target.value) || 0))}
                            min="0"
                            step="0.01"
                            style={{ 
                              width: '100px', 
                              textAlign: 'right',
                              padding: '4px 8px',
                              fontSize: '0.9rem'
                            }}
                          />
                        ) : (
                          `₺${Number(item.unit_price).toLocaleString()}`
                        )}
                      </td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right font-medium">
                        ₺{itemTotal.toLocaleString()}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="text-right font-bold">Genel Toplam</td>
                <td className="text-right font-bold text-lg">
                  {isEditing ? (
                    <span style={{ color: editedTotal !== Number(data.total_amount) ? '#f59e0b' : 'inherit' }}>
                      ₺{editedTotal.toLocaleString()}
                    </span>
                  ) : (
                    `₺${Number(data.total_amount).toLocaleString()}`
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal transaction-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {type === 'sale' ? 'Satış #' : type === 'purchase' ? 'Alış #' : 'Ödeme / Tahsilat #'}{transactionId.slice(0, 8)}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          {renderContent()}
        </div>

        <div className="modal-footer">
          <div className="modal-footer-left">
            {isEditing ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  İptal
                </button>
                <button
                  className="btn btn-success btn-sm"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                >
                  <Save size={16} />
                  {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Edit button - only for sale/purchase */}
                {type !== 'payment' && !showDeleteConfirm && (
                  <button
                    className="btn btn-primary-soft btn-sm"
                    onClick={handleStartEdit}
                    disabled={loading || !!error}
                  >
                    <Pencil size={16} />
                    <span>Düzenle</span>
                  </button>
                )}
                {!showDeleteConfirm ? (
                  <button 
                    className="btn btn-danger-soft btn-sm" 
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading || !!error}
                  >
                    <Trash2 size={16} />
                    <span>Sil</span>
                  </button>
                ) : (
                  <div className="delete-confirm-actions">
                    <span className="confirm-text">
                      <AlertCircle size={14} />
                      Bu işlemi silmek istediğinize emin misiniz?
                    </span>
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Siliniyor...' : 'Evet, Sil'}
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                    >
                      Vazgeç
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <button className="btn btn-secondary" onClick={onClose} disabled={isDeleting || isSaving}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  )
}
