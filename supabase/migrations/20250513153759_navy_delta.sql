/*
  # Create purchased programs table

  1. New Tables
    - `purchased_programs`
      - `id` (uuid, primary key)
      - `lupa_user_uid` (text, references users.uid)
      - `programs` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `purchased_programs` table
    - Add policy for authenticated users to read their own purchased programs
    - Add policy for authenticated users to update their own purchased programs
*/

CREATE TABLE IF NOT EXISTS purchased_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lupa_user_uid text REFERENCES users(uid) ON DELETE CASCADE,
  programs jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE purchased_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own purchased programs"
  ON purchased_programs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = lupa_user_uid);

CREATE POLICY "Users can update own purchased programs"
  ON purchased_programs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = lupa_user_uid);

CREATE POLICY "Users can insert own purchased programs"
  ON purchased_programs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = lupa_user_uid);