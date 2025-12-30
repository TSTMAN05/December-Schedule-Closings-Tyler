-- ============================================
-- Fix Law Firm RLS Policies for Onboarding
-- Run this in Supabase SQL Editor
-- ============================================

-- Problem: Users cannot create law firms during onboarding because
-- there's only a SELECT policy on law_firms table.

-- ============================================
-- 1. LAW FIRMS TABLE - Add INSERT and UPDATE policies
-- ============================================

-- Allow authenticated users to create law firms
CREATE POLICY "Authenticated users can create law firms"
ON law_firms FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Allow law firm owners to update their law firm
CREATE POLICY "Law firm owners can update their firm"
ON law_firms FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Also allow viewing pending/inactive law firms for owners
DROP POLICY IF EXISTS "Anyone can view active law firms" ON law_firms;
CREATE POLICY "Anyone can view active law firms or owners can view their own"
ON law_firms FOR SELECT
USING (status = 'active' OR auth.uid() = owner_id);

-- ============================================
-- 2. LAW FIRM SETUP TABLE - Add INSERT policy
-- ============================================

-- The trigger that creates law_firm_setup records needs permission
-- Since the trigger runs as the session user, we need an INSERT policy
CREATE POLICY "Law firm owners can insert their setup"
ON law_firm_setup FOR INSERT
WITH CHECK (law_firm_id IN (SELECT id FROM law_firms WHERE owner_id = auth.uid()));

-- ============================================
-- 3. PROFILES TABLE - Ensure update policy exists
-- ============================================

-- Make sure profile update policy exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'profiles'
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile"
        ON profiles FOR UPDATE
        USING (auth.uid() = id);
    END IF;
END $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
