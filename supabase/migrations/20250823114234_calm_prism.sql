/*
  # Create users and logs tables

  1. New Tables
    - `users`
      - `puuid` (text, primary key)
      - `game_name` (text)
      - `tag_line` (text)
      - `country` (text)
      - `email` (text)
      - `is_banned` (boolean, default false)
      - `ban_reason` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `user_logs`
      - `id` (uuid, primary key)
      - `puuid` (text, foreign key to users)
      - `action` (text)
      - `user_agent` (text)
      - `ip_address` (text, nullable)
      - `metadata` (jsonb, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read their own data
    - Add policies for service role to manage all data
*/

CREATE TABLE IF NOT EXISTS users (
  puuid text PRIMARY KEY,
  game_name text,
  tag_line text,
  country text,
  email text,
  is_banned boolean DEFAULT false,
  ban_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  puuid text REFERENCES users(puuid) ON DELETE CASCADE,
  action text NOT NULL,
  user_agent text,
  ip_address text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_logs ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = puuid);

CREATE POLICY "Service role can manage all users"
  ON users
  FOR ALL
  TO service_role
  USING (true);

-- Policies for user_logs table
CREATE POLICY "Users can read own logs"
  ON user_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = puuid);

CREATE POLICY "Service role can manage all logs"
  ON user_logs
  FOR ALL
  TO service_role
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_user_logs_puuid ON user_logs(puuid);
CREATE INDEX IF NOT EXISTS idx_user_logs_created_at ON user_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);