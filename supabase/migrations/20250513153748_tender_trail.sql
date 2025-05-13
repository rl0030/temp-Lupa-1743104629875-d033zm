/*
  # Create trainer metadata table

  1. New Tables
    - `trainer_metadata`
      - `id` (uuid, primary key)
      - `user_uid` (text, references users.uid)
      - `clients` (jsonb)
      - `hourly_rate` (numeric)
      - `home_gym` (jsonb)
      - `is_verified` (boolean)
      - `is_checked` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `trainer_metadata` table
    - Add policy for authenticated users to read their own data
    - Add policy for authenticated users to update their own data
*/

CREATE TABLE IF NOT EXISTS trainer_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uid text REFERENCES users(uid) ON DELETE CASCADE,
  clients jsonb DEFAULT '[]',
  hourly_rate numeric DEFAULT 0,
  home_gym jsonb,
  is_verified boolean DEFAULT false,
  is_checked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trainer_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can read own metadata"
  ON trainer_metadata
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_uid);

CREATE POLICY "Trainers can update own metadata"
  ON trainer_metadata
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_uid);

CREATE POLICY "Users can read trainer metadata"
  ON trainer_metadata
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Trainers can insert own metadata"
  ON trainer_metadata
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_uid);