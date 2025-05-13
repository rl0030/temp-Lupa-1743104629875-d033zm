/*
  # Create achievements table

  1. New Tables
    - `achievements`
      - `id` (uuid, primary key)
      - `uid` (text, unique)
      - `user_id` (uuid, references auth.users.id)
      - `exercise_category` (text)
      - `tier` (integer)
      - `current_sets` (integer)
      - `achieved_at` (timestamptz)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `achievements` table
    - Add policy for users to read their own achievements
*/

CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_category text NOT NULL,
  tier integer NOT NULL,
  current_sets integer NOT NULL,
  achieved_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own achievements"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);