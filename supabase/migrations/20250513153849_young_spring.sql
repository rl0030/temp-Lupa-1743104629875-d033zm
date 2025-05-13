/*
  # Create user exercise sets table

  1. New Tables
    - `user_exercise_sets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users.id)
      - `exercise_category` (text)
      - `count` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `user_exercise_sets` table
    - Add policy for users to read and update their own exercise sets
*/

CREATE TABLE IF NOT EXISTS user_exercise_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_category text NOT NULL,
  count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, exercise_category)
);

ALTER TABLE user_exercise_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own exercise sets"
  ON user_exercise_sets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise sets"
  ON user_exercise_sets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exercise sets"
  ON user_exercise_sets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);