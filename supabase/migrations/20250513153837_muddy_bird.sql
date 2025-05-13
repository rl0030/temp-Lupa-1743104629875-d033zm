/*
  # Create exercise library table

  1. New Tables
    - `exercise_library`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users.id)
      - `exercises` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `exercise_library` table
    - Add policy for users to read and update their own exercise library
*/

CREATE TABLE IF NOT EXISTS exercise_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  exercises jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own exercise library"
  ON exercise_library
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise library"
  ON exercise_library
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exercise library"
  ON exercise_library
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);