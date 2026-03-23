-- ============================================
-- TEST DATA SEED SCRIPT (EXTENDED)
-- Management System - Sample Data
-- ============================================
-- Run this AFTER database_rebuild.sql
-- ============================================

-- ============================================
-- 1. PRODUCTS (İlaçlar - 40 ürün)
-- ============================================
INSERT INTO products (id, name, price) VALUES
  -- Antibiyotikler
  ('11111111-1111-1111-1111-111111111111', 'Augmentin 1000mg', 185.50),
  ('11111111-1111-1111-1111-111111111112', 'Augmentin 625mg', 145.00),
  ('22222222-2222-2222-2222-222222222222', 'Cipro 500mg', 142.00),
  ('22222222-2222-2222-2222-222222222223', 'Cipro 750mg', 185.00),
  ('11111111-1111-1111-1111-111111111113', 'Amoksil 500mg', 95.00),
  ('11111111-1111-1111-1111-111111111114', 'Klacid 500mg', 210.00),
  -- Ağrı Kesici / Ateş Düşürücü
  ('33333333-3333-3333-3333-333333333333', 'Parol 500mg', 28.50),
  ('33333333-3333-3333-3333-333333333334', 'Parol 650mg', 35.00),
  ('44444444-4444-4444-4444-444444444444', 'Majezik 100mg', 65.00),
  ('44444444-4444-4444-4444-444444444445', 'Majezik Forte', 85.00),
  ('55555555-5555-5555-5555-555555555555', 'Nurofen 400mg', 78.00),
  ('55555555-5555-5555-5555-555555555556', 'Nurofen Cold Flu', 92.00),
  ('66666666-6666-6666-6666-666666666666', 'Voltaren 75mg', 125.00),
  ('66666666-6666-6666-6666-666666666667', 'Voltaren Jel', 95.00),
  ('77777777-7777-7777-7777-777777777777', 'Vermidon', 32.00),
  ('88888888-8888-8888-8888-888888888888', 'Gripin', 45.00),
  ('88888888-8888-8888-8888-888888888889', 'Gripin Hot', 55.00),
  ('99999999-9999-9999-9999-999999999999', 'Tylol Hot', 52.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Coraspin 100mg', 38.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'Coraspin 300mg', 52.00),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Aspirin 500mg', 42.00),
  -- Soğuk Algınlığı
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', 'Theraflu', 68.00),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbd', 'Fervex', 75.00),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbe', 'Benuron 500mg', 32.00),
  -- Mide / Sindirim
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbf1', 'Nexium 40mg', 180.00),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbf2', 'Lansor 30mg', 145.00),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbf3', 'Rennie', 48.00),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbf4', 'Gaviscon', 85.00),
  -- Alerji
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbf5', 'Zyrtec 10mg', 65.00),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbf6', 'Aerius 5mg', 78.00),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbf7', 'Avil 25mg', 42.00),
  -- Psikiyatri
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Xanax 0.5mg', 165.00),
  ('cccccccc-cccc-cccc-cccc-cccccccccccd', 'Xanax 1mg', 220.00),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Concerta 18mg', 320.00),
  ('dddddddd-dddd-dddd-dddd-ddddddddddde', 'Concerta 36mg', 450.00),
  ('dddddddd-dddd-dddd-dddd-dddddddddddf', 'Lustral 50mg', 175.00),
  -- Diyabet / Kronik
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Lantus 100IU', 450.00),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', 'Novorapid', 380.00),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef1', 'Glucophage 1000mg', 85.00),
  -- Solunum
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Ventolin Inhaler', 95.00),
  ('ffffffff-ffff-ffff-ffff-fffffffffff1', 'Seretide Diskus', 285.00),
  ('ffffffff-ffff-ffff-ffff-fffffffffff2', 'Pulmicort', 195.00);

-- ============================================
-- 2. INVENTORY (Stok - 3 Depo x 42 ürün)
-- ============================================
DO $$
DECLARE
  ana_depo_id UUID;
  dukkan_id UUID;
  yayla_id UUID;
  product_rec RECORD;
BEGIN
  SELECT id INTO ana_depo_id FROM warehouses WHERE name = 'Ana Depo';
  SELECT id INTO dukkan_id FROM warehouses WHERE name = 'Dükkan';
  SELECT id INTO yayla_id FROM warehouses WHERE name = 'Yayla';

  -- Her ürün için 3 depoya stok ekle
  FOR product_rec IN SELECT id FROM products LOOP
    -- Ana Depo: 80-300 arası rastgele stok
    INSERT INTO inventory (product_id, warehouse_id, quantity) 
    VALUES (product_rec.id, ana_depo_id, 80 + floor(random() * 220)::int);
    
    -- Dükkan: 20-80 arası
    INSERT INTO inventory (product_id, warehouse_id, quantity) 
    VALUES (product_rec.id, dukkan_id, 20 + floor(random() * 60)::int);
    
    -- Yayla: 5-40 arası
    INSERT INTO inventory (product_id, warehouse_id, quantity) 
    VALUES (product_rec.id, yayla_id, 5 + floor(random() * 35)::int);
  END LOOP;
END $$;

-- ============================================
-- 3. CUSTOMERS (Müşteriler - 25 kişi)
-- ============================================
INSERT INTO customers (id, first_name, last_name, phone) VALUES
  ('c0000001-0001-0001-0001-000000000001', 'Ahmet', 'Yılmaz', '0532 111 22 33'),
  ('c0000002-0002-0002-0002-000000000002', 'Fatma', 'Demir', '0533 222 33 44'),
  ('c0000003-0003-0003-0003-000000000003', 'Mehmet', 'Kaya', '0534 333 44 55'),
  ('c0000004-0004-0004-0004-000000000004', 'Ayşe', 'Öztürk', '0535 444 55 66'),
  ('c0000005-0005-0005-0005-000000000005', 'Mustafa', 'Şahin', '0536 555 66 77'),
  ('c0000006-0006-0006-0006-000000000006', 'Zeynep', 'Arslan', '0537 666 77 88'),
  ('c0000007-0007-0007-0007-000000000007', 'Ali', 'Çelik', '0538 777 88 99'),
  ('c0000008-0008-0008-0008-000000000008', 'Emine', 'Aydın', '0539 888 99 00'),
  ('c0000009-0009-0009-0009-000000000009', 'Hüseyin', 'Koç', '0530 999 00 11'),
  ('c000000a-000a-000a-000a-00000000000a', 'Hatice', 'Yıldız', '0531 000 11 22'),
  ('c000000b-000b-000b-000b-00000000000b', 'İbrahim', 'Erdoğan', '0541 111 22 33'),
  ('c000000c-000c-000c-000c-00000000000c', 'Hacer', 'Özkan', '0542 222 33 44'),
  ('c000000d-000d-000d-000d-00000000000d', 'Osman', 'Aksoy', '0543 333 44 55'),
  ('c000000e-000e-000e-000e-00000000000e', 'Şerife', 'Polat', '0544 444 55 66'),
  ('c000000f-000f-000f-000f-00000000000f', 'Süleyman', 'Özdemir', '0545 555 66 77'),
  ('c0000010-0010-0010-0010-000000000010', 'Elif', 'Çetin', '0546 666 77 88'),
  ('c0000011-0011-0011-0011-000000000011', 'Yusuf', 'Kılıç', '0547 777 88 99'),
  ('c0000012-0012-0012-0012-000000000012', 'Meryem', 'Şen', '0548 888 99 00'),
  ('c0000013-0013-0013-0013-000000000013', 'Ömer', 'Kurt', '0549 999 00 11'),
  ('c0000014-0014-0014-0014-000000000014', 'Fadime', 'Doğan', '0550 000 11 22'),
  ('c0000015-0015-0015-0015-000000000015', 'Recep', 'Güneş', '0551 111 22 33'),
  ('c0000016-0016-0016-0016-000000000016', 'Halime', 'Kara', '0552 222 33 44'),
  ('c0000017-0017-0017-0017-000000000017', 'Abdullah', 'Tekin', '0553 333 44 55'),
  ('c0000018-0018-0018-0018-000000000018', 'Cemile', 'Acar', '0554 444 55 66'),
  ('c0000019-0019-0019-0019-000000000019', 'Kemal', 'Yavuz', '0555 555 66 77');

-- ============================================
-- 4. WHOLESALERS (Toptancılar - 12 firma)
-- ============================================
INSERT INTO wholesalers (id, company_name, contact_person, phone) VALUES
  ('a0000001-0001-0001-0001-000000000001', 'Selçuk Ecza Deposu', 'Ali Selçuk', '0312 111 22 33'),
  ('a0000002-0002-0002-0002-000000000002', 'Hedef Ecza Deposu', 'Veli Hedef', '0312 222 33 44'),
  ('a0000003-0003-0003-0003-000000000003', 'Nevzat Ecza Deposu', 'Nevzat Bey', '0312 333 44 55'),
  ('a0000004-0004-0004-0004-000000000004', 'Aktif Ecza Deposu', 'Kemal Aktif', '0312 444 55 66'),
  ('a0000005-0005-0005-0005-000000000005', 'Nobel İlaç', 'Selin Nobel', '0312 555 66 77'),
  ('a0000006-0006-0006-0006-000000000006', 'Pharmavision', 'Burak Özkan', '0312 666 77 88'),
  ('a0000007-0007-0007-0007-000000000007', 'Gözde Ecza', 'Gözde Yılmaz', '0312 777 88 99'),
  ('a0000008-0008-0008-0008-000000000008', 'Sağlık Deposu', 'Hasan Sağlık', '0312 888 99 00'),
  ('a0000009-0009-0009-0009-000000000009', 'Medline Ecza', 'Fatih Med', '0312 999 00 11'),
  ('a000000a-000a-000a-000a-00000000000a', 'Eczacıbaşı Depo', 'Serkan Ecza', '0312 000 11 22'),
  ('a000000b-000b-000b-000b-00000000000b', 'Abdi İbrahim Depo', 'Abdi Bey', '0312 111 22 34'),
  ('a000000c-000c-000c-000c-00000000000c', 'Deva Holding Depo', 'Deva Hanım', '0312 222 33 45');

-- ============================================
-- 5. SALES (Satışlar - 30 satış)
-- ============================================
INSERT INTO sales (id, customer_id, total_amount, created_at) VALUES
  -- Son 2 hafta satışları
  ('b0000001-0001-0001-0001-000000000001', 'c0000001-0001-0001-0001-000000000001', 371.00, NOW() - INTERVAL '14 days'),
  ('b0000002-0002-0002-0002-000000000002', 'c0000002-0002-0002-0002-000000000002', 185.50, NOW() - INTERVAL '13 days'),
  ('b0000003-0003-0003-0003-000000000003', 'c0000003-0003-0003-0003-000000000003', 256.50, NOW() - INTERVAL '12 days'),
  ('b0000004-0004-0004-0004-000000000004', 'c0000001-0001-0001-0001-000000000001', 125.00, NOW() - INTERVAL '11 days'),
  ('b0000005-0005-0005-0005-000000000005', NULL, 78.00, NOW() - INTERVAL '10 days'),
  ('b0000006-0006-0006-0006-000000000006', 'c0000004-0004-0004-0004-000000000004', 545.00, NOW() - INTERVAL '9 days'),
  ('b0000007-0007-0007-0007-000000000007', 'c0000005-0005-0005-0005-000000000005', 320.00, NOW() - INTERVAL '8 days'),
  ('b0000008-0008-0008-0008-000000000008', 'c0000006-0006-0006-0006-000000000006', 95.00, NOW() - INTERVAL '7 days'),
  ('b0000009-0009-0009-0009-000000000009', NULL, 142.00, NOW() - INTERVAL '6 days'),
  ('b000000a-000a-000a-000a-00000000000a', 'c0000007-0007-0007-0007-000000000007', 450.00, NOW() - INTERVAL '5 days'),
  ('b000000b-000b-000b-000b-00000000000b', 'c0000008-0008-0008-0008-000000000008', 285.00, NOW() - INTERVAL '5 days'),
  ('b000000c-000c-000c-000c-00000000000c', 'c0000009-0009-0009-0009-000000000009', 175.00, NOW() - INTERVAL '4 days'),
  ('b000000d-000d-000d-000d-00000000000d', 'c000000a-000a-000a-000a-00000000000a', 380.00, NOW() - INTERVAL '4 days'),
  ('b000000e-000e-000e-000e-00000000000e', NULL, 68.00, NOW() - INTERVAL '3 days'),
  ('b000000f-000f-000f-000f-00000000000f', 'c000000b-000b-000b-000b-00000000000b', 520.00, NOW() - INTERVAL '3 days'),
  ('b0000010-0010-0010-0010-000000000010', 'c000000c-000c-000c-000c-00000000000c', 165.00, NOW() - INTERVAL '2 days'),
  ('b0000011-0011-0011-0011-000000000011', 'c000000d-000d-000d-000d-00000000000d', 210.00, NOW() - INTERVAL '2 days'),
  ('b0000012-0012-0012-0012-000000000012', 'c000000e-000e-000e-000e-00000000000e', 145.00, NOW() - INTERVAL '2 days'),
  ('b0000013-0013-0013-0013-000000000013', NULL, 85.00, NOW() - INTERVAL '1 day'),
  ('b0000014-0014-0014-0014-000000000014', 'c000000f-000f-000f-000f-00000000000f', 450.00, NOW() - INTERVAL '1 day'),
  ('b0000015-0015-0015-0015-000000000015', 'c0000010-0010-0010-0010-000000000010', 195.00, NOW() - INTERVAL '1 day'),
  ('b0000016-0016-0016-0016-000000000016', 'c0000011-0011-0011-0011-000000000011', 320.00, NOW() - INTERVAL '18 hours'),
  ('b0000017-0017-0017-0017-000000000017', 'c0000012-0012-0012-0012-000000000012', 78.00, NOW() - INTERVAL '12 hours'),
  ('b0000018-0018-0018-0018-000000000018', 'c0000013-0013-0013-0013-000000000013', 285.00, NOW() - INTERVAL '8 hours'),
  ('b0000019-0019-0019-0019-000000000019', NULL, 180.00, NOW() - INTERVAL '6 hours'),
  ('b000001a-001a-001a-001a-00000000001a', 'c0000014-0014-0014-0014-000000000014', 450.00, NOW() - INTERVAL '4 hours'),
  ('b000001b-001b-001b-001b-00000000001b', 'c0000015-0015-0015-0015-000000000015', 95.00, NOW() - INTERVAL '3 hours'),
  ('b000001c-001c-001c-001c-00000000001c', 'c0000016-0016-0016-0016-000000000016', 380.00, NOW() - INTERVAL '2 hours'),
  ('b000001d-001d-001d-001d-00000000001d', 'c0000017-0017-0017-0017-000000000017', 210.00, NOW() - INTERVAL '1 hour'),
  ('b000001e-001e-001e-001e-00000000001e', 'c0000018-0018-0018-0018-000000000018', 145.00, NOW());

-- ============================================
-- 6. SALE_ITEMS (Satış Kalemleri - 45+ kalem)
-- ============================================
DO $$
DECLARE
  dukkan_id UUID;
  yayla_id UUID;
BEGIN
  SELECT id INTO dukkan_id FROM warehouses WHERE name = 'Dükkan';
  SELECT id INTO yayla_id FROM warehouses WHERE name = 'Yayla';

  INSERT INTO sale_items (sale_id, product_id, warehouse_id, quantity, unit_price) VALUES
    -- Satış 1-5
    ('b0000001-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', dukkan_id, 1, 185.50),
    ('b0000001-0001-0001-0001-000000000001', '22222222-2222-2222-2222-222222222222', dukkan_id, 1, 185.50),
    ('b0000002-0002-0002-0002-000000000002', '11111111-1111-1111-1111-111111111111', dukkan_id, 1, 185.50),
    ('b0000003-0003-0003-0003-000000000003', '33333333-3333-3333-3333-333333333333', dukkan_id, 2, 28.50),
    ('b0000003-0003-0003-0003-000000000003', '44444444-4444-4444-4444-444444444444', dukkan_id, 1, 65.00),
    ('b0000003-0003-0003-0003-000000000003', '55555555-5555-5555-5555-555555555555', dukkan_id, 2, 78.00),
    ('b0000004-0004-0004-0004-000000000004', '66666666-6666-6666-6666-666666666666', dukkan_id, 1, 125.00),
    ('b0000005-0005-0005-0005-000000000005', '55555555-5555-5555-5555-555555555555', yayla_id, 1, 78.00),
    -- Satış 6-10
    ('b0000006-0006-0006-0006-000000000006', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', dukkan_id, 1, 450.00),
    ('b0000006-0006-0006-0006-000000000006', 'ffffffff-ffff-ffff-ffff-ffffffffffff', dukkan_id, 1, 95.00),
    ('b0000007-0007-0007-0007-000000000007', 'dddddddd-dddd-dddd-dddd-dddddddddddd', dukkan_id, 1, 320.00),
    ('b0000008-0008-0008-0008-000000000008', 'ffffffff-ffff-ffff-ffff-ffffffffffff', yayla_id, 1, 95.00),
    ('b0000009-0009-0009-0009-000000000009', '22222222-2222-2222-2222-222222222222', dukkan_id, 1, 142.00),
    ('b000000a-000a-000a-000a-00000000000a', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', dukkan_id, 1, 450.00),
    -- Satış 11-15
    ('b000000b-000b-000b-000b-00000000000b', 'ffffffff-ffff-ffff-ffff-fffffffffff1', dukkan_id, 1, 285.00),
    ('b000000c-000c-000c-000c-00000000000c', 'dddddddd-dddd-dddd-dddd-dddddddddddf', dukkan_id, 1, 175.00),
    ('b000000d-000d-000d-000d-00000000000d', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', dukkan_id, 1, 380.00),
    ('b000000e-000e-000e-000e-00000000000e', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', yayla_id, 1, 68.00),
    ('b000000f-000f-000f-000f-00000000000f', 'dddddddd-dddd-dddd-dddd-ddddddddddde', dukkan_id, 1, 450.00),
    ('b000000f-000f-000f-000f-00000000000f', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', dukkan_id, 1, 70.00),
    -- Satış 16-20
    ('b0000010-0010-0010-0010-000000000010', 'cccccccc-cccc-cccc-cccc-cccccccccccc', dukkan_id, 1, 165.00),
    ('b0000011-0011-0011-0011-000000000011', '11111111-1111-1111-1111-111111111114', dukkan_id, 1, 210.00),
    ('b0000012-0012-0012-0012-000000000012', '11111111-1111-1111-1111-111111111112', dukkan_id, 1, 145.00),
    ('b0000013-0013-0013-0013-000000000013', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbf3', yayla_id, 1, 48.00),
    ('b0000013-0013-0013-0013-000000000013', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', yayla_id, 1, 38.00),
    ('b0000014-0014-0014-0014-000000000014', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', dukkan_id, 1, 450.00),
    -- Satış 21-25
    ('b0000015-0015-0015-0015-000000000015', 'ffffffff-ffff-ffff-ffff-fffffffffff2', dukkan_id, 1, 195.00),
    ('b0000016-0016-0016-0016-000000000016', 'dddddddd-dddd-dddd-dddd-dddddddddddd', dukkan_id, 1, 320.00),
    ('b0000017-0017-0017-0017-000000000017', '55555555-5555-5555-5555-555555555555', yayla_id, 1, 78.00),
    ('b0000018-0018-0018-0018-000000000018', 'ffffffff-ffff-ffff-ffff-fffffffffff1', dukkan_id, 1, 285.00),
    ('b0000019-0019-0019-0019-000000000019', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbf1', dukkan_id, 1, 180.00),
    -- Satış 26-30
    ('b000001a-001a-001a-001a-00000000001a', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', dukkan_id, 1, 450.00),
    ('b000001b-001b-001b-001b-00000000001b', 'ffffffff-ffff-ffff-ffff-ffffffffffff', dukkan_id, 1, 95.00),
    ('b000001c-001c-001c-001c-00000000001c', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', dukkan_id, 1, 380.00),
    ('b000001d-001d-001d-001d-00000000001d', '11111111-1111-1111-1111-111111111114', dukkan_id, 1, 210.00),
    ('b000001e-001e-001e-001e-00000000001e', '11111111-1111-1111-1111-111111111112', dukkan_id, 1, 145.00);
END $$;

-- ============================================
-- 7. PURCHASES (Alışlar - 15 alış)
-- ============================================
INSERT INTO purchases (id, wholesaler_id, total_amount, created_at) VALUES
  ('d0000001-0001-0001-0001-000000000001', 'a0000001-0001-0001-0001-000000000001', 8250.00, NOW() - INTERVAL '30 days'),
  ('d0000002-0002-0002-0002-000000000002', 'a0000002-0002-0002-0002-000000000002', 4200.00, NOW() - INTERVAL '28 days'),
  ('d0000003-0003-0003-0003-000000000003', 'a0000001-0001-0001-0001-000000000001', 2875.00, NOW() - INTERVAL '25 days'),
  ('d0000004-0004-0004-0004-000000000004', 'a0000003-0003-0003-0003-000000000003', 6400.00, NOW() - INTERVAL '21 days'),
  ('d0000005-0005-0005-0005-000000000005', 'a0000004-0004-0004-0004-000000000004', 3150.00, NOW() - INTERVAL '18 days'),
  ('d0000006-0006-0006-0006-000000000006', 'a0000005-0005-0005-0005-000000000005', 5600.00, NOW() - INTERVAL '15 days'),
  ('d0000007-0007-0007-0007-000000000007', 'a0000006-0006-0006-0006-000000000006', 4800.00, NOW() - INTERVAL '12 days'),
  ('d0000008-0008-0008-0008-000000000008', 'a0000007-0007-0007-0007-000000000007', 3200.00, NOW() - INTERVAL '10 days'),
  ('d0000009-0009-0009-0009-000000000009', 'a0000001-0001-0001-0001-000000000001', 7500.00, NOW() - INTERVAL '8 days'),
  ('d000000a-000a-000a-000a-00000000000a', 'a0000008-0008-0008-0008-000000000008', 2900.00, NOW() - INTERVAL '6 days'),
  ('d000000b-000b-000b-000b-00000000000b', 'a0000002-0002-0002-0002-000000000002', 5100.00, NOW() - INTERVAL '5 days'),
  ('d000000c-000c-000c-000c-00000000000c', 'a0000009-0009-0009-0009-000000000009', 4400.00, NOW() - INTERVAL '4 days'),
  ('d000000d-000d-000d-000d-00000000000d', 'a000000a-000a-000a-000a-00000000000a', 6800.00, NOW() - INTERVAL '3 days'),
  ('d000000e-000e-000e-000e-00000000000e', 'a000000b-000b-000b-000b-00000000000b', 3600.00, NOW() - INTERVAL '2 days'),
  ('d000000f-000f-000f-000f-00000000000f', 'a0000003-0003-0003-0003-000000000003', 4100.00, NOW() - INTERVAL '1 day');

-- ============================================
-- 8. PURCHASE_ITEMS (Alış Kalemleri - 30+ kalem)
-- ============================================
DO $$
DECLARE
  ana_depo_id UUID;
  dukkan_id UUID;
  yayla_id UUID;
BEGIN
  SELECT id INTO ana_depo_id FROM warehouses WHERE name = 'Ana Depo';
  SELECT id INTO dukkan_id FROM warehouses WHERE name = 'Dükkan';
  SELECT id INTO yayla_id FROM warehouses WHERE name = 'Yayla';

  INSERT INTO purchase_items (purchase_id, product_id, warehouse_id, quantity, unit_price) VALUES
    -- Alış 1-5
    ('d0000001-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', ana_depo_id, 50, 150.00),
    ('d0000001-0001-0001-0001-000000000001', '22222222-2222-2222-2222-222222222222', ana_depo_id, 25, 105.00),
    ('d0000002-0002-0002-0002-000000000002', '33333333-3333-3333-3333-333333333333', dukkan_id, 100, 21.00),
    ('d0000002-0002-0002-0002-000000000002', '44444444-4444-4444-4444-444444444444', dukkan_id, 40, 50.00),
    ('d0000003-0003-0003-0003-000000000003', '66666666-6666-6666-6666-666666666666', ana_depo_id, 25, 95.00),
    ('d0000003-0003-0003-0003-000000000003', '77777777-7777-7777-7777-777777777777', ana_depo_id, 25, 25.00),
    ('d0000004-0004-0004-0004-000000000004', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', ana_depo_id, 20, 320.00),
    ('d0000005-0005-0005-0005-000000000005', '55555555-5555-5555-5555-555555555555', yayla_id, 30, 60.00),
    ('d0000005-0005-0005-0005-000000000005', '88888888-8888-8888-8888-888888888888', yayla_id, 35, 35.00),
    -- Alış 6-10
    ('d0000006-0006-0006-0006-000000000006', 'ffffffff-ffff-ffff-ffff-ffffffffffff', ana_depo_id, 40, 70.00),
    ('d0000006-0006-0006-0006-000000000006', 'ffffffff-ffff-ffff-ffff-fffffffffff1', ana_depo_id, 10, 210.00),
    ('d0000007-0007-0007-0007-000000000007', 'dddddddd-dddd-dddd-dddd-dddddddddddd', ana_depo_id, 15, 240.00),
    ('d0000007-0007-0007-0007-000000000007', 'cccccccc-cccc-cccc-cccc-cccccccccccc', ana_depo_id, 10, 120.00),
    ('d0000008-0008-0008-0008-000000000008', '11111111-1111-1111-1111-111111111114', dukkan_id, 20, 160.00),
    ('d0000009-0009-0009-0009-000000000009', '11111111-1111-1111-1111-111111111111', ana_depo_id, 50, 150.00),
    ('d000000a-000a-000a-000a-00000000000a', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbf1', ana_depo_id, 20, 145.00),
    -- Alış 11-15
    ('d000000b-000b-000b-000b-00000000000b', '22222222-2222-2222-2222-222222222223', dukkan_id, 30, 140.00),
    ('d000000b-000b-000b-000b-00000000000b', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', dukkan_id, 50, 28.00),
    ('d000000c-000c-000c-000c-00000000000c', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', ana_depo_id, 15, 280.00),
    ('d000000c-000c-000c-000c-00000000000c', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbf5', ana_depo_id, 40, 48.00),
    ('d000000d-000d-000d-000d-00000000000d', 'dddddddd-dddd-dddd-dddd-ddddddddddde', ana_depo_id, 20, 340.00),
    ('d000000e-000e-000e-000e-00000000000e', '33333333-3333-3333-3333-333333333334', yayla_id, 100, 26.00),
    ('d000000e-000e-000e-000e-00000000000e', '44444444-4444-4444-4444-444444444445', yayla_id, 20, 65.00),
    ('d000000f-000f-000f-000f-00000000000f', 'ffffffff-ffff-ffff-ffff-fffffffffff2', ana_depo_id, 25, 145.00),
    ('d000000f-000f-000f-000f-00000000000f', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbf6', ana_depo_id, 15, 58.00);
END $$;

-- ============================================
-- 9. PAYMENTS (Ödemeler/Tahsilatlar - 25 ödeme)
-- ============================================
-- Müşteri tahsilatları (Nakit/Kart) - 12 adet
INSERT INTO payments (id, customer_id, amount, payment_type, notes, created_at) VALUES
  ('e0000001-0001-0001-0001-000000000001', 'c0000001-0001-0001-0001-000000000001', 250.00, 'cash', 'Nakit ödeme', NOW() - INTERVAL '12 days'),
  ('e0000002-0002-0002-0002-000000000002', 'c0000002-0002-0002-0002-000000000002', 100.00, 'credit_card', 'Kart ile ödeme', NOW() - INTERVAL '10 days'),
  ('e0000003-0003-0003-0003-000000000003', 'c0000003-0003-0003-0003-000000000003', 150.00, 'cash', 'Kısmi ödeme', NOW() - INTERVAL '9 days'),
  ('e0000004-0004-0004-0004-000000000004', 'c0000004-0004-0004-0004-000000000004', 300.00, 'credit_card', 'Kart POS', NOW() - INTERVAL '7 days'),
  ('e0000005-0005-0005-0005-000000000005', 'c0000005-0005-0005-0005-000000000005', 200.00, 'cash', 'Nakit', NOW() - INTERVAL '6 days'),
  ('e0000006-0006-0006-0006-000000000006', 'c0000006-0006-0006-0006-000000000006', 95.00, 'cash', 'Tam ödeme', NOW() - INTERVAL '5 days'),
  ('e0000007-0007-0007-0007-000000000007', 'c0000007-0007-0007-0007-000000000007', 300.00, 'credit_card', 'Online POS', NOW() - INTERVAL '4 days'),
  ('e0000008-0008-0008-0008-000000000008', 'c0000008-0008-0008-0008-000000000008', 150.00, 'cash', NULL, NOW() - INTERVAL '3 days'),
  ('e0000009-0009-0009-0009-000000000009', 'c0000009-0009-0009-0009-000000000009', 100.00, 'credit_card', NULL, NOW() - INTERVAL '2 days'),
  ('e000000a-000a-000a-000a-00000000000a', 'c000000a-000a-000a-000a-00000000000a', 200.00, 'cash', 'Nakit ödeme', NOW() - INTERVAL '1 day'),
  ('e000000b-000b-000b-000b-00000000000b', 'c000000b-000b-000b-000b-00000000000b', 350.00, 'credit_card', 'Kart ödeme', NOW() - INTERVAL '12 hours'),
  ('e000000c-000c-000c-000c-00000000000c', 'c000000c-000c-000c-000c-00000000000c', 100.00, 'cash', NULL, NOW());

-- Toptancı ödemeleri (Çek/Senet - vade tarihli) - 13 adet
INSERT INTO payments (id, wholesaler_id, amount, payment_type, due_date, notes, created_at) VALUES
  ('e000000d-000d-000d-000d-00000000000d', 'a0000001-0001-0001-0001-000000000001', 5000.00, 'check', CURRENT_DATE + INTERVAL '30 days', 'Selçuk 1. çek', NOW() - INTERVAL '25 days'),
  ('e000000e-000e-000e-000e-00000000000e', 'a0000001-0001-0001-0001-000000000001', 3000.00, 'check', CURRENT_DATE + INTERVAL '60 days', 'Selçuk 2. çek', NOW() - INTERVAL '20 days'),
  ('e000000f-000f-000f-000f-00000000000f', 'a0000002-0002-0002-0002-000000000002', 2500.00, 'promissory_note', CURRENT_DATE + INTERVAL '45 days', 'Hedef senet', NOW() - INTERVAL '18 days'),
  ('e0000010-0010-0010-0010-000000000010', 'a0000003-0003-0003-0003-000000000003', 4000.00, 'check', CURRENT_DATE + INTERVAL '15 days', 'Nevzat çek', NOW() - INTERVAL '15 days'),
  ('e0000011-0011-0011-0011-000000000011', 'a0000004-0004-0004-0004-000000000004', 2000.00, 'promissory_note', CURRENT_DATE + INTERVAL '90 days', 'Aktif senet', NOW() - INTERVAL '12 days'),
  ('e0000012-0012-0012-0012-000000000012', 'a0000005-0005-0005-0005-000000000005', 3500.00, 'check', CURRENT_DATE + INTERVAL '20 days', 'Nobel çek', NOW() - INTERVAL '10 days'),
  ('e0000013-0013-0013-0013-000000000013', 'a0000006-0006-0006-0006-000000000006', 2800.00, 'check', CURRENT_DATE + INTERVAL '40 days', 'Pharmavision çek', NOW() - INTERVAL '8 days'),
  ('e0000014-0014-0014-0014-000000000014', 'a0000007-0007-0007-0007-000000000007', 2000.00, 'promissory_note', CURRENT_DATE + INTERVAL '75 days', 'Gözde senet', NOW() - INTERVAL '6 days'),
  ('e0000015-0015-0015-0015-000000000015', 'a0000001-0001-0001-0001-000000000001', 4500.00, 'check', CURRENT_DATE + INTERVAL '25 days', 'Selçuk 3. çek', NOW() - INTERVAL '5 days'),
  ('e0000016-0016-0016-0016-000000000016', 'a0000008-0008-0008-0008-000000000008', 1500.00, 'check', CURRENT_DATE + INTERVAL '35 days', 'Sağlık Deposu çek', NOW() - INTERVAL '4 days'),
  ('e0000017-0017-0017-0017-000000000017', 'a0000002-0002-0002-0002-000000000002', 3000.00, 'promissory_note', CURRENT_DATE + INTERVAL '55 days', 'Hedef 2. senet', NOW() - INTERVAL '3 days'),
  ('e0000018-0018-0018-0018-000000000018', 'a0000009-0009-0009-0009-000000000009', 2500.00, 'check', CURRENT_DATE + INTERVAL '10 days', 'Medline çek', NOW() - INTERVAL '2 days'),
  ('e0000019-0019-0019-0019-000000000019', 'a000000a-000a-000a-000a-00000000000a', 4000.00, 'check', CURRENT_DATE + INTERVAL '50 days', 'Eczacıbaşı çek', NOW() - INTERVAL '1 day');

-- ============================================
-- 10. CALENDAR_NOTES (Manuel Takvim Notları - 10 not)
-- ============================================
INSERT INTO calendar_notes (date, title, description) VALUES
  (CURRENT_DATE, 'Günlük Stok Kontrolü', 'Dükkan ve Yayla stokları kontrol edilecek'),
  (CURRENT_DATE + INTERVAL '2 days', 'Hasta Randevusu', 'Diyabet hastası için insülin takibi'),
  (CURRENT_DATE + INTERVAL '3 days', 'SGK İlaç Bildirimi', 'Aylık SGK raporu gönderilecek'),
  (CURRENT_DATE + INTERVAL '5 days', 'Depo Transferi', 'Ana Depodan Dükkana stok transferi'),
  (CURRENT_DATE + INTERVAL '7 days', 'Ecza Odası Toplantısı', 'Bölge eczacılar odası toplantısı'),
  (CURRENT_DATE + INTERVAL '10 days', 'Muhasebe Kontrolü', 'Aylık muhasebe denetimi'),
  (CURRENT_DATE + INTERVAL '14 days', 'Stok Sayımı', 'Ana depo genel stok sayımı'),
  (CURRENT_DATE + INTERVAL '18 days', 'Yayla Ziyareti', 'Yayla şubesi kontrolü'),
  (CURRENT_DATE + INTERVAL '21 days', 'Ruhsat Yenileme', 'Eczane ruhsatı yenileme başvurusu'),
  (CURRENT_DATE + INTERVAL '30 days', 'Yıllık Envanter', 'Yıllık envanter sayımı başlangıcı');

-- ============================================
-- DONE - Data Summary (EXTENDED)
-- ============================================
-- Products: 42 ilaç
-- Warehouses: 3 (Ana Depo, Dükkan, Yayla)
-- Inventory: 126 kayıt (42 ürün x 3 depo)
-- Customers: 25 müşteri
-- Wholesalers: 12 toptancı
-- Sales: 30 satış (+ 35 kalem)
-- Purchases: 15 alış (+ 25 kalem)
-- Payments: 25 ödeme (12 tahsilat + 13 çek/senet)
-- Calendar Notes: 10 manuel + 13 otomatik (çek/senet hatırlatmaları)
-- ============================================
