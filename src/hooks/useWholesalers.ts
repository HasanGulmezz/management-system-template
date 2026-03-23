import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Wholesaler } from '../lib/supabase'

export interface WholesalerWithStats extends Wholesaler {
  total_purchases: number
  purchase_count: number
  debt: number
}

export function useWholesalers() {
  const [wholesalers, setWholesalers] = useState<WholesalerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWholesalers = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: wholesalersData, error: wholesalersError } = await supabase
        .from('wholesalers')
        .select('*')
        .order('created_at', { ascending: false })

      if (wholesalersError) throw wholesalersError

      const { data: purchasesData } = await supabase
        .from('purchases')
        .select('wholesaler_id, total_amount')

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('wholesaler_id, amount')
        .not('wholesaler_id', 'is', null)

      const wholesalersWithStats: WholesalerWithStats[] = (wholesalersData || []).map((wholesaler: any) => {
        const wholesalerPurchases = (purchasesData || []).filter((p: any) => p.wholesaler_id === wholesaler.id)
        const wholesalerPayments = (paymentsData || []).filter((p: any) => p.wholesaler_id === wholesaler.id)
        
        const totalPurchases = wholesalerPurchases.reduce((sum: number, p: any) => sum + Number(p.total_amount), 0)
        const totalPaid = wholesalerPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
        
        return {
          ...wholesaler,
          total_purchases: totalPurchases,
          purchase_count: wholesalerPurchases.length,
          debt: totalPurchases - totalPaid
        }
      })

      setWholesalers(wholesalersWithStats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWholesalers()
  }, [fetchWholesalers])

  const addWholesaler = async (wholesaler: { company_name: string; contact_person?: string; phone?: string }) => {
    try {
      const { data, error } = await supabase
        .from('wholesalers')
        .insert([wholesaler])
        .select()
        .single()

      if (error) throw error
      await fetchWholesalers()
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  const updateWholesaler = async (id: string, updates: Partial<Wholesaler>) => {
    try {
      const { error } = await supabase
        .from('wholesalers')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      await fetchWholesalers()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  const deleteWholesaler = async (id: string) => {
    try {
      const { error } = await supabase
        .from('wholesalers')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchWholesalers()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  const getWholesalerWithPurchases = async (id: string) => {
    try {
      const { data: wholesaler, error: wholesalerError } = await supabase
        .from('wholesalers')
        .select('*')
        .eq('id', id)
        .single()

      if (wholesalerError) throw wholesalerError

      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          *,
          purchase_items(
            *,
            product:products(*)
          )
        `)
        .eq('wholesaler_id', id)
        .order('created_at', { ascending: false })

      if (purchasesError) throw purchasesError

      return { 
        data: { 
          ...wholesaler, 
          purchases: purchases || [],
          total_purchases: (purchases || []).reduce((sum: number, p: any) => sum + Number(p.total_amount), 0)
        }, 
        error: null 
      }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  return {
    wholesalers,
    loading,
    error,
    refetch: fetchWholesalers,
    addWholesaler,
    updateWholesaler,
    deleteWholesaler,
    getWholesalerWithPurchases
  }
}
