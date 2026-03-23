import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface PurchaseWithDetails {
  id: string
  wholesaler_id: string
  wholesaler_name: string
  total_amount: number
  created_at: string
  item_count: number
  product_names: string[] // For search functionality
}

export interface PurchaseCartItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
}

export function usePurchases() {
  const [purchases, setPurchases] = useState<PurchaseWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPurchases = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          *,
          wholesaler:wholesalers(company_name),
          purchase_items(
            id,
            product:products(name)
          )
        `)
        .order('created_at', { ascending: false })

      if (purchasesError) throw purchasesError

      const purchasesWithDetails: PurchaseWithDetails[] = (purchasesData || []).map((p: any) => ({
        ...p,
        wholesaler_name: p.wholesaler?.company_name || 'Bilinmeyen',
        item_count: p.purchase_items?.length || 0,
        product_names: (p.purchase_items || []).map((item: any) => item.product?.name || '').filter(Boolean)
      }))

      setPurchases(purchasesWithDetails)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPurchases()
  }, [fetchPurchases])

  const createPurchase = async (
    wholesalerId: string, 
    items: PurchaseCartItem[],
    warehouseId: string
  ) => {
    try {
      // Calculate total
      const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

      // Create purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert([{
          wholesaler_id: wholesalerId,
          total_amount: totalAmount
        }])
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // Create purchase items
      const purchaseItems = items.map(item => ({
        purchase_id: purchase.id,
        product_id: item.product_id,
        warehouse_id: warehouseId,
        quantity: item.quantity,
        unit_price: item.unit_price
      }))

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItems)

      if (itemsError) throw itemsError

      // Update inventory (increase)
      for (const item of items) {
        const { data: currentStock } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('product_id', item.product_id)
          .eq('warehouse_id', warehouseId)
          .single()

        const newQuantity = (currentStock?.quantity || 0) + item.quantity

        await supabase
          .from('inventory')
          .upsert({
            product_id: item.product_id,
            warehouse_id: warehouseId,
            quantity: newQuantity
          }, {
            onConflict: 'product_id,warehouse_id'
          })
      }

      await fetchPurchases()
      return { data: purchase, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  const getPurchaseDetails = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          wholesaler:wholesalers(*),
          purchase_items(
            *,
            product:products(*)
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

  const deletePurchase = async (id: string) => {
    try {
      // First get purchase items to decrease stock
      const { data: purchaseItems } = await supabase
        .from('purchase_items')
        .select('*')
        .eq('purchase_id', id)

      // Delete purchase (cascade deletes items)
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Decrease inventory
      if (purchaseItems) {
        for (const item of purchaseItems) {
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
              quantity: newQuantity
            }, {
              onConflict: 'product_id,warehouse_id'
            })
        }
      }

      await fetchPurchases()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  // Update purchase item prices and recalculate total
  const updatePurchaseItems = async (purchaseId: string, updatedItems: { id: string; unit_price: number; quantity: number }[]) => {
    try {
      for (const item of updatedItems) {
        const { error } = await supabase
          .from('purchase_items')
          .update({ unit_price: item.unit_price })
          .eq('id', item.id)

        if (error) throw error
      }

      const newTotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

      const { error: purchaseError } = await supabase
        .from('purchases')
        .update({ total_amount: newTotal })
        .eq('id', purchaseId)

      if (purchaseError) throw purchaseError

      await fetchPurchases()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  return {
    purchases,
    loading,
    error,
    refetch: fetchPurchases,
    createPurchase,
    getPurchaseDetails,
    updatePurchaseItems,
    deletePurchase
  }
}
