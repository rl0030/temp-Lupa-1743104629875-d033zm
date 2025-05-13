/*
  # Create packages table

  1. New Tables
    - `packages`
      - `id` (uuid, primary key)
      - `uid` (text, unique)
      - `name` (text)
      - `description` (text)
      - `num_sessions` (integer)
      - `price` (numeric)
      - `trainer_uid` (text, references users.uid)
      - `status` (text)
      - `scheduled_meeting_uids` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `packages` table
    - Add policy for trainers to read and update their own packages
    - Add policy for users to read all packages
*/

CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  num_sessions integer NOT NULL,
  price numeric NOT NULL,
  trainer_uid text REFERENCES users(uid) ON DELETE CASCADE,
  status text NOT NULL,
  scheduled_meeting_uids text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can read and update their own packages"
  ON packages
  FOR ALL
  TO authenticated
  USING (auth.uid() = trainer_uid);

CREATE POLICY "Users can read all packages"
  ON packages
  FOR SELECT
  TO authenticated
  USING (true);