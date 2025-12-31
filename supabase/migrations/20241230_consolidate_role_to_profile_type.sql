-- Migration: Consolidate role into profile_type
-- This migration copies the 'role' value to 'profile_type' for users who have
-- a role set but no profile_type. This simplifies the data model to use only
-- profile_type for determining user type.

-- Step 1: Update profiles where profile_type is null but role has a value
-- This ensures admins and other roles set via role field get their profile_type set
UPDATE profiles
SET profile_type = role::text
WHERE profile_type IS NULL
  AND role IS NOT NULL;

-- Step 2: Specifically ensure admins have profile_type = 'admin'
-- This is the most important case - admins should always have profile_type = 'admin'
UPDATE profiles
SET profile_type = 'admin'
WHERE role = 'admin'
  AND (profile_type IS NULL OR profile_type != 'admin');

-- Step 3: Add 'admin' to the profile_type enum if it doesn't exist
-- (This may already exist from earlier migrations)
DO $$
BEGIN
  -- Check if admin value exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'admin'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'profile_type')
  ) THEN
    ALTER TYPE profile_type ADD VALUE IF NOT EXISTS 'admin';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Note: We're keeping the 'role' column for now for backwards compatibility,
-- but the application code now uses profile_type as the primary field.
-- In a future migration, we can drop the role column once we're confident
-- all data has been migrated and the application is stable.

-- Verification query (run manually to check results):
-- SELECT id, email, role, profile_type FROM profiles WHERE role = 'admin' OR profile_type = 'admin';
