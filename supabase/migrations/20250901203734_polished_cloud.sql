/*
  # Create suggestions table

  1. New Tables
    - `suggestions`
      - `id` (uuid, primary key)
      - `puuid` (text, foreign key to users)
      - `message` (text, max 300 characters)
      - `status` (text, default 'pending')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on suggestions table
    - Add policy for users to create their own suggestions
    - Add policy for users to read their own suggestions
    - Add policy for service role to manage all suggestions
*/

CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  puuid text REFERENCES users(puuid) ON DELETE CASCADE,
  message text NOT NULL CHECK (length(message) <= 300),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'implemented', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Policies for suggestions table
CREATE POLICY "Users can create their own suggestions"
  ON suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = puuid);

CREATE POLICY "Users can read their own suggestions"
  ON suggestions
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = puuid);

CREATE POLICY "Service role can manage all suggestions"
  ON suggestions
  FOR ALL
  TO service_role
  USING (true);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_suggestions_updated_at
  BEFORE UPDATE ON suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_suggestions_puuid ON suggestions(puuid);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON suggestions(created_at);