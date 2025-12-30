-- ============================================
-- Dashboard Enhancements Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ORDERS TABLE ENHANCEMENTS
-- ============================================

-- Add order type for filtering (closing, notary, title)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'closing';

-- Add title order status for title orders tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS title_status TEXT DEFAULT 'unassigned';

-- Add closing time and location
ALTER TABLE orders ADD COLUMN IF NOT EXISTS closing_time TIME;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS closing_location TEXT;

-- Add buyer/seller names for display
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_name TEXT;

-- Add flag for orders needing date/time/location
ALTER TABLE orders ADD COLUMN IF NOT EXISTS needs_date BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS needs_time BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS needs_location BOOLEAN DEFAULT FALSE;

-- Index for order_type filtering
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_title_status ON orders(title_status);

-- ============================================
-- 2. ORDER TASKS TABLE (for Pending Tasks)
-- ============================================

CREATE TABLE IF NOT EXISTS order_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_date DATE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_order_tasks_order ON order_tasks(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tasks_assigned ON order_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_order_tasks_status ON order_tasks(status);
CREATE INDEX IF NOT EXISTS idx_order_tasks_due_date ON order_tasks(due_date);

-- RLS for order_tasks
ALTER TABLE order_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks for their orders" ON order_tasks FOR SELECT USING (
  order_id IN (
    SELECT id FROM orders WHERE customer_id = auth.uid()
    UNION
    SELECT id FROM orders WHERE law_firm_id IN (SELECT id FROM law_firms WHERE owner_id = auth.uid())
    UNION
    SELECT id FROM orders WHERE assigned_attorney_id IN (SELECT id FROM attorneys WHERE profile_id = auth.uid())
  )
);

CREATE POLICY "Law firms can manage tasks" ON order_tasks FOR ALL USING (
  order_id IN (SELECT id FROM orders WHERE law_firm_id IN (SELECT id FROM law_firms WHERE owner_id = auth.uid()))
);

-- ============================================
-- 3. LAW FIRM SETUP PROGRESS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS law_firm_setup (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE UNIQUE,

  -- Setup checklist items
  admin_account_complete BOOLEAN DEFAULT FALSE,
  firm_account_complete BOOLEAN DEFAULT FALSE,
  company_forms_complete BOOLEAN DEFAULT FALSE,
  fees_complete BOOLEAN DEFAULT FALSE,
  bank_info_complete BOOLEAN DEFAULT FALSE,
  insurance_complete BOOLEAN DEFAULT FALSE,

  -- Additional setup fields
  ein_number TEXT,
  bank_account_last4 TEXT,
  insurance_policy_number TEXT,
  insurance_expiry DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_law_firm_setup_firm ON law_firm_setup(law_firm_id);

-- RLS for law_firm_setup
ALTER TABLE law_firm_setup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Law firm owners can view their setup" ON law_firm_setup FOR SELECT USING (
  law_firm_id IN (SELECT id FROM law_firms WHERE owner_id = auth.uid())
);

CREATE POLICY "Law firm owners can update their setup" ON law_firm_setup FOR UPDATE USING (
  law_firm_id IN (SELECT id FROM law_firms WHERE owner_id = auth.uid())
);

-- Auto-create setup record when law firm is created
CREATE OR REPLACE FUNCTION create_law_firm_setup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO law_firm_setup (law_firm_id)
  VALUES (NEW.id)
  ON CONFLICT (law_firm_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_law_firm_created ON law_firms;
CREATE TRIGGER on_law_firm_created
  AFTER INSERT ON law_firms
  FOR EACH ROW
  EXECUTE FUNCTION create_law_firm_setup();

-- ============================================
-- 4. CONTACTS TABLE (for Connections)
-- ============================================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Contact can be linked to a profile or be external
  contact_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Contact info (used if not linked to profile)
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  company_name TEXT,

  -- Contact type/role
  contact_type TEXT DEFAULT 'other' CHECK (contact_type IN (
    'attorney', 'paralegal', 'lender', 'loan_officer',
    'real_estate_agent', 'title_agent', 'notary', 'other'
  )),

  -- Relationship tracking
  notes TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  last_interaction_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_profile ON contacts(contact_profile_id);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(contact_type);

-- RLS for contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contacts" ON contacts FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Users can create contacts" ON contacts FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update their contacts" ON contacts FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Users can delete their contacts" ON contacts FOR DELETE USING (owner_id = auth.uid());

-- ============================================
-- 5. ATTORNEYS/STAFF ENHANCEMENTS
-- ============================================

-- Add staff role type to attorneys table
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS staff_role TEXT DEFAULT 'attorney'
  CHECK (staff_role IN ('attorney', 'paralegal', 'closing_agent', 'notary', 'admin_staff'));

-- Add availability/assignment flags
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS can_be_assigned BOOLEAN DEFAULT TRUE;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS max_assignments INT DEFAULT 10;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS current_assignments INT DEFAULT 0;

-- Add contact preferences
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS direct_phone TEXT;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS direct_email TEXT;

CREATE INDEX IF NOT EXISTS idx_attorneys_staff_role ON attorneys(staff_role);
CREATE INDEX IF NOT EXISTS idx_attorneys_can_assign ON attorneys(can_be_assigned);

-- ============================================
-- 6. PROFILES TABLE ENHANCEMENTS
-- ============================================

-- Add profile_type for granular role tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_type TEXT;

-- Add onboarding tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 0;

-- Add additional contact info
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mobile_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS office_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_office_number BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Add notification preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_email_updates BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_order_status BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_closing_reminders BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_marketing BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_profile_type ON profiles(profile_type);

-- ============================================
-- 7. CLOSING CALENDARS TABLE (for calendar grouping)
-- ============================================

CREATE TABLE IF NOT EXISTS closing_calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6', -- Blue default
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_closing_calendars_firm ON closing_calendars(law_firm_id);

-- Add calendar reference to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS closing_calendar_id UUID REFERENCES closing_calendars(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_calendar ON orders(closing_calendar_id);

-- RLS for closing_calendars
ALTER TABLE closing_calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Law firm owners can manage calendars" ON closing_calendars FOR ALL USING (
  law_firm_id IN (SELECT id FROM law_firms WHERE owner_id = auth.uid())
);

CREATE POLICY "Anyone can view calendars" ON closing_calendars FOR SELECT USING (true);

-- ============================================
-- 8. ACTIVITY LOG TABLE (for activity feed)
-- ============================================

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who did it
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- What entity was affected
  entity_type TEXT NOT NULL CHECK (entity_type IN ('order', 'task', 'contact', 'attorney', 'law_firm', 'document')),
  entity_id UUID NOT NULL,

  -- What happened
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'assigned', 'status_changed', 'commented', 'uploaded')),

  -- Details
  description TEXT,
  old_value JSONB,
  new_value JSONB,

  -- Context
  law_firm_id UUID REFERENCES law_firms(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_law_firm ON activity_log(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_order ON activity_log(order_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

-- RLS for activity_log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant activity" ON activity_log FOR SELECT USING (
  user_id = auth.uid()
  OR law_firm_id IN (SELECT id FROM law_firms WHERE owner_id = auth.uid())
  OR order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
);

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Function to get pending task count for an order
CREATE OR REPLACE FUNCTION get_pending_task_count(p_order_id UUID)
RETURNS INT AS $$
  SELECT COUNT(*)::INT FROM order_tasks
  WHERE order_id = p_order_id AND status = 'pending';
$$ LANGUAGE sql STABLE;

-- Function to get setup completion percentage
CREATE OR REPLACE FUNCTION get_setup_completion(p_law_firm_id UUID)
RETURNS JSONB AS $$
DECLARE
  setup_record law_firm_setup%ROWTYPE;
  completed INT := 0;
  total INT := 6;
BEGIN
  SELECT * INTO setup_record FROM law_firm_setup WHERE law_firm_id = p_law_firm_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('completed', 0, 'total', total, 'items', '[]'::jsonb);
  END IF;

  IF setup_record.admin_account_complete THEN completed := completed + 1; END IF;
  IF setup_record.firm_account_complete THEN completed := completed + 1; END IF;
  IF setup_record.company_forms_complete THEN completed := completed + 1; END IF;
  IF setup_record.fees_complete THEN completed := completed + 1; END IF;
  IF setup_record.bank_info_complete THEN completed := completed + 1; END IF;
  IF setup_record.insurance_complete THEN completed := completed + 1; END IF;

  RETURN jsonb_build_object(
    'completed', completed,
    'total', total,
    'items', jsonb_build_array(
      setup_record.admin_account_complete,
      setup_record.firm_account_complete,
      setup_record.company_forms_complete,
      setup_record.fees_complete,
      setup_record.bank_info_complete,
      setup_record.insurance_complete
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update attorney assignment counts
CREATE OR REPLACE FUNCTION update_attorney_assignment_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease old attorney's count
  IF OLD.assigned_attorney_id IS NOT NULL THEN
    UPDATE attorneys SET current_assignments = GREATEST(0, current_assignments - 1)
    WHERE id = OLD.assigned_attorney_id;
  END IF;

  -- Increase new attorney's count
  IF NEW.assigned_attorney_id IS NOT NULL THEN
    UPDATE attorneys SET current_assignments = current_assignments + 1
    WHERE id = NEW.assigned_attorney_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_order_attorney_changed ON orders;
CREATE TRIGGER on_order_attorney_changed
  AFTER UPDATE OF assigned_attorney_id ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_attorney_assignment_count();

-- ============================================
-- 10. UPDATE TIMESTAMPS TRIGGERS
-- ============================================

CREATE TRIGGER update_order_tasks_updated_at
  BEFORE UPDATE ON order_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_law_firm_setup_updated_at
  BEFORE UPDATE ON law_firm_setup
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_closing_calendars_updated_at
  BEFORE UPDATE ON closing_calendars
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 11. CREATE SETUP RECORDS FOR EXISTING LAW FIRMS
-- ============================================

INSERT INTO law_firm_setup (law_firm_id)
SELECT id FROM law_firms
WHERE id NOT IN (SELECT law_firm_id FROM law_firm_setup)
ON CONFLICT (law_firm_id) DO NOTHING;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
