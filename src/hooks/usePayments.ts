import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type PaymentType = 'cash' | 'credit_card' | 'check' | 'promissory_note' | 'debt_forgiveness'

export interface Payment {
  id: string
  customer_id: string | null
  wholesaler_id: string | null
  amount: number
  payment_type: PaymentType
  notes: string | null
  created_at: string
  // Joined data
  customer_name?: string
  wholesaler_name?: string
}

export const CUSTOMER_PAYMENT_TYPES: { value: PaymentType; label: string }[] = [
  { value: 'cash', label: 'Nakit' },
  { value: 'credit_card', label: 'Kredi Kartı' }
]

export const WHOLESALER_PAYMENT_TYPES: { value: PaymentType; label: string }[] = [
  { value: 'check', label: 'Çek' },
  { value: 'promissory_note', label: 'Senet' }
]

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all payments
  const fetchPayments = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        customer:customers(first_name, last_name),
        wholesaler:wholesalers(company_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching payments:', error)
    } else {
      const mappedData = (data || []).map((p: any) => ({
        ...p,
        customer_name: p.customer 
          ? `${p.customer.first_name} ${p.customer.last_name}` 
          : null,
        wholesaler_name: p.wholesaler?.company_name || null
      }))
      setPayments(mappedData)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  // Get payments for a customer
  const getCustomerPayments = useCallback((customerId: string) => {
    return payments.filter(p => p.customer_id === customerId)
  }, [payments])

  // Get payments for a wholesaler
  const getWholesalerPayments = useCallback((wholesalerId: string) => {
    return payments.filter(p => p.wholesaler_id === wholesalerId)
  }, [payments])

  // Get specific payment details
  const getPaymentDetails = useCallback(async (paymentId: string) => {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        customer:customers(first_name, last_name),
        wholesaler:wholesalers(company_name)
      `)
      .eq('id', paymentId)
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  }, [])

  // Add customer payment (tahsilat from customer)
  const addCustomerPayment = async (
    customerId: string, 
    amount: number, 
    paymentType: 'cash' | 'credit_card',
    notes?: string
  ) => {
    const { data, error } = await supabase
      .from('payments')
      .insert({ 
        customer_id: customerId, 
        amount, 
        payment_type: paymentType,
        notes 
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    await fetchPayments()
    return { data, error: null }
  }

  // Close customer debt: record payment + forgive remaining difference
  const closeCustomerDebt = async (
    customerId: string,
    paymentAmount: number,
    remainingDebt: number,
    paymentType: 'cash' | 'credit_card',
    notes?: string
  ) => {
    try {
      // 1. Record the actual payment
      const { error: payError } = await supabase
        .from('payments')
        .insert({
          customer_id: customerId,
          amount: paymentAmount,
          payment_type: paymentType,
          notes: notes || undefined
        })

      if (payError) throw payError

      // 2. Record the forgiven difference as debt_forgiveness
      const forgiveAmount = remainingDebt - paymentAmount
      if (forgiveAmount > 0) {
        const { error: forgiveError } = await supabase
          .from('payments')
          .insert({
            customer_id: customerId,
            amount: forgiveAmount,
            payment_type: 'debt_forgiveness',
            notes: `Borç helalleştirildi (₺${forgiveAmount.toLocaleString()} silindi)`
          })

        if (forgiveError) throw forgiveError
      }

      await fetchPayments()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  // Add wholesaler payment (our payment to wholesaler)
  const addWholesalerPayment = async (
    wholesalerId: string, 
    amount: number, 
    paymentType: 'check' | 'promissory_note',
    notes?: string,
    dueDate?: string
  ) => {
    const { data, error } = await supabase
      .from('payments')
      .insert({ 
        wholesaler_id: wholesalerId, 
        amount, 
        payment_type: paymentType,
        notes,
        due_date: dueDate
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    await fetchPayments()
    return { data, error: null }
  }


  // Calculate customer debt (total sales - total payments)
  const calculateCustomerDebt = async (customerId: string): Promise<number> => {
    const { data, error } = await supabase.rpc('get_customer_balance', { customer_uuid: customerId })
    if (error) {
      console.error('Error calculating customer debt:', error)
      return 0
    }
    return Number(data)
  }

  // Calculate wholesaler debt (total purchases - total payments)
  const calculateWholesalerDebt = async (wholesalerId: string): Promise<number> => {
    const { data, error } = await supabase.rpc('get_wholesaler_balance', { wholesaler_uuid: wholesalerId })
    if (error) {
      console.error('Error calculating wholesaler debt:', error)
      return 0
    }
    return Number(data)
  }

  // Fetch all debts using RPC (High Performance)
  const fetchDebts = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_account_balances')
    
    if (error) {
      console.error('Error fetching debts:', error)
      return []
    }
    
    return data || []
  }, [])

  // Filter by type
  const customerPayments = payments.filter(p => p.customer_id !== null)
  const wholesalerPayments = payments.filter(p => p.wholesaler_id !== null)

  // Delete a payment
  const deletePayment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchPayments()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Hata oluştu' }
    }
  }

  return {
    payments,
    customerPayments,
    wholesalerPayments,
    loading,
    getCustomerPayments,
    getWholesalerPayments,
    getPaymentDetails,
    addCustomerPayment,
    closeCustomerDebt,
    addWholesalerPayment,
    deletePayment,
    calculateCustomerDebt,
    calculateWholesalerDebt,
    fetchDebts,
    refetch: fetchPayments
  }
}

