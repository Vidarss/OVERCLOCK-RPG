/*
  # Add email uniqueness constraint for duplicate registration prevention
  
  Ensures that emails cannot be registered twice by:
  - Adding UNIQUE constraint on profiles.email
  - Adding indexes for fast duplicate checks during registration
  - Prevents two users from registering with the same email address
*/

-- Add UNIQUE constraint to email column (if not already unique)
ALTER TABLE profiles
ADD CONSTRAINT unique_email_constraint UNIQUE (email);

-- Add index for fast email lookups during registration
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Add index for fast handle lookups during registration
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON profiles(handle);

-- Comment explaining the constraints
COMMENT ON CONSTRAINT unique_email_constraint ON profiles IS 'Prevents duplicate email registrations';
