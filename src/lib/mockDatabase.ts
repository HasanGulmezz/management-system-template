// ============================================
// Mock Database - Supabase-compatible API
// Used when VITE_SUPABASE_URL is not configured
// ============================================

// Generate simple UUID-like IDs
const uid = () => crypto.randomUUID()

// ============================================
// SAMPLE DATA
// ============================================

const WAREHOUSES = [
  { id: 'w-001', name: 'Ana Depo', location: 'Merkez' },
  { id: 'w-002', name: 'Ek Depo 1', location: 'Şube 1' },
  { id: 'w-003', name: 'Ek Depo 2', location: 'Şube 2' },
]

const PRODUCTS = [
  { id: 'p-001', name: 'Ürün A - Premium', price: 185.50, created_at: '2026-01-15T10:00:00Z' },
  { id: 'p-002', name: 'Ürün B - Standart', price: 142.00, created_at: '2026-01-15T10:00:00Z' },
  { id: 'p-003', name: 'Ürün C - Ekonomik', price: 28.50, created_at: '2026-01-16T10:00:00Z' },
  { id: 'p-004', name: 'Ürün D - Profesyonel', price: 65.00, created_at: '2026-01-16T10:00:00Z' },
  { id: 'p-005', name: 'Ürün E - Özel Seri', price: 320.00, created_at: '2026-01-17T10:00:00Z' },
  { id: 'p-006', name: 'Ürün F - Klasik', price: 95.00, created_at: '2026-01-17T10:00:00Z' },
  { id: 'p-007', name: 'Ürün G - Avantaj', price: 45.00, created_at: '2026-01-18T10:00:00Z' },
  { id: 'p-008', name: 'Ürün H - Deluxe', price: 450.00, created_at: '2026-01-18T10:00:00Z' },
]

const INVENTORY = [
  // Ana Depo
  { id: uid(), product_id: 'p-001', warehouse_id: 'w-001', quantity: 150 },
  { id: uid(), product_id: 'p-002', warehouse_id: 'w-001', quantity: 200 },
  { id: uid(), product_id: 'p-003', warehouse_id: 'w-001', quantity: 300 },
  { id: uid(), product_id: 'p-004', warehouse_id: 'w-001', quantity: 100 },
  { id: uid(), product_id: 'p-005', warehouse_id: 'w-001', quantity: 80 },
  { id: uid(), product_id: 'p-006', warehouse_id: 'w-001', quantity: 120 },
  { id: uid(), product_id: 'p-007', warehouse_id: 'w-001', quantity: 250 },
  { id: uid(), product_id: 'p-008', warehouse_id: 'w-001', quantity: 40 },
  // Ek Depo 1
  { id: uid(), product_id: 'p-001', warehouse_id: 'w-002', quantity: 30 },
  { id: uid(), product_id: 'p-002', warehouse_id: 'w-002', quantity: 45 },
  { id: uid(), product_id: 'p-003', warehouse_id: 'w-002', quantity: 60 },
  { id: uid(), product_id: 'p-004', warehouse_id: 'w-002', quantity: 25 },
  { id: uid(), product_id: 'p-005', warehouse_id: 'w-002', quantity: 15 },
  { id: uid(), product_id: 'p-006', warehouse_id: 'w-002', quantity: 35 },
  { id: uid(), product_id: 'p-007', warehouse_id: 'w-002', quantity: 50 },
  { id: uid(), product_id: 'p-008', warehouse_id: 'w-002', quantity: 10 },
  // Ek Depo 2
  { id: uid(), product_id: 'p-001', warehouse_id: 'w-003', quantity: 10 },
  { id: uid(), product_id: 'p-002', warehouse_id: 'w-003', quantity: 15 },
  { id: uid(), product_id: 'p-003', warehouse_id: 'w-003', quantity: 20 },
  { id: uid(), product_id: 'p-004', warehouse_id: 'w-003', quantity: 8 },
  { id: uid(), product_id: 'p-005', warehouse_id: 'w-003', quantity: 5 },
  { id: uid(), product_id: 'p-006', warehouse_id: 'w-003', quantity: 12 },
  { id: uid(), product_id: 'p-007', warehouse_id: 'w-003', quantity: 18 },
  { id: uid(), product_id: 'p-008', warehouse_id: 'w-003', quantity: 3 },
]

const CUSTOMERS = [
  { id: 'c-001', first_name: 'Ahmet', last_name: 'Yılmaz', phone: '0532 111 22 33', created_at: '2026-01-10T10:00:00Z' },
  { id: 'c-002', first_name: 'Fatma', last_name: 'Demir', phone: '0533 222 33 44', created_at: '2026-01-11T10:00:00Z' },
  { id: 'c-003', first_name: 'Mehmet', last_name: 'Kaya', phone: '0534 333 44 55', created_at: '2026-01-12T10:00:00Z' },
  { id: 'c-004', first_name: 'Ayşe', last_name: 'Öztürk', phone: '0535 444 55 66', created_at: '2026-01-13T10:00:00Z' },
  { id: 'c-005', first_name: 'Mustafa', last_name: 'Şahin', phone: '0536 555 66 77', created_at: '2026-01-14T10:00:00Z' },
]

const WHOLESALERS = [
  { id: 'ws-001', company_name: 'Alfa Tedarik', contact_person: 'Ali Acar', phone: '0312 111 22 33', created_at: '2026-01-05T10:00:00Z' },
  { id: 'ws-002', company_name: 'Beta Dağıtım', contact_person: 'Veli Güneş', phone: '0312 222 33 44', created_at: '2026-01-06T10:00:00Z' },
  { id: 'ws-003', company_name: 'Gamma Ticaret', contact_person: 'Selin Aydın', phone: '0312 333 44 55', created_at: '2026-01-07T10:00:00Z' },
]

const now = new Date()
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString()

const SALES = [
  { id: 's-001', customer_id: 'c-001', total_amount: 371.00, created_at: daysAgo(7) },
  { id: 's-002', customer_id: 'c-002', total_amount: 185.50, created_at: daysAgo(6) },
  { id: 's-003', customer_id: 'c-003', total_amount: 256.50, created_at: daysAgo(5) },
  { id: 's-004', customer_id: null, total_amount: 78.00, created_at: daysAgo(4) },
  { id: 's-005', customer_id: 'c-004', total_amount: 545.00, created_at: daysAgo(3) },
  { id: 's-006', customer_id: 'c-005', total_amount: 320.00, created_at: daysAgo(2) },
  { id: 's-007', customer_id: 'c-001', total_amount: 125.00, created_at: daysAgo(1) },
  { id: 's-008', customer_id: 'c-002', total_amount: 450.00, created_at: daysAgo(0) },
]

const SALE_ITEMS = [
  { id: 'si-001', sale_id: 's-001', product_id: 'p-001', warehouse_id: 'w-002', quantity: 1, unit_price: 185.50 },
  { id: 'si-002', sale_id: 's-001', product_id: 'p-002', warehouse_id: 'w-002', quantity: 1, unit_price: 185.50 },
  { id: 'si-003', sale_id: 's-002', product_id: 'p-001', warehouse_id: 'w-002', quantity: 1, unit_price: 185.50 },
  { id: 'si-004', sale_id: 's-003', product_id: 'p-003', warehouse_id: 'w-002', quantity: 2, unit_price: 28.50 },
  { id: 'si-005', sale_id: 's-003', product_id: 'p-004', warehouse_id: 'w-002', quantity: 1, unit_price: 65.00 },
  { id: 'si-006', sale_id: 's-004', product_id: 'p-003', warehouse_id: 'w-003', quantity: 1, unit_price: 78.00 },
  { id: 'si-007', sale_id: 's-005', product_id: 'p-008', warehouse_id: 'w-002', quantity: 1, unit_price: 450.00 },
  { id: 'si-008', sale_id: 's-005', product_id: 'p-006', warehouse_id: 'w-002', quantity: 1, unit_price: 95.00 },
  { id: 'si-009', sale_id: 's-006', product_id: 'p-005', warehouse_id: 'w-002', quantity: 1, unit_price: 320.00 },
  { id: 'si-010', sale_id: 's-007', product_id: 'p-004', warehouse_id: 'w-002', quantity: 1, unit_price: 65.00 },
  { id: 'si-011', sale_id: 's-007', product_id: 'p-007', warehouse_id: 'w-002', quantity: 1, unit_price: 45.00 },
  { id: 'si-012', sale_id: 's-008', product_id: 'p-008', warehouse_id: 'w-002', quantity: 1, unit_price: 450.00 },
]

const PURCHASES = [
  { id: 'pu-001', wholesaler_id: 'ws-001', total_amount: 8250.00, created_at: daysAgo(14) },
  { id: 'pu-002', wholesaler_id: 'ws-002', total_amount: 4200.00, created_at: daysAgo(10) },
  { id: 'pu-003', wholesaler_id: 'ws-001', total_amount: 2875.00, created_at: daysAgo(7) },
  { id: 'pu-004', wholesaler_id: 'ws-003', total_amount: 6400.00, created_at: daysAgo(3) },
]

const PURCHASE_ITEMS = [
  { id: 'pi-001', purchase_id: 'pu-001', product_id: 'p-001', warehouse_id: 'w-001', quantity: 50, unit_price: 150.00 },
  { id: 'pi-002', purchase_id: 'pu-001', product_id: 'p-002', warehouse_id: 'w-001', quantity: 25, unit_price: 105.00 },
  { id: 'pi-003', purchase_id: 'pu-002', product_id: 'p-003', warehouse_id: 'w-002', quantity: 100, unit_price: 21.00 },
  { id: 'pi-004', purchase_id: 'pu-002', product_id: 'p-004', warehouse_id: 'w-002', quantity: 40, unit_price: 50.00 },
  { id: 'pi-005', purchase_id: 'pu-003', product_id: 'p-006', warehouse_id: 'w-001', quantity: 25, unit_price: 95.00 },
  { id: 'pi-006', purchase_id: 'pu-004', product_id: 'p-008', warehouse_id: 'w-001', quantity: 20, unit_price: 320.00 },
]

const PAYMENTS: any[] = [
  { id: 'pay-001', customer_id: 'c-001', wholesaler_id: null, amount: 250.00, payment_type: 'cash', due_date: null, notes: 'Nakit ödeme', created_at: daysAgo(6) },
  { id: 'pay-002', customer_id: 'c-002', wholesaler_id: null, amount: 100.00, payment_type: 'credit_card', due_date: null, notes: 'Kart ile ödeme', created_at: daysAgo(5) },
  { id: 'pay-003', customer_id: 'c-003', wholesaler_id: null, amount: 150.00, payment_type: 'cash', due_date: null, notes: 'Kısmi ödeme', created_at: daysAgo(4) },
  { id: 'pay-004', customer_id: 'c-004', wholesaler_id: null, amount: 300.00, payment_type: 'credit_card', due_date: null, notes: null, created_at: daysAgo(3) },
  { id: 'pay-005', customer_id: null, wholesaler_id: 'ws-001', amount: 5000.00, payment_type: 'check', due_date: new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0], notes: 'Alfa 1. çek', created_at: daysAgo(10) },
  { id: 'pay-006', customer_id: null, wholesaler_id: 'ws-002', amount: 2500.00, payment_type: 'promissory_note', due_date: new Date(now.getTime() + 45 * 86400000).toISOString().split('T')[0], notes: 'Beta senet', created_at: daysAgo(8) },
]

const todayStr = new Date().toISOString().split('T')[0]
const futureDate = (d: number) => new Date(now.getTime() + d * 86400000).toISOString().split('T')[0]

const CALENDAR_NOTES: any[] = [
  { id: 'cn-001', date: todayStr, title: 'Günlük Kontrol', description: 'Stok kontrolü yapılacak', payment_id: null, created_at: daysAgo(1) },
  { id: 'cn-002', date: futureDate(2), title: 'Randevu', description: 'Müşteri görüşmesi', payment_id: null, created_at: daysAgo(1) },
  { id: 'cn-003', date: futureDate(5), title: 'Depo Transferi', description: 'Ana Depodan Ek Depo 1"e transfer', payment_id: null, created_at: daysAgo(1) },
  { id: 'cn-004', date: futureDate(7), title: 'Toplantı', description: 'Haftalık değerlendirme', payment_id: null, created_at: daysAgo(1) },
  { id: 'cn-005', date: futureDate(30), title: 'Çek Vadesi', description: 'Alfa 1. çek vadesi', payment_id: 'pay-005', created_at: daysAgo(10) },
]

// ============================================
// IN-MEMORY STORE
// ============================================

type TableName = 'products' | 'warehouses' | 'inventory' | 'customers' | 'wholesalers' | 
  'sales' | 'sale_items' | 'purchases' | 'purchase_items' | 'payments' | 'calendar_notes'

const store: Record<TableName, any[]> = {
  products: [...PRODUCTS],
  warehouses: [...WAREHOUSES],
  inventory: [...INVENTORY],
  customers: [...CUSTOMERS],
  wholesalers: [...WHOLESALERS],
  sales: [...SALES],
  sale_items: [...SALE_ITEMS],
  purchases: [...PURCHASES],
  purchase_items: [...PURCHASE_ITEMS],
  payments: [...PAYMENTS],
  calendar_notes: [...CALENDAR_NOTES],
}

// ============================================
// RELATION RESOLVER
// ============================================

function resolveRelations(row: any, selectStr: string, tableName: string): any {
  const result = { ...row }

  // Parse select string for relations like: customer:customers(first_name, last_name)
  const relationRegex = /(\w+):(\w+)\(([^)]*)\)/g
  let match

  while ((match = relationRegex.exec(selectStr)) !== null) {
    const [, alias, relTable, fields] = match
    const relData = store[relTable as TableName]
    if (!relData) continue

    // Determine the FK lookup
    const fkField = `${alias}_id` in row ? `${alias}_id` : 
                     `${tableName.replace(/s$/, '')}_id`
    const fkValue = row[fkField] || row[`${alias}_id`]

    if (!fkValue) {
      result[alias] = null
      continue
    }

    if (fields === '*') {
      // Return nested with its own relations
      const related = relData.filter(r => {
        // For child relations (sale_items for a sale), match by parent ID
        if (`${tableName.replace(/s$/, '')}_id` in r) {
          return r[`${tableName.replace(/s$/, '')}_id`] === row.id
        }
        return r.id === fkValue
      })
      
      if (related.length === 1 && related[0].id === fkValue) {
        result[alias] = related[0]
      } else {
        result[alias] = related
      }
    } else {
      // Return only specified fields
      const relRow = relData.find(r => r.id === fkValue)
      if (relRow) {
        const fieldList = fields.split(',').map(f => f.trim())
        const picked: any = {}
        fieldList.forEach(f => { picked[f] = relRow[f] })
        result[alias] = picked
      } else {
        result[alias] = null
      }
    }
  }

  // Handle child relations without alias: sale_items(id) or sale_items(*, product:products(*))
  const childRegex = /(?<!\w:)(\w+)\(([^)]*(?:\([^)]*\))*[^)]*)\)/g
  const selectClean = selectStr.replace(relationRegex, '') // Remove already processed
  let childMatch
  while ((childMatch = childRegex.exec(selectClean)) !== null) {
    const [, childTable, childFields] = childMatch
    if (childTable in store) {
      const parentIdField = `${tableName.replace(/s$/, '')}_id`
      let children = store[childTable as TableName].filter(r => r[parentIdField] === row.id)
      
      // Resolve nested relations in children
      if (childFields.includes(':')) {
        children = children.map(c => resolveRelations(c, childFields, childTable))
      }

      result[childTable] = children
    }
  }

  return result
}

// ============================================
// QUERY BUILDER (Supabase-compatible)
// ============================================

class MockQueryBuilder {
  private table: TableName
  private _select = '*'
  private _filters: Array<{ field: string; op: string; value: any }> = []
  private _order: { field: string; ascending: boolean } | null = null
  private _single = false
  private _insertData: any = null
  private _updateData: any = null
  private _deleteMode = false
  private _upsertData: any = null
  private _upsertConflict: string | null = null
  private _notFilters: Array<{ field: string; op: string; value: any }> = []

  constructor(table: TableName) {
    this.table = table
  }

  select(fields = '*') {
    this._select = fields
    return this
  }

  insert(data: any) {
    this._insertData = Array.isArray(data) ? data : [data]
    return this
  }

  update(data: any) {
    this._updateData = data
    return this
  }

  delete() {
    this._deleteMode = true
    return this
  }

  upsert(data: any, options?: { onConflict?: string }) {
    this._upsertData = data
    this._upsertConflict = options?.onConflict || null
    return this
  }

  eq(field: string, value: any) {
    this._filters.push({ field, op: 'eq', value })
    return this
  }

  not(field: string, op: string, value: any) {
    this._notFilters.push({ field, op, value })
    return this
  }

  order(field: string, options?: { ascending?: boolean }) {
    this._order = { field, ascending: options?.ascending ?? true }
    return this
  }

  single() {
    this._single = true
    return this
  }

  // Execute and return promise-like result
  async then(resolve: (value: any) => void, reject?: (reason: any) => void) {
    try {
      const result = this.execute()
      resolve(result)
    } catch (e) {
      if (reject) reject(e)
    }
  }

  private execute(): { data: any; error: any } {
    // INSERT
    if (this._insertData) {
      const inserted = this._insertData.map((item: any) => ({
        id: uid(),
        created_at: new Date().toISOString(),
        ...item,
      }))
      store[this.table].push(...inserted)
      
      if (this._single) {
        return { data: inserted[0], error: null }
      }
      if (this._select) {
        return { data: this._single ? inserted[0] : inserted, error: null }
      }
      return { data: inserted, error: null }
    }

    // UPSERT
    if (this._upsertData) {
      const conflictFields = this._upsertConflict?.split(',') || ['id']
      const existing = store[this.table].findIndex(row => 
        conflictFields.every(f => row[f.trim()] === this._upsertData[f.trim()])
      )
      if (existing >= 0) {
        store[this.table][existing] = { ...store[this.table][existing], ...this._upsertData }
      } else {
        store[this.table].push({ id: uid(), ...this._upsertData })
      }
      return { data: this._upsertData, error: null }
    }

    // DELETE
    if (this._deleteMode) {
      store[this.table] = store[this.table].filter(row => 
        !this._filters.every(f => row[f.field] === f.value)
      )
      return { data: null, error: null }
    }

    // UPDATE
    if (this._updateData) {
      store[this.table] = store[this.table].map(row => {
        if (this._filters.every(f => row[f.field] === f.value)) {
          return { ...row, ...this._updateData }
        }
        return row
      })
      return { data: null, error: null }
    }

    // SELECT
    let data = [...store[this.table]]

    // Apply eq filters
    for (const filter of this._filters) {
      data = data.filter(row => row[filter.field] === filter.value)
    }

    // Apply not filters
    for (const filter of this._notFilters) {
      if (filter.op === 'is') {
        data = data.filter(row => row[filter.field] !== filter.value)
      }
    }

    // Resolve relations
    if (this._select && this._select !== '*') {
      data = data.map(row => resolveRelations(row, this._select, this.table))
    }

    // Sort
    if (this._order) {
      const { field, ascending } = this._order
      data.sort((a, b) => {
        if (a[field] < b[field]) return ascending ? -1 : 1
        if (a[field] > b[field]) return ascending ? 1 : -1
        return 0
      })
    }

    if (this._single) {
      return { data: data[0] || null, error: data.length === 0 ? { message: 'Not found' } : null }
    }

    return { data, error: null }
  }
}

// ============================================
// RPC FUNCTIONS
// ============================================

function rpcGetProductsWithStock() {
  return store.products.map(p => {
    const stockEntries = store.inventory.filter(i => i.product_id === p.id)
    const stockWithNames = stockEntries.map(s => {
      const wh = store.warehouses.find(w => w.id === s.warehouse_id)
      return {
        warehouse_id: s.warehouse_id,
        warehouse_name: wh?.name || '',
        quantity: s.quantity,
      }
    })
    return {
      ...p,
      stock: stockWithNames,
      total_stock: stockEntries.reduce((sum, s) => sum + s.quantity, 0),
    }
  })
}

function rpcGetDashboardStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const yearStart = new Date(today.getFullYear(), 0, 1)

  const todaySales = store.sales
    .filter(s => new Date(s.created_at) >= today)
    .reduce((sum, s) => sum + Number(s.total_amount), 0)

  const monthSales = store.sales
    .filter(s => new Date(s.created_at) >= monthStart)
    .reduce((sum, s) => sum + Number(s.total_amount), 0)

  const yearSales = store.sales
    .filter(s => new Date(s.created_at) >= yearStart)
    .reduce((sum, s) => sum + Number(s.total_amount), 0)

  // Low stock products
  const lowStock = store.products
    .map(p => ({
      name: p.name,
      total_stock: store.inventory
        .filter(i => i.product_id === p.id)
        .reduce((sum, i) => sum + i.quantity, 0),
    }))
    .filter(p => p.total_stock < 5)
    .slice(0, 5)

  // Recent sales
  const recentSales = [...store.sales]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map(s => {
      const customer = store.customers.find(c => c.id === s.customer_id)
      return {
        id: s.id,
        total_amount: s.total_amount,
        created_at: s.created_at,
        customer_name: customer ? `${customer.first_name} ${customer.last_name}` : 'Anonim',
      }
    })

  return {
    total_products: store.products.length,
    total_customers: store.customers.length,
    total_wholesalers: store.wholesalers.length,
    today_sales: todaySales,
    month_sales: monthSales,
    year_sales: yearSales,
    low_stock_products: lowStock.length > 0 ? lowStock : null,
    recent_sales: recentSales.length > 0 ? recentSales : null,
  }
}

function rpcGetCustomerBalance(customerId: string): number {
  const totalSales = store.sales
    .filter(s => s.customer_id === customerId)
    .reduce((sum, s) => sum + Number(s.total_amount), 0)

  const totalPayments = store.payments
    .filter(p => p.customer_id === customerId)
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return totalSales - totalPayments
}

function rpcGetWholesalerBalance(wholesalerId: string): number {
  const totalPurchases = store.purchases
    .filter(p => p.wholesaler_id === wholesalerId)
    .reduce((sum, p) => sum + Number(p.total_amount), 0)

  const totalPayments = store.payments
    .filter(p => p.wholesaler_id === wholesalerId)
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return totalPurchases - totalPayments
}

function rpcGetAccountBalances() {
  const customerDebts = store.customers.map(c => {
    const debt = rpcGetCustomerBalance(c.id)
    return {
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      type: 'customer',
      total_debt: debt,
    }
  }).filter(c => c.total_debt > 0)

  const wholesalerDebts = store.wholesalers.map(w => {
    const debt = rpcGetWholesalerBalance(w.id)
    return {
      id: w.id,
      name: w.company_name,
      type: 'wholesaler',
      total_debt: debt,
    }
  }).filter(w => w.total_debt > 0)

  return [...customerDebts, ...wholesalerDebts].sort((a, b) => b.total_debt - a.total_debt)
}

// ============================================
// MOCK SUPABASE CLIENT
// ============================================

export function createMockClient() {
  return {
    from(table: string) {
      return new MockQueryBuilder(table as TableName)
    },
    async rpc(funcName: string, params?: any) {
      switch (funcName) {
        case 'get_products_with_stock':
          return { data: rpcGetProductsWithStock(), error: null }
        case 'get_dashboard_stats':
          return { data: rpcGetDashboardStats(), error: null }
        case 'get_customer_balance':
          return { data: rpcGetCustomerBalance(params.customer_uuid), error: null }
        case 'get_wholesaler_balance':
          return { data: rpcGetWholesalerBalance(params.wholesaler_uuid), error: null }
        case 'get_account_balances':
          return { data: rpcGetAccountBalances(), error: null }
        default:
          return { data: null, error: { message: `Unknown RPC: ${funcName}` } }
      }
    }
  }
}
