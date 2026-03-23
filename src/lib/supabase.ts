import { createClient } from '@supabase/supabase-js'
import { createMockClient } from './mockDatabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const useMockData = !supabaseUrl || !supabaseAnonKey

if (useMockData) {
  console.info('Supabase credentials not found. Using Mock Data Provider.')
  console.info('To use real data, configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file.')
}

export const supabase = useMockData 
  ? createMockClient() 
  : createClient(supabaseUrl!, supabaseAnonKey!)

// Database Types
export interface Product {
  id: string
  name: string
  price: number
  created_at: string
}

export interface Warehouse {
  id: string
  name: string
  location: string
}

export interface Inventory {
  id: string
  product_id: string
  warehouse_id: string
  quantity: number
  product?: Product
  warehouse?: Warehouse
}

export interface Customer {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  created_at: string
}

export interface Wholesaler {
  id: string
  company_name: string
  contact_person: string | null
  phone: string | null
  created_at: string
}

export interface Sale {
  id: string
  customer_id: string
  total_amount: number
  created_at: string
  customer?: Customer
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  warehouse_id: string
  quantity: number
  unit_price: number
  product?: Product
  warehouse?: Warehouse
}

export interface Purchase {
  id: string
  wholesaler_id: string
  total_amount: number
  created_at: string
  wholesaler?: Wholesaler
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  product_id: string
  warehouse_id: string
  quantity: number
  unit_price: number
  product?: Product
}

export interface Payment {
  id: string
  customer_id: string | null
  wholesaler_id: string | null
  amount: number
  payment_type: 'cash' | 'credit_card' | 'check' | 'promissory_note'
  due_date: string | null
  notes: string | null
  created_at: string
}

export interface CalendarNote {
  id: string
  date: string
  title: string
  description: string | null
  payment_id: string | null
  created_at: string
}
