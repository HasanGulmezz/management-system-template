import { useState } from 'react'
import { Package, Plus, Search, Warehouse, BarChart3, Trash2, X, Check, Edit2, Save } from 'lucide-react'
import { useProducts, useWarehouses } from '../../hooks'
import type { ProductWithStock } from '../../hooks/useProducts'
import './Stock.css'

type ViewMode = 'all' | string

interface ProductFormData {
  name: string
  price: string
}

interface EditStockData {
  [warehouseId: string]: number
}

export default function Stock() {
  const { products, loading, addProduct, updateProduct, updateStock, deleteProduct } = useProducts()
  const { warehouses } = useWarehouses()
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>({ name: '', price: '' })
  
  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(null)
  const [editForm, setEditForm] = useState<ProductFormData>({ name: '', price: '' })
  const [editStockForm, setEditStockForm] = useState<EditStockData>({})
  
  // Inline Stock Edit State (keeping for quick updates if needed, or we could remove)
  const [editingStock, setEditingStock] = useState<{ productId: string; warehouseId: string } | null>(null)
  const [stockValue, setStockValue] = useState('')
  
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [showStockWarningModal, setShowStockWarningModal] = useState(false)

  // Filter products
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddProduct = async () => {
    if (!formData.name || !formData.price) {
      setFormError('Ürün adı ve fiyatı zorunludur')
      return
    }

    const { error } = await addProduct({
      name: formData.name,
      price: parseFloat(formData.price)
    })

    if (error) {
      setFormError(error)
    } else {
      setShowAddModal(false)
      setFormData({ name: '', price: '' })
      setFormError('')
    }
  }

  // Open Edit Modal
  const handleEditClick = (product: ProductWithStock) => {
    setEditingProduct(product)
    setEditForm({
      name: product.name,
      price: product.price.toString()
    })
    
    // Initialize stock form with current values
    const initialStock: EditStockData = {}
    warehouses.forEach(wh => {
      const stock = product.stock.find(s => s.warehouse_id === wh.id)?.quantity || 0
      initialStock[wh.id] = stock
    })
    setEditStockForm(initialStock)
    
    setShowEditModal(true)
    setDeleteConfirm(false)
    setFormError('')
  }



  // Save Edits
  const handleEditSave = async () => {
    if (!editingProduct) return
    
    // 1. Update Product Details
    const { error: productError } = await updateProduct(editingProduct.id, {
      name: editForm.name,
      price: parseFloat(editForm.price)
    })
    
    if (productError) {
      setFormError('Ürün güncellenemedi')
      return
    }

    // 2. Update Stocks
    for (const [warehouseId, quantity] of Object.entries(editStockForm)) {
      await updateStock(editingProduct.id, warehouseId, quantity)
    }

    setShowEditModal(false)
    setEditingProduct(null)
  }

  const handleDelete = async () => {
    if (!editingProduct) return
    
    const { error } = await deleteProduct(editingProduct.id)
    if (error) {
      setFormError('Ürün silinemedi')
    } else {
      setShowEditModal(false)
      setShowStockWarningModal(false)
      setDeleteConfirm(false)
      setEditingProduct(null)
    }
  }

  // İlk onaydan sonra stok kontrolü
  const handleFirstConfirm = () => {
    if (!editingProduct) return
    
    if (editingProduct.total_stock > 0) {
      // Stok varsa ikinci popup aç
      setShowStockWarningModal(true)
    } else {
      // Stok yoksa direkt sil
      handleDelete()
    }
  }

  // Quick Inline Update (Still keeping this as it's useful for viewing table)
  const handleStockUpdate = async (productId: string, warehouseId: string) => {
    const quantity = parseInt(stockValue)
    if (isNaN(quantity) || quantity < 0) return

    await updateStock(productId, warehouseId, quantity)
    setEditingStock(null)
    setStockValue('')
  }

  const getStockForWarehouse = (product: typeof products[0], warehouseId: string) => {
    return product.stock.find(s => s.warehouse_id === warehouseId)?.quantity || 0
  }

  return (
    <div className="stock-page animate-slideUp">
      <header className="page-header">
        <h1 className="page-title">Stok Yönetimi</h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          Yeni Ürün
        </button>
      </header>

      {/* Filters */}
      <div className="filters-row">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Ürün adı ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            <BarChart3 size={16} />
            Tümü
          </button>
          {warehouses.map(wh => (
            <button
              key={wh.id}
              className={`filter-tab ${viewMode === wh.id ? 'active' : ''}`}
              onClick={() => setViewMode(wh.id)}
            >
              <Warehouse size={16} />
              {wh.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Table */}
      <div className="stock-table-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="table-container">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th>Fiyat</th>
                  {viewMode === 'all' ? (
                    <>
                      {warehouses.map(wh => (
                        <th key={wh.id}>{wh.name}</th>
                      ))}
                      <th>Toplam</th>
                    </>
                  ) : (
                    <th>{warehouses.find(w => w.id === viewMode)?.name || 'Stok'}</th>
                  )}
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={viewMode === 'all' ? 4 + warehouses.length : 4}>
                      <div className="empty-state">
                        <Package size={48} className="empty-state-icon" />
                        <p className="empty-state-title">Henüz ürün eklenmemiş</p>
                        <p>Yeni ürün ekleyerek başlayın</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>₺{product.price.toLocaleString()}</td>
                      {viewMode === 'all' ? (
                        <>
                          {warehouses.map(wh => {
                            const stock = getStockForWarehouse(product, wh.id)
                            const isEditing = editingStock?.productId === product.id && editingStock?.warehouseId === wh.id
                            
                            return (
                              <td key={wh.id} data-label={wh.name} className="mobile-hide">
                                {isEditing ? (
                                  <div className="stock-edit">
                                    <input
                                      type="number"
                                      value={stockValue}
                                      onChange={(e) => setStockValue(e.target.value)}
                                      className="form-input stock-input"
                                      min="0"
                                      autoFocus
                                    />
                                    <button 
                                      className="icon-btn success"
                                      onClick={() => handleStockUpdate(product.id, wh.id)}
                                    >
                                      <Check size={14} />
                                    </button>
                                    <button 
                                      className="icon-btn"
                                      onClick={() => setEditingStock(null)}
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <span 
                                    className={`stock-value ${stock === 0 ? 'zero' : ''}`}
                                    onClick={() => {
                                      setEditingStock({ productId: product.id, warehouseId: wh.id })
                                      setStockValue(stock.toString())
                                    }}
                                  >
                                    {stock}
                                  </span>
                                )}
                              </td>
                            )
                          })}
                          <td data-label="Toplam Stok">
                            <span className={`badge ${product.total_stock === 0 ? 'badge-error' : 'badge-success'}`}>
                              {product.total_stock}
                            </span>
                          </td>
                        </>
                      ) : (
                        <td data-label={warehouses.find(w => w.id === viewMode)?.name || 'Stok'}>
                          {(() => {
                            const stock = getStockForWarehouse(product, viewMode)
                            return (
                              <div className="stock-control justify-center">
                                <span className={`stock-value ${stock <= 5 ? 'critical' : ''}`}>
                                  {stock}
                                </span>
                              </div>
                            )
                          })()}
                        </td>
                      )}
                      <td data-label="İşlemler">
                        <div className="action-buttons">
                          <button 
                            className="icon-btn"
                            onClick={() => handleEditClick(product)}
                            title="Düzenle"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Yeni Ürün Ekle</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {formError && <div className="form-error">{formError}</div>}
              
              <div className="form-group">
                <label className="form-label">Ürün Adı</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ürün adını girin"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Fiyat (₺)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                İptal
              </button>
              <button className="btn btn-primary" onClick={handleAddProduct}>
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Ürün Düzenle</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {formError && <div className="form-error">{formError}</div>}
              
              <div className="form-section-title">Ürün Bilgileri</div>
              <div className="form-grid">
                
                <div className="form-group">
                  <label className="form-label">Ürün Adı</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fiyat (₺)</label>
                  <input
                    type="number"
                    className="form-input"
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-section-title mt-4">Stok Adetleri</div>
              <div className="stock-edit-list">
                {warehouses.map(wh => (
                  <div key={wh.id} className="stock-edit-item">
                    <span className="stock-edit-label">
                      <Warehouse size={16} />
                      {wh.name}
                    </span>
                    <input
                      type="number"
                      className="form-input stock-input-large"
                      min="0"
                      value={editStockForm[wh.id] ?? 0}
                      onChange={(e) => setEditStockForm({
                        ...editStockForm,
                        [wh.id]: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                ))}
              </div>

            </div>
            <div className="modal-footer flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              {/* Left Side: Delete Action */}
              <div className="footer-left">
                {deleteConfirm ? (
                   <div className="delete-confirm-small" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                     <span style={{ fontSize: '13px', color: 'var(--color-error)', fontWeight: 500 }}>Emin misiniz?</span>
                     <button 
                       className="btn btn-sm btn-danger"
                       onClick={handleFirstConfirm}
                       style={{ padding: '4px 12px', fontSize: '13px' }}
                     >
                       Evet
                     </button>
                     <button 
                       className="btn btn-sm btn-secondary"
                       onClick={() => setDeleteConfirm(false)}
                       style={{ padding: '4px 12px', fontSize: '13px' }}
                     >
                       Hayır
                     </button>
                   </div>
                ) : (
                  <button 
                    className="btn-danger-minimal"
                    onClick={() => setDeleteConfirm(true)}
                    title="Bu ürünü sil"
                  >
                    <Trash2 size={18} />
                    <span>Sil</span>
                  </button>
                )}
              </div>

              {/* Right Side: Primary Actions */}
              <div className="footer-right" style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  İptal
                </button>
                <button className="btn btn-primary" onClick={handleEditSave}>
                  <Save size={18} />
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Warning Modal - İkinci onay popup'ı */}
      {showStockWarningModal && editingProduct && (
        <div className="modal-overlay" onClick={() => setShowStockWarningModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h2 className="modal-title" style={{ color: 'var(--color-warning)' }}>⚠️ Dikkat!</h2>
              <button className="modal-close" onClick={() => setShowStockWarningModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', paddingTop: '8px' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '12px' }}>
                <strong>{editingProduct.name}</strong> ürününde
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-error)', marginBottom: '12px' }}>
                {editingProduct.total_stock} adet
              </p>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                stok bulunmaktadır.
              </p>
              <p style={{ color: 'var(--color-error)', fontWeight: 500 }}>
                Bu ürünü silmek istediğinize emin misiniz?
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', gap: '16px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowStockWarningModal(false)}
              >
                Vazgeç
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDelete}
              >
                <Trash2 size={18} />
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
