/*
  # Create studios table

  1. New Tables
    - `studios`
      - `id` (uuid, primary key)
      - `uid` (text, unique)
      - `name` (text)
      - `description` (text)
      - `picture` (text)
      - `hours_of_operation` (jsonb)
      - `trainers` (text[])
      - `owner_uid` (text, references users.uid)
      - `location` (jsonb)
      - `pricing` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `studios` table
    - Add policy for studio owners to read and update their studios
    - Add policy for users to read all studios
*/

CREATE TABLE IF NOT EXISTS studios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  picture text,
  hours_of_operation jsonb DEFAULT '[]',
  trainers text[] DEFAULT '{}',
  owner_uid text REFERENCES users(uid) ON DELETE CASCADE,
  location jsonb NOT NULL,
  pricing jsonb DEFAULT '{"leasing_fee": 0}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE studios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio owners can read and update their studios"
  ON studios
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_uid);

CREATE POLICY "Users can read all studios"
  ON studios
  FOR SELECT
  TO authenticated
  USING (true);