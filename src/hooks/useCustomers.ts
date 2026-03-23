import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Customer } from '../lib/supabase'

export interface CustomerWithStats extends Customer {
  total_spent: number
  sale_count: number
  balance: number
}

export function useCustomers() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (customersError) throw customersError

      // Fetch sales to calculate stats
      const { data: salesData } = await supabase
        .from('sales')
        .select('customer_id, total_amount')

      // Fetch payments to calculate balance
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('customer_id, amount')
        .not('customer_id', 'is', null)

      // Calculate stats for each customer
      const customersWithStats: CustomerWithStats[] = (customersData || []).map((customer: any) => {
        const customerSales = (salesData || []).filter((s: any) => s.customer_id === customer.id)
        const customerPayments = (paymentsData || []).filter((p: any) => p.customer_id === customer.id)
        
        const totalSpent = customerSales.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0)
        const totalPaid = customerPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
        
        return {
          ...customer,
          total_spent: totalSpent,
          sale_count: customerSales.length,
          balance: totalSpent - totalPaid
        }
      })

      setCustomers(customersWithStats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const addCustomer = async (customer: { first_name: string; last_name: string; phone?: string }) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select()
        .single()

      if (error) throw error
      await fetchCustomers()
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      await fetchCustomers()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchCustomers()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  const getCustomerWithSales = async (id: string) => {
    try {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

      if (customerError) throw customerError

      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items(
            *,
            product:products(*),
            warehouse:warehouses(*)
          )
        `)
        .eq('customer_id', id)
        .order('created_at', { ascending: false })

      if (salesError) throw salesError

      return { 
        data: { 
          ...customer, 
          sales: sales || [],
          total_spent: (sales || []).reduce((sum: number, s: any) => sum + Number(s.total_amount), 0)
        }, 
        error: null 
      }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  return {
    customers,
    loading,
    error,
    refetch: fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerWithSales
  }
}
