-- ============================================
-- Fix Orders RLS Policies for Order Submission
-- Run this in Supabase SQL Editor
-- ============================================

-- Problem: Users may not be able to create orders because
-- the INSERT policy might be missing or misconfigured.

-- ============================================
-- 1. ORDERS TABLE - Ensure INSERT policy exists
-- ============================================

-- Drop existing INSERT policy if it exists (to recreate cleanly)
DROP POLICY IF EXISTS "Customers can create orders" ON orders;

-- Create INSERT policy allowing authenticated users to create orders
-- where they are the customer
CREATE POLICY "Customers can create orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- ============================================
-- 2. ORDERS TABLE - Ensure UPDATE policy exists
-- ============================================

-- Allow customers to update their own orders (e.g., add notes)
DROP POLICY IF EXISTS "Customers can update own orders" ON orders;
CREATE POLICY "Customers can update own orders"
ON orders FOR UPDATE
USING (auth.uid() = customer_id);

-- ============================================
-- 3. ORDERS TABLE - Allow attorneys to view and update assigned orders
-- ============================================

DROP POLICY IF EXISTS "Attorneys can view assigned orders" ON orders;
CREATE POLICY "Attorneys can view assigned orders"
ON orders FOR SELECT
USING (
  assigned_attorney_id IN (
    SELECT id FROM attorneys WHERE profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Attorneys can update assigned orders" ON orders;
CREATE POLICY "Attorneys can update assigned orders"
ON orders FOR UPDATE
USING (
  assigned_attorney_id IN (
    SELECT id FROM attorneys WHERE profile_id = auth.uid()
  )
);

-- ============================================
-- 4. ORDERS TABLE - Allow law firm owners to manage orders
-- ============================================

-- Ensure law firms can view their orders
DROP POLICY IF EXISTS "Law firms can view their orders" ON orders;
CREATE POLICY "Law firms can view their orders"
ON orders FOR SELECT
USING (
  law_firm_id IN (SELECT id FROM law_firms WHERE owner_id = auth.uid())
);

-- Allow law firm owners to update orders (assign attorneys, change status)
DROP POLICY IF EXISTS "Law firms can update their orders" ON orders;
CREATE POLICY "Law firms can update their orders"
ON orders FOR UPDATE
USING (
  law_firm_id IN (SELECT id FROM law_firms WHERE owner_id = auth.uid())
);

-- ============================================
-- 5. ADMIN POLICIES - Allow admins full access
-- ============================================

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
CREATE POLICY "Admins can update all orders"
ON orders FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
