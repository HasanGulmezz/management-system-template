import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Product, Warehouse } from '../lib/supabase'

export interface ProductWithStock extends Product {
  stock: {
    warehouse_id: string
    warehouse_name: string
    quantity: number
  }[]
  total_stock: number
}

export function useProducts() {
  const [products, setProducts] = useState<ProductWithStock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Use RPC for efficient data fetching (Joins handled in DB)
      const { data, error } = await supabase.rpc('get_products_with_stock')

      if (error) throw error

      setProducts((data || []).map((p: any) => {
        // Parse stock if it comes as a string (Supabase RPC edge case)
        let parsedStock = p.stock
        if (typeof parsedStock === 'string') {
          try {
            parsedStock = JSON.parse(parsedStock)
          } catch (e) {
            console.error('Failed to parse stock JSON', e)
            parsedStock = []
          }
        } else if (!Array.isArray(parsedStock)) {
          parsedStock = []
        }

        return {
          ...p,
          stock: parsedStock,
          total_stock: Number(p.total_stock || 0)
        }
      }) as ProductWithStock[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const addProduct = async (product: { name: string; price: number }) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single()

      if (error) throw error

      // Create stock entries for all warehouses
      const { data: warehouses } = await supabase.from('warehouses').select('id')
      if (warehouses) {
        await supabase.from('inventory').insert(
          warehouses.map((wh: any) => ({
            product_id: data.id,
            warehouse_id: wh.id,
            quantity: 0
          }))
        )
      }

      await fetchProducts()
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      await fetchProducts()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  const updateStock = async (productId: string, warehouseId: string, quantity: number) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .upsert({
          product_id: productId,
          warehouse_id: warehouseId,
          quantity
        }, {
          onConflict: 'product_id,warehouse_id'
        })

      if (error) throw error
      await fetchProducts()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchProducts()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    addProduct,
    updateProduct,
    updateStock,
    deleteProduct
  }
}

export function useWarehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWarehouses = async () => {
      const { data } = await supabase
        .from('warehouses')
        .select('*')
        .order('name')
      
      setWarehouses(data || [])
      setLoading(false)
    }

    fetchWarehouses()
  }, [])

  return { warehouses, loading }
}
