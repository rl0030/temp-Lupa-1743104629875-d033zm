/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `uid` (text, unique)
      - `name` (text)
      - `username` (text, unique)
      - `email` (text, unique)
      - `number` (text)
      - `picture` (text)
      - `role` (text)
      - `is_onboarding_completed` (boolean)
      - `time_created_utc` (bigint)
      - `biography` (text)
      - `interest` (text[])
      - `location` (jsonb)
      - `settings` (jsonb)
      - `interactions` (jsonb)
      - `fitness_profile` (jsonb)
      - `lupa_metadata` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read their own data
    - Add policy for authenticated users to update their own data
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  name text NOT NULL,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  number text,
  picture text,
  role text NOT NULL,
  is_onboarding_completed boolean DEFAULT false,
  time_created_utc bigint,
  biography text,
  interest text[],
  location jsonb,
  settings jsonb DEFAULT '{"blocked_uids": []}',
  interactions jsonb DEFAULT '{"favorites": []}',
  fitness_profile jsonb DEFAULT '{"languages_spoken": [], "medical_conditions": []}',
  lupa_metadata jsonb DEFAULT '{"path": null}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = uid);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = uid);

CREATE POLICY "Users can read other users' public data"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uid);