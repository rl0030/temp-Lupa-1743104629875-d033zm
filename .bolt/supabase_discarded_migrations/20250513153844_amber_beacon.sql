/*
  # Create user achievement progress table

  1. New Tables
    - `user_achievement_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users.id)
      - `exercise_category` (text)
      - `current_tier` (integer)
      - `current_sets` (integer)
      - `next_tier` (integer)
      - `sets_to_next_tier` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `user_achievement_progress` table
    - Add policy for users to read and update their own achievement progress
*/

CREATE TABLE IF NOT EXISTS user_achievement_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_category text NOT NULL,
  current_tier integer NOT NULL,
  current_sets integer NOT NULL,
  next_tier integer NOT NULL,
  sets_to_next_tier integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, exercise_category)
);

ALTER TABLE user_achievement_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own achievement progress"
  ON user_achievement_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievement progress"
  ON user_achievement_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievement progress"
  ON user_achievement_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);