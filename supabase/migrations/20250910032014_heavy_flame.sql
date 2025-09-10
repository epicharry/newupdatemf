/*
  # Create emergency MOTD table

  1. New Tables
    - `emergency_motd`
      - `id` (uuid, primary key)
      - `enabled` (boolean, default false)
      - `title` (text)
      - `message` (text)
      - `type` (text, default 'info') - info, warning, error, success
      - `show_on_main` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on emergency_motd table
    - Add policy for public read access
    - Add policy for service role to manage MOTD

  3. Initial Data
    - Insert default MOTD record (disabled)
*/

CREATE TABLE IF NOT EXISTS emergency_motd (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean DEFAULT false,
  title text DEFAULT 'Important Notice',
  message text DEFAULT 'This is an emergency message.',
  type text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  show_on_main boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE emergency_motd ENABLE ROW LEVEL SECURITY;

-- Policies for emergency_motd table
CREATE POLICY "Anyone can read emergency MOTD"
  ON emergency_motd
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can manage emergency MOTD"
  ON emergency_motd
  FOR ALL
  TO service_role
  USING (true);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_emergency_motd_updated_at
  BEFORE UPDATE ON emergency_motd
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default emergency MOTD record (disabled)
INSERT INTO emergency_motd (enabled, title, message, type, show_on_main) 
VALUES (false, 'Important Notice', 'This is an emergency message for urgent announcements.', 'info', true)
ON CONFLICT DO NOTHING;