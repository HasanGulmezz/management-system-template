import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  ShoppingCart, Plus, Trash2, 
  X, Check, Package, Search,
  TrendingUp, Calendar, Info
} from 'lucide-react'
import { useSales, useProducts, useCustomers, useWarehouses } from '../../hooks'
import type { CartItem } from '../../hooks/useSales'
import TransactionDetailsModal from '../../components/Modals/TransactionDetailsModal'
import './Sales.css'

interface CustomerFormData {
  first_name: string
  last_name: string
  phone: string
}

export default function Sales() {
  const { sales, loading, createSale } = useSales()
  const { products } = useProducts()
  const { customers, addCustomer } = useCustomers()
  const { warehouses } = useWarehouses()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewSale, setShowNewSale] = useState(false)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('')
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customerForm, setCustomerForm] = useState<CustomerFormData>({
    first_name: '', last_name: '', phone: ''
  })
  
  // Details Modal State
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)

  // Filter sales by customer name
  const filteredSales = sales.filter(s => 
    s.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Helper: Get stock for a product in the selected warehouse
  const getStockForWarehouse = (productId: string): number => {
    if (!selectedWarehouse) return 0
    const product = products.find(p => p.id === productId)
    if (!product || !product.stock) return 0
    const stockEntry = product.stock.find(s => s.warehouse_id === selectedWarehouse)
    return stockEntry?.quantity || 0
  }

  // Helper: Get already added quantity in cart for a product
  const getCartQuantity = (productId: string): number => {
    const cartItem = cart.find(item => item.product_id === productId && item.warehouse_id === selectedWarehouse)
    return cartItem?.quantity || 0
  }

  // Add product to cart
  const addToCart = (product: { id: string; name: string; price: number }) => {
    if (!selectedWarehouse) {
      setError('Lütfen önce bir depo seçin')
      setTimeout(() => setError(''), 3000)
      return
    }

    const availableStock = getStockForWarehouse(product.id)
    const currentCartQty = getCartQuantity(product.id)

    if (availableStock <= 0) {
      setError(`"${product.name}" bu depoda stokta yok`)
      setTimeout(() => setError(''), 3000)
      return
    }

    if (currentCartQty >= availableStock) {
      setError(`Maksimum stok: ${availableStock} adet`)
      setTimeout(() => setError(''), 3000)
      return
    }

    const existingItem = cart.find(
      item => item.product_id === product.id && item.warehouse_id === selectedWarehouse
    )

    if (existingItem) {
      setCart(cart.map(item => 
        item.product_id === product.id && item.warehouse_id === selectedWarehouse
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      const warehouse = warehouses.find(w => w.id === selectedWarehouse)
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        warehouse_id: selectedWarehouse,
        warehouse_name: warehouse?.name || '',
        quantity: 1,
        unit_price: product.price,
        available_stock: availableStock
      }])
    }
  }

  // Update unit price (reverse calculation)
  const updatePrice = (index: number, price: number) => {
    if (price < 0) return
    setCart(cart.map((item, i) => 
      i === index ? { ...item, unit_price: price } : item
    ))
  }

  // Remove from cart
  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  // Calculate total
  const total = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

  // Add new customer
  const handleAddCustomer = async () => {
    if (!customerForm.first_name || !customerForm.last_name) {
      setError('İsim ve soyisim zorunludur')
      return
    }

    const { data, error: addError } = await addCustomer({
      first_name: customerForm.first_name,
      last_name: customerForm.last_name,
      phone: customerForm.phone || undefined
    })

    if (addError) {
      setError(addError)
    } else if (data) {
      setSelectedCustomer(data.id)
      setShowAddCustomer(false)
      setCustomerForm({ first_name: '', last_name: '', phone: '' })
    }
  }

  // Complete sale
  const handleCompleteSale = async () => {
    if (isSubmitting) return // Prevent double submit
    
    if (!selectedWarehouse) {
      setError('Lütfen bir depo seçin')
      return
    }
    if (cart.length === 0) {
      setError('Sepet boş')
      return
    }

    setIsSubmitting(true)
    const { error: saleError } = await createSale(selectedCustomer, cart)
    
    if (saleError) {
      setError(saleError)
      setIsSubmitting(false)
    } else {
      setCart([])
      setSelectedCustomer(null)
      setShowNewSale(false)
      setIsSubmitting(false)
    }
  }

  // Reset new sale
  const resetNewSale = () => {
    setCart([])
    setSelectedCustomer(null)
    setError('')
    setShowNewSale(false)
  }

  return (
    <div className="sales-page animate-slideUp">
      <header className="page-header">
        <h1 className="page-title">Cari Hesap</h1>
        <button className="btn btn-primary" onClick={() => setShowNewSale(true)}>
          <Plus size={18} />
          Yeni Satış
        </button>
      </header>

      {/* Filters */}
      <div className="sales-filters card">
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

      {/* Sales History Table */}
      <div className="card">
        <h2 className="card-title-inline">
          <ShoppingCart size={18} />
          Satış Geçmişi
        </h2>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="sales-list">
            {filteredSales.length === 0 ? (
              <div className="empty-state">
                <ShoppingCart size={48} className="empty-state-icon" />
                <p className="empty-state-title">
                  {searchQuery ? 'Sonuç bulunamadı' : 'Henüz satış yapılmamış'}
                </p>
                <p>{searchQuery ? 'Farklı bir arama deneyin' : 'Yeni satış ekleyerek başlayın'}</p>
              </div>
            ) : (
              filteredSales.map(sale => (
                <div key={sale.id} className="sale-card-wrapper">
                  <Link 
                    to={sale.customer_id ? `/customers/${sale.customer_id}` : '#'}
                    className="sale-card"
                    onClick={e => !sale.customer_id && e.preventDefault()}
                  >
                    <div className="sale-icon">
                      <TrendingUp size={20} />
                    </div>
                    <div className="sale-info">
                      <span className="sale-customer">{sale.customer_name}</span>
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
                        {sale.item_count} ürün
                      </span>
                    </div>
                  </Link>
                  <button 
                    className="btn-icon-soft info-btn"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSelectedTransactionId(sale.id)
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
          type="sale"
          onClose={() => setSelectedTransactionId(null)}
        />
      )}

      {/* New Sale Modal */}
      {showNewSale && (
        <div className="modal-overlay" onClick={resetNewSale}>
          <div className="modal sale-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Yeni Satış</h2>
              <button className="modal-close" onClick={resetNewSale}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              {error && <div className="form-error">{error}</div>}
              
              {/* Warehouse Selection */}
              <div className="form-group">
                <label className="form-label">Satış Yapılacak Depo</label>
                <select 
                  className="form-input"
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                >
                  <option value="">Depo seçin...</option>
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>

              {/* Customer Selection */}
              <div className="form-group">
                <label className="form-label">Müşteri</label>
                <div className="select-with-add">
                  <select 
                    className="form-input"
                    value={selectedCustomer || ''}
                    onChange={(e) => {
                      if (e.target.value === 'new') {
                        setShowAddCustomer(true)
                      } else {
                        setSelectedCustomer(e.target.value || null)
                      }
                    }}
                  >
                    <option value="">Anonim Müşteri</option>
                    <option value="new" className="add-new-option">+ Yeni Müşteri Ekle</option>
                    {customers
                      .slice()
                      .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, 'tr'))
                      .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Customer Inline Form */}
              {showAddCustomer && (
                <div className="inline-form card">
                  <h4>Yeni Müşteri</h4>
                  <div className="form-row">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="İsim *"
                      value={customerForm.first_name}
                      onChange={(e) => setCustomerForm({...customerForm, first_name: e.target.value})}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Soyisim *"
                      value={customerForm.last_name}
                      onChange={(e) => setCustomerForm({...customerForm, last_name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Telefon (Opsiyonel)"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                    />
                  </div>
                  <div className="inline-form-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAddCustomer(false)}>
                      İptal
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={handleAddCustomer}>
                      Ekle
                    </button>
                  </div>
                </div>
              )}

              {/* Product Selection */}
              <div className="form-group">
                <label className="form-label">Ürün Ekle {selectedWarehouse && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>(Stok seçili depoya göre)</span>}</label>
                <div className="product-actions">
                  <input
                    type="text"
                    className="form-input"
                    placeholder={selectedWarehouse ? "Ürün ara..." : "Önce depo seçin..."}
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    disabled={!selectedWarehouse}
                    style={{ marginBottom: '8px' }}
                  />
                  <select 
                    className="form-input"
                    onChange={(e) => {
                      const product = products.find(p => p.id === e.target.value)
                      if (product) {
                        addToCart(product)
                        e.target.value = ''
                        setProductSearchQuery('')
                      }
                    }}
                    defaultValue=""
                    disabled={!selectedWarehouse}
                  >
                    <option value="">{selectedWarehouse ? 'Listeden seç...' : 'Önce depo seçin...'}</option>
                    {selectedWarehouse && products
                      .filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()))
                      .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
                      .map(p => {
                        const stock = getStockForWarehouse(p.id)
                        const inCart = getCartQuantity(p.id)
                        const remaining = stock - inCart
                        const isOutOfStock = stock <= 0
                        const isMaxReached = remaining <= 0
                        
                        return (
                          <option 
                            key={p.id} 
                            value={p.id}
                            disabled={isOutOfStock || isMaxReached}
                            style={{ color: isOutOfStock ? '#ef4444' : isMaxReached ? '#f59e0b' : 'inherit' }}
                          >
                            {p.name} - ₺{p.price} {isOutOfStock ? '(Stok Yok)' : `(${remaining} adet)`}
                          </option>
                        )
                      })}
                  </select>
                </div>
              </div>

              {/* Cart */}
              <div className="cart-section">
                <h3 className="cart-title">
                  <Package size={16} />
                  Sepet ({cart.length} ürün)
                </h3>
                {cart.length === 0 ? (
                  <p className="cart-empty">Sepet boş</p>
                ) : (
                  <div className="cart-items">
                    {cart.map((item, index) => (
                      <div key={index} className="cart-item">
                        <div className="cart-item-info" style={{ flex: 2 }}>
                          <span className="cart-item-name">{item.product_name}</span>
                           <div className="cart-item-price-edit">
                             <label className="text-xs text-gray-500 block mb-1">Birim Fiyat</label>
                             <div className="flex items-center">
                               <span className="mr-1 text-gray-400">₺</span>
                               <input
                                 type="number"
                                 className="price-input"
                                 value={item.unit_price}
                                 onChange={(e) => updatePrice(index, Math.max(0, parseFloat(e.target.value) || 0))}
                                 min="0"
                                 step="0.01"
                                 style={{ width: '80px' }}
                               />
                             </div>
                           </div>
                         </div>
                        
                         <div className="cart-item-controls" style={{ flex: 3, display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                             <label className="text-xs text-gray-400 mb-1 font-medium" style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem', color: '#9ca3af' }}>
                               Adet <span style={{ color: item.quantity > item.available_stock ? '#ef4444' : '#6b7280' }}>/ max {item.available_stock}</span>
                             </label>
                             <input
                                type="number"
                                className={`form-input qty-input text-center ${item.quantity > item.available_stock ? 'stock-warning' : ''}`}
                                value={item.quantity === 0 ? '' : item.quantity}
                                onChange={(e) => {
                                  const val = e.target.value
                                  if (val === '') {
                                    // Allow empty temporarily
                                    setCart(cart.map((c, i) => i === index ? { ...c, quantity: 0 } : c))
                                  } else {
                                    const parsed = parseInt(val)
                                    if (!isNaN(parsed)) {
                                      const newQty = Math.min(Math.max(0, parsed), item.available_stock)
                                      setCart(cart.map((c, i) => i === index ? { ...c, quantity: newQty } : c))
                                    }
                                  }
                                }}
                                onBlur={() => {
                                  // Reset to 1 if empty or 0 when leaving input
                                  if (item.quantity <= 0) {
                                    setCart(cart.map((c, i) => i === index ? { ...c, quantity: 1 } : c))
                                  }
                                }}
                                min="1"
                                max={item.available_stock}
                                style={{ width: '60px' }}
                             />
                           </div>
                           
                           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                             <label className="text-xs text-gray-400 mb-1 font-medium" style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem', color: '#9ca3af' }}>Toplam</label>
                             <div className="flex items-center w-full" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                               <span className="mr-1 text-gray-400" style={{ marginRight: '4px', color: '#9ca3af' }}>₺</span>
                               <input
                                  type="number"
                                  className="form-input total-input text-right"
                                  value={item.quantity * item.unit_price === 0 ? '' : Math.round(item.quantity * item.unit_price * 100) / 100}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    const newTotal = val === '' ? 0 : parseFloat(val)
                                    if (!isNaN(newTotal) && newTotal >= 0 && item.quantity > 0) {
                                      updatePrice(index, newTotal / item.quantity)
                                    }
                                  }}
                                  min="0"
                                  step="0.01"
                                  placeholder="0"
                                  style={{ width: '100%', minWidth: '150px' }} // Large width
                               />
                             </div>
                           </div>

                          <button 
                            className="icon-btn danger ml-2"
                            onClick={() => removeFromCart(index)}
                            title="Sil"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="cart-total">
                <span>Toplam:</span>
                <span className="total-amount">₺{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={resetNewSale}>
                İptal
              </button>
              <button 
                className="btn btn-success" 
                onClick={handleCompleteSale}
                disabled={cart.length === 0 || isSubmitting}
              >
                <Check size={16} />
                {isSubmitting ? 'Kaydediliyor...' : 'Satışı Tamamla'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
