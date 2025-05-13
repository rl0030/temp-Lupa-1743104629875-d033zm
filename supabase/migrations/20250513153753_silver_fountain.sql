/*
  # Create programs table

  1. New Tables
    - `programs`
      - `id` (uuid, primary key)
      - `uid` (text, unique)
      - `version` (integer)
      - `weeks` (jsonb)
      - `metadata` (jsonb)
      - `session_metadata` (jsonb)
      - `pricing` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `programs` table
    - Add policy for authenticated users to read their own programs
    - Add policy for authenticated users to update their own programs
    - Add policy for authenticated users to read published programs
*/

CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  version integer DEFAULT 1,
  weeks jsonb NOT NULL,
  metadata jsonb NOT NULL,
  session_metadata jsonb NOT NULL,
  pricing jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own programs"
  ON programs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = (metadata->>'owner')::text);

CREATE POLICY "Users can update own programs"
  ON programs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = (metadata->>'owner')::text);

CREATE POLICY "Users can insert own programs"
  ON programs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = (metadata->>'owner')::text);

CREATE POLICY "Users can delete own programs"
  ON programs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = (metadata->>'owner')::text);

CREATE POLICY "Users can read published programs"
  ON programs
  FOR SELECT
  TO authenticated
  USING ((metadata->>'is_published')::boolean = true);