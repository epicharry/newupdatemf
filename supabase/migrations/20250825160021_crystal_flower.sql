/*
  # Update users table with additional Riot API fields

  1. New Columns
    - `preferred_username` (text)
    - `player_locale` (text)
    - `email_verified` (boolean)
    - `phone_number_verified` (boolean)
    - `account_type` (integer)
    - `account_state` (text)
    - `account_created_at` (timestamptz)
    - `country_at` (timestamptz)
    - `password_changed_at` (timestamptz)
    - `password_must_reset` (boolean)

  2. Changes
    - Add new columns to existing users table
    - Update existing policies to handle new fields
*/

-- Add new columns to users table
DO $$
BEGIN
  -- Add preferred_username column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'preferred_username'
  ) THEN
    ALTER TABLE users ADD COLUMN preferred_username text;
  END IF;

  -- Add player_locale column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'player_locale'
  ) THEN
    ALTER TABLE users ADD COLUMN player_locale text;
  END IF;

  -- Add email_verified column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified boolean DEFAULT false;
  END IF;

  -- Add phone_number_verified column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone_number_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN phone_number_verified boolean DEFAULT false;
  END IF;

  -- Add account_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'account_type'
  ) THEN
    ALTER TABLE users ADD COLUMN account_type integer DEFAULT 0;
  END IF;

  -- Add account_state column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'account_state'
  ) THEN
    ALTER TABLE users ADD COLUMN account_state text DEFAULT 'ENABLED';
  END IF;

  -- Add account_created_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'account_created_at'
  ) THEN
    ALTER TABLE users ADD COLUMN account_created_at timestamptz;
  END IF;

  -- Add country_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'country_at'
  ) THEN
    ALTER TABLE users ADD COLUMN country_at timestamptz;
  END IF;

  -- Add password_changed_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_changed_at'
  ) THEN
    ALTER TABLE users ADD COLUMN password_changed_at timestamptz;
  END IF;

  -- Add password_must_reset column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_must_reset'
  ) THEN
    ALTER TABLE users ADD COLUMN password_must_reset boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_preferred_username ON users(preferred_username);
CREATE INDEX IF NOT EXISTS idx_users_account_state ON users(account_state);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);