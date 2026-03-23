-- ============================================
-- COMPLETE DATABASE REBUILD SCRIPT
-- Management System Template
-- Version: 1.0.0
-- Last Updated: 2026-01-31
-- ============================================
-- 
-- FEATURES INCLUDED:
-- ✅ Products with multi-warehouse inventory
-- ✅ Customers and Wholesalers
-- ✅ Sales and Purchases with items
-- ✅ Payments (cash, credit_card, check, promissory_note)
-- ✅ Calendar notes with auto payment reminders
-- ✅ Dashboard stats function
-- ✅ Customer/Wholesaler balance functions
-- ✅ Row Level Security (RLS) enabled
--
-- IMPORTANT CONSTRAINTS:
-- • Product deletion: Sets product_id to NULL in sale_items/purchase_items (preserves history)
-- • Customer/Wholesaler deletion: Sets to NULL in related tables (preserves records)
-- • Payments: No party check - allows orphaned payments when customer/wholesaler deleted
--
-- ============================================
-- WARNING: This script will DROP all existing tables and recreate them.
-- Run this only on a fresh database or after backing up data.
-- ============================================

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS calendar_notes CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS purchase_items CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS stock CASCADE; -- Legacy table name
DROP TABLE IF EXISTS wholesalers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS get_products_with_stock() CASCADE;
DROP FUNCTION IF EXISTS get_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS get_customer_balance(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_wholesaler_balance(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_account_balances() CASCADE;
DROP FUNCTION IF EXISTS create_payment_reminder() CASCADE;

-- ============================================
-- 1. PRODUCTS
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. WAREHOUSES
-- ============================================
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  location TEXT
);

-- Default warehouses
INSERT INTO warehouses (name) VALUES ('Ana Depo'),('Dükkan'), ('Yayla');

-- ============================================
-- 3. INVENTORY (Product-Warehouse Stock)
-- ============================================
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, warehouse_id)
);

-- ============================================
-- 4. CUSTOMERS
-- ============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. WHOLESALERS
-- ============================================
CREATE TABLE wholesalers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 6. SALES
-- ============================================
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. SALE_ITEMS
-- ============================================
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL
);

-- ============================================
-- 8. PURCHASES
-- ============================================
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wholesaler_id UUID REFERENCES wholesalers(id) ON DELETE SET NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 9. PURCHASE_ITEMS
-- ============================================
CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL
);

-- ============================================
-- 10. PAYMENTS
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  wholesaler_id UUID REFERENCES wholesalers(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'credit_card', 'check', 'promissory_note')),
  due_date DATE, -- Required for check/promissory_note
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Note: No party check constraint - allows orphaned payments when customer/wholesaler is deleted
  -- Due date required for check/promissory_note
  CONSTRAINT due_date_required CHECK (
    (payment_type IN ('check', 'promissory_note') AND due_date IS NOT NULL) 
    OR payment_type NOT IN ('check', 'promissory_note')
  )
);

-- ============================================
-- 11. CALENDAR_NOTES
-- ============================================
CREATE TABLE calendar_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE, -- For auto-generated payment reminders
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- 1. Get Products with Stock
CREATE OR REPLACE FUNCTION get_products_with_stock()
RETURNS TABLE (
  id uuid,
  name text,
  price numeric,
  created_at timestamptz,
  stock json,
  total_stock bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.price,
    p.created_at,
    COALESCE((
      SELECT json_agg(json_build_object(
        'warehouse_id', w.id,
        'warehouse_name', w.name,
        'quantity', COALESCE(i.quantity, 0)
      ))
      FROM warehouses w
      LEFT JOIN inventory i ON i.warehouse_id = w.id AND i.product_id = p.id
    ), '[]'::json) AS stock,
    COALESCE((
      SELECT sum(quantity)
      FROM inventory
      WHERE product_id = p.id
    ), 0) AS total_stock
  FROM products p
  ORDER BY p.created_at DESC;
END;
$$;

-- 2. Get Dashboard Stats
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_products', (SELECT count(*) FROM products),
    'total_customers', (SELECT count(*) FROM customers),
    'total_wholesalers', (SELECT count(*) FROM wholesalers),
    'today_sales', (
      SELECT COALESCE(sum(total_amount), 0) 
      FROM sales 
      WHERE created_at >= CURRENT_DATE
    ),
    'month_sales', (
      SELECT COALESCE(sum(total_amount), 0) 
      FROM sales 
      WHERE created_at >= date_trunc('month', CURRENT_DATE)
    ),
    'year_sales', (
      SELECT COALESCE(sum(total_amount), 0) 
      FROM sales 
      WHERE created_at >= date_trunc('year', CURRENT_DATE)
    ),
    'low_stock_products', (
      SELECT json_agg(t) FROM (
        SELECT p.name, COALESCE(sum(i.quantity), 0) as total_stock
        FROM products p
        LEFT JOIN inventory i ON i.product_id = p.id
        GROUP BY p.id, p.name
        HAVING COALESCE(sum(i.quantity), 0) < 5
        LIMIT 5
      ) t
    ),
    'recent_sales', (
      SELECT json_agg(t) FROM (
        SELECT 
          s.id, 
          s.total_amount, 
          s.created_at,
          COALESCE(c.first_name || ' ' || c.last_name, 'Anonim') as customer_name
        FROM sales s
        LEFT JOIN customers c ON c.id = s.customer_id
        ORDER BY s.created_at DESC
        LIMIT 5
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- 3. Get Customer Balance
CREATE OR REPLACE FUNCTION get_customer_balance(customer_uuid UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
  total_sales DECIMAL;
  total_payments DECIMAL;
BEGIN
  SELECT COALESCE(sum(total_amount), 0) INTO total_sales
  FROM sales WHERE customer_id = customer_uuid;

  SELECT COALESCE(sum(amount), 0) INTO total_payments
  FROM payments WHERE customer_id = customer_uuid;

  RETURN total_sales - total_payments;
END;
$$;

-- 4. Get Wholesaler Balance
CREATE OR REPLACE FUNCTION get_wholesaler_balance(wholesaler_uuid UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
  total_purchases DECIMAL;
  total_payments DECIMAL;
BEGIN
  SELECT COALESCE(sum(total_amount), 0) INTO total_purchases
  FROM purchases WHERE wholesaler_id = wholesaler_uuid;

  SELECT COALESCE(sum(amount), 0) INTO total_payments
  FROM payments WHERE wholesaler_id = wholesaler_uuid;

  RETURN total_purchases - total_payments;
END;
$$;

-- 5. Get All Account Balances
CREATE OR REPLACE FUNCTION get_account_balances()
RETURNS TABLE (
  id uuid,
  name text,
  type text,
  total_debt decimal
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH customer_totals AS (
    SELECT 
      c.id,
      (c.first_name || ' ' || c.last_name) AS name,
      'customer' AS type,
      COALESCE(sum(s.total_amount), 0) AS total_debit,
      COALESCE((SELECT sum(p.amount) FROM payments p WHERE p.customer_id = c.id), 0) AS total_credit
    FROM customers c
    LEFT JOIN sales s ON s.customer_id = c.id
    GROUP BY c.id, c.first_name, c.last_name
  ),
  wholesaler_totals AS (
    SELECT 
      w.id,
      w.company_name AS name,
      'wholesaler' AS type,
      COALESCE(sum(pu.total_amount), 0) AS total_credit,
      COALESCE((SELECT sum(p.amount) FROM payments p WHERE p.wholesaler_id = w.id), 0) AS total_debit
    FROM wholesalers w
    LEFT JOIN purchases pu ON pu.wholesaler_id = w.id
    GROUP BY w.id, w.company_name
  )
  
  SELECT 
    ct.id,
    ct.name::text,
    ct.type::text,
    (ct.total_debit - ct.total_credit) AS total_debt
  FROM customer_totals ct
  WHERE (ct.total_debit - ct.total_credit) > 0

  UNION ALL

  SELECT 
    wt.id,
    wt.name::text,
    wt.type::text,
    (wt.total_credit - wt.total_debit) AS total_debt
  FROM wholesaler_totals wt
  WHERE (wt.total_credit - wt.total_debit) > 0
  
  ORDER BY total_debt DESC;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create calendar note for check/promissory_note payments
CREATE OR REPLACE FUNCTION create_payment_reminder()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_type IN ('check', 'promissory_note') AND NEW.due_date IS NOT NULL AND NEW.wholesaler_id IS NOT NULL THEN
    INSERT INTO calendar_notes (date, title, description, payment_id)
    SELECT 
      NEW.due_date,
      w.company_name || ' - ₺' || NEW.amount::TEXT || ' ' || 
        CASE NEW.payment_type 
          WHEN 'check' THEN 'Çek' 
          WHEN 'promissory_note' THEN 'Senet' 
        END || ' Son Gün',
      'Vade tarihi gelen ödeme. Tutar: ₺' || NEW.amount::TEXT,
      NEW.id
    FROM wholesalers w
    WHERE w.id = NEW.wholesaler_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_reminder_trigger
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION create_payment_reminder();

-- ============================================
-- ROW LEVEL SECURITY (RLS) for Supabase
-- ============================================
-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesalers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_notes ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all for authenticated" ON products FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON warehouses FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON inventory FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON wholesalers FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON sales FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON sale_items FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON purchases FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON purchase_items FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON payments FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON calendar_notes FOR ALL USING (true);

-- ============================================
-- DONE
-- ============================================
