-- ============================================
-- Add New Order Form Fields
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE ENUM TYPES FOR NEW FIELDS
-- ============================================

-- Financing type enum
DO $$ BEGIN
  CREATE TYPE financing_type AS ENUM (
    'cash',
    'conventional',
    'fha',
    'va',
    'usda',
    'hard_money',
    'seller_financing',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Earnest money holder enum
DO $$ BEGIN
  CREATE TYPE earnest_money_holder AS ENUM (
    'law_firm',
    'listing_agent',
    'buyer_agent',
    'escrow_company',
    'title_company',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Party role enum for order parties
DO $$ BEGIN
  CREATE TYPE order_party_role AS ENUM (
    'buyer',
    'seller',
    'real_estate_agent_buyer',
    'real_estate_agent_seller',
    'closing_coordinator',
    'closing_coordinator_seller',
    'lender',
    'loan_processor',
    'law_firm',
    'law_firm_seller',
    'paralegal',
    'paralegal_seller',
    'title_search',
    'title_insurance',
    'notary_buyer',
    'notary_seller'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Invite status enum
DO $$ BEGIN
  CREATE TYPE invite_status AS ENUM (
    'pending',
    'sent',
    'accepted',
    'declined'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. ADD NEW COLUMNS TO ORDERS TABLE
-- ============================================

-- Property unit (suite, apt, etc.)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS property_unit TEXT;

-- Financing type
ALTER TABLE orders ADD COLUMN IF NOT EXISTS financing_type financing_type DEFAULT 'cash';

-- Due diligence fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS due_diligence_fee DECIMAL(12, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS due_diligence_date DATE;

-- Credit fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_credits DECIMAL(12, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS home_warranty_credit DECIMAL(12, 2);

-- Earnest money fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS earnest_money DECIMAL(12, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS earnest_money_held_by earnest_money_holder;

-- Promo code
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT;

-- ============================================
-- 3. CREATE ORDER_PARTIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS order_parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  role order_party_role NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  phone TEXT,
  invite_status invite_status DEFAULT 'pending',
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_parties_order ON order_parties(order_id);
CREATE INDEX IF NOT EXISTS idx_order_parties_email ON order_parties(email);
CREATE INDEX IF NOT EXISTS idx_order_parties_profile ON order_parties(profile_id);

-- ============================================
-- 4. ROW LEVEL SECURITY FOR ORDER_PARTIES
-- ============================================

ALTER TABLE order_parties ENABLE ROW LEVEL SECURITY;

-- Customers can view parties on their orders
CREATE POLICY "Customers can view parties on their orders"
ON order_parties FOR SELECT
USING (
  order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
);

-- Customers can add parties to their orders
CREATE POLICY "Customers can add parties to their orders"
ON order_parties FOR INSERT
WITH CHECK (
  order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
);

-- Customers can update parties on their orders
CREATE POLICY "Customers can update parties on their orders"
ON order_parties FOR UPDATE
USING (
  order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
);

-- Customers can delete parties from their orders
CREATE POLICY "Customers can delete parties from their orders"
ON order_parties FOR DELETE
USING (
  order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
);

-- Law firms can view parties on their orders
CREATE POLICY "Law firms can view parties on their orders"
ON order_parties FOR SELECT
USING (
  order_id IN (SELECT id FROM orders WHERE law_firm_id IN (SELECT id FROM law_firms WHERE owner_id = auth.uid()))
);

-- Law firms can manage parties on their orders
CREATE POLICY "Law firms can manage parties on their orders"
ON order_parties FOR ALL
USING (
  order_id IN (SELECT id FROM orders WHERE law_firm_id IN (SELECT id FROM law_firms WHERE owner_id = auth.uid()))
);

-- Admins can view all order parties
CREATE POLICY "Admins can view all order parties"
ON order_parties FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admins can manage all order parties
CREATE POLICY "Admins can manage all order parties"
ON order_parties FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Invited parties can view their own party record
CREATE POLICY "Invited parties can view own record"
ON order_parties FOR SELECT
USING (
  profile_id = auth.uid() OR
  email = (SELECT email FROM profiles WHERE id = auth.uid())
);

-- ============================================
-- 5. UPDATE TRIGGER FOR ORDER_PARTIES
-- ============================================

CREATE TRIGGER update_order_parties_updated_at
BEFORE UPDATE ON order_parties
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
--
-- New columns added to orders:
--   - property_unit
--   - financing_type
--   - due_diligence_fee
--   - due_diligence_date
--   - seller_credits
--   - home_warranty_credit
--   - earnest_money
--   - earnest_money_held_by
--   - promo_code
--
-- New table created:
--   - order_parties (for tracking invited transaction parties)
-- ============================================
