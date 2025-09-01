/*
  # Create maintenance status table

  1. New Tables
    - `maintenance_status`
      - `id` (uuid, primary key)
      - `enabled` (boolean, default false)
      - `message` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on maintenance_status table
    - Add policy for public read access
    - Add policy for service role to manage maintenance status

  3. Initial Data
    - Insert default maintenance record
*/

CREATE TABLE IF NOT EXISTS maintenance_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean DEFAULT false,
  message text DEFAULT 'System maintenance in progress. Please try again later.',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE maintenance_status ENABLE ROW LEVEL SECURITY;

-- Policies for maintenance_status table
CREATE POLICY "Anyone can read maintenance status"
  ON maintenance_status
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can manage maintenance status"
  ON maintenance_status
  FOR ALL
  TO service_role
  USING (true);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_maintenance_status_updated_at
  BEFORE UPDATE ON maintenance_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default maintenance record
INSERT INTO maintenance_status (enabled, message) 
VALUES (false, 'System maintenance in progress. Please try again later.')
ON CONFLICT DO NOTHING;