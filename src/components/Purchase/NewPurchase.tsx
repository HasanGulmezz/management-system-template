import { useState } from 'react'
import { 
  Trash2, 
  X, Check, Package
} from 'lucide-react'
import { usePurchases, useProducts, useWholesalers, useWarehouses } from '../../hooks'
import type { PurchaseCartItem } from '../../hooks/usePurchases'
import '../../pages/Sales/Sales.css'

interface NewPurchaseProps {
  onClose: () => void
  onSuccess: () => void
}

interface WholesalerFormData {
  company_name: string
  contact_person: string
  phone: string
}

export default function NewPurchase({ onClose, onSuccess }: NewPurchaseProps) {
  const { createPurchase } = usePurchases()
  const { products } = useProducts()
  const { wholesalers, addWholesaler } = useWholesalers()
  const { warehouses } = useWarehouses()
  
  const [showAddWholesaler, setShowAddWholesaler] = useState(false)
  const [cart, setCart] = useState<PurchaseCartItem[]>([])
  const [selectedWholesaler, setSelectedWholesaler] = useState<string>('')
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('')
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wholesalerForm, setWholesalerForm] = useState<WholesalerFormData>({
    company_name: '', contact_person: '', phone: ''
  })

  // Add product to cart
  const addToCart = (product: { id: string; name: string; price: number }) => {
    const existingItem = cart.find(item => item.product_id === product.id)

    if (existingItem) {
      setCart(cart.map(item => 
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price
      }])
    }
  }

  // Update cart item quantity
  const updateQuantity = (index: number, newQty: number) => {
    // Allow 0 temporarily for editing, will reset on blur
    if (newQty < 0) return
    setCart(cart.map((item, i) => 
      i === index ? { ...item, quantity: newQty } : item
    ))
  }

  // Reset quantity to 1 if empty/0 on blur
  const handleQuantityBlur = (index: number) => {
    if (cart[index]?.quantity <= 0) {
      setCart(cart.map((item, i) => 
        i === index ? { ...item, quantity: 1 } : item
      ))
    }
  }

  // Update unit price
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

  // Add new wholesaler
  const handleAddWholesaler = async () => {
    if (!wholesalerForm.company_name) {
      setError('Şirket adı zorunludur')
      return
    }

    const { data, error: addError } = await addWholesaler({
      company_name: wholesalerForm.company_name,
      contact_person: wholesalerForm.contact_person || undefined,
      phone: wholesalerForm.phone || undefined
    })

    if (addError) {
      setError(addError)
    } else if (data) {
      setSelectedWholesaler(data.id)
      setShowAddWholesaler(false)
      setWholesalerForm({ company_name: '', contact_person: '', phone: '' })
    }
  }

  // Complete purchase
  const handleCompletePurchase = async () => {
    if (isSubmitting) return // Prevent double submit
    
    if (!selectedWholesaler) {
      setError('Lütfen bir toptancı seçin')
      return
    }
    if (!selectedWarehouse) {
      setError('Lütfen bir depo seçin')
      return
    }
    if (cart.length === 0) {
      setError('Sepet boş')
      return
    }

    setIsSubmitting(true)
    const { error: purchaseError } = await createPurchase(
      selectedWholesaler, 
      cart,
      selectedWarehouse
    )
    
    if (purchaseError) {
      setError(purchaseError)
      setIsSubmitting(false)
    } else {
      onSuccess()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal sale-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Yeni Alış</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          {error && <div className="form-error">{error}</div>}
          
          {/* Warehouse Selection */}
          <div className="form-group">
            <label className="form-label">Depoya Ekle</label>
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

          {/* Wholesaler Selection */}
          <div className="form-group">
            <label className="form-label">Toptancı</label>
            <div className="select-with-add">
              <select 
                className="form-input"
                value={selectedWholesaler}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    setShowAddWholesaler(true)
                  } else {
                    setSelectedWholesaler(e.target.value)
                  }
                }}
              >
                <option value="">Toptancı seçin...</option>
                <option value="new" className="add-new-option">+ Yeni Toptancı Ekle</option>
                {wholesalers
                  .slice()
                  .sort((a, b) => a.company_name.localeCompare(b.company_name, 'tr'))
                  .map(w => (
                  <option key={w.id} value={w.id}>{w.company_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Add Wholesaler Inline Form */}
          {showAddWholesaler && (
            <div className="inline-form card">
              <h4>Yeni Toptancı</h4>
              <div className="form-group">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Şirket Adı *"
                  value={wholesalerForm.company_name}
                  onChange={e => setWholesalerForm({...wholesalerForm, company_name: e.target.value})}
                />
              </div>
              <div className="form-row">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Yetkili Kişi"
                  value={wholesalerForm.contact_person}
                  onChange={e => setWholesalerForm({...wholesalerForm, contact_person: e.target.value})}
                />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Telefon"
                  value={wholesalerForm.phone}
                  onChange={e => setWholesalerForm({...wholesalerForm, phone: e.target.value})}
                />
              </div>
              <div className="inline-form-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddWholesaler(false)}>İptal</button>
                <button className="btn btn-primary btn-sm" onClick={handleAddWholesaler}>Kaydet</button>
              </div>
            </div>
          )}

          {/* Product Selection */}
          <div className="form-group">
            <label className="form-label">Ürün Ekle</label>
            <div className="product-actions">
              <input
                type="text"
                className="form-input"
                placeholder="Ürün ara..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
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
              >
                <option value="">Listeden seç...</option>
                {products
                  .filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()))
                  .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ₺{p.price}
                    </option>
                  ))}
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
                          <label className="text-xs text-gray-400 mb-1 font-medium" style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem', color: '#9ca3af' }}>Adet</label>
                          <input
                            type="number"
                            className="form-input qty-input text-center"
                            value={item.quantity === 0 ? '' : item.quantity}
                            onChange={(e) => {
                              const val = e.target.value
                              updateQuantity(index, val === '' ? 0 : parseInt(val) || 0)
                            }}
                            onBlur={() => handleQuantityBlur(index)}
                            min="1"
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
                              style={{ width: '100%', minWidth: '150px' }}
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
            
            <div className="cart-total">
              <span>Toplam Tutar:</span>
              <span className="total-amount">₺{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            İptal
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleCompletePurchase}
            disabled={cart.length === 0 || isSubmitting}
          >
            <Check size={18} />
            {isSubmitting ? 'Kaydediliyor...' : 'Alışı Tamamla'}
          </button>
        </div>
      </div>
    </div>
  )
}
