import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Sale, SaleItem } from '../lib/supabase'

export interface SaleWithDetails extends Sale {
  customer_name: string
  item_count: number
  items?: SaleItem[]
}

export interface CartItem {
  product_id: string
  product_name: string
  warehouse_id: string
  warehouse_name: string
  quantity: number
  unit_price: number
  available_stock: number
}

export function useSales() {
  const [sales, setSales] = useState<SaleWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSales = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(first_name, last_name),
          sale_items(id)
        `)
        .order('created_at', { ascending: false })

      if (salesError) throw salesError

      const salesWithDetails: SaleWithDetails[] = (salesData || []).map((sale: any) => ({
        ...sale,
        customer_name: sale.customer 
          ? `${sale.customer.first_name} ${sale.customer.last_name}` 
          : 'Anonim',
        item_count: sale.sale_items?.length || 0
      }))

      setSales(salesWithDetails)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  const createSale = async (
    customerId: string | null, 
    items: CartItem[]
  ) => {
    try {
      // Calculate total
      const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{
          customer_id: customerId,
          total_amount: totalAmount
        }])
        .select()
        .single()

      if (saleError) throw saleError

      // Create sale items
      const saleItems = items.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id,
        warehouse_id: item.warehouse_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }))

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems)

      if (itemsError) throw itemsError

      // Update inventory (decrease)
      for (const item of items) {
        const { data: currentStock } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('product_id', item.product_id)
          .eq('warehouse_id', item.warehouse_id)
          .single()

        const newQuantity = (currentStock?.quantity || 0) - item.quantity

        await supabase
          .from('inventory')
          .upsert({
            product_id: item.product_id,
            warehouse_id: item.warehouse_id,
            quantity: Math.max(0, newQuantity)
          }, {
            onConflict: 'product_id,warehouse_id'
          })
      }

      await fetchSales()
      return { data: sale, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  const getSaleDetails = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(*),
          sale_items(
            *,
            product:products(*),
            warehouse:warehouses(*)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  // Update sale item prices and recalculate total
  const updateSaleItems = async (saleId: string, updatedItems: { id: string; unit_price: number; quantity: number }[]) => {
    try {
      // Update each item's unit_price
      for (const item of updatedItems) {
        const { error } = await supabase
          .from('sale_items')
          .update({ unit_price: item.unit_price })
          .eq('id', item.id)

        if (error) throw error
      }

      // Recalculate total_amount
      const newTotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

      const { error: saleError } = await supabase
        .from('sales')
        .update({ total_amount: newTotal })
        .eq('id', saleId)

      if (saleError) throw saleError

      await fetchSales()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  const deleteSale = async (id: string) => {
    try {
      // First get sale items to restore stock
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', id)

      // Delete sale (cascade deletes items)
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Restore inventory
      if (saleItems) {
        for (const item of saleItems) {
          const { data: currentStock } = await supabase
            .from('inventory')
            .select('quantity')
            .eq('product_id', item.product_id)
            .eq('warehouse_id', item.warehouse_id)
            .single()

          await supabase
            .from('inventory')
            .upsert({
              product_id: item.product_id,
              warehouse_id: item.warehouse_id,
              quantity: (currentStock?.quantity || 0) + item.quantity
            }, {
              onConflict: 'product_id,warehouse_id'
            })
        }
      }

      await fetchSales()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  return {
    sales,
    loading,
    error,
    refetch: fetchSales,
    createSale,
    getSaleDetails,
    updateSaleItems,
    deleteSale
  }
}
