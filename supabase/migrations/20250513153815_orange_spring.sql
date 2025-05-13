/*
  # Create scheduled sessions table

  1. New Tables
    - `scheduled_sessions`
      - `id` (uuid, primary key)
      - `uid` (text, unique)
      - `trainer_uid` (text, references users.uid)
      - `clients` (text[])
      - `start_time` (text)
      - `end_time` (text)
      - `date` (text)
      - `programs` (jsonb)
      - `status` (text)
      - `package_uid` (text)
      - `availability_uid` (text)
      - `price` (numeric)
      - `session_note` (text)
      - `client_type` (text)
      - `type` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `scheduled_sessions` table
    - Add policy for trainers to read their own sessions
    - Add policy for clients to read their own sessions
*/

CREATE TABLE IF NOT EXISTS scheduled_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  trainer_uid text REFERENCES users(uid) ON DELETE CASCADE,
  clients text[] NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  date text NOT NULL,
  programs jsonb DEFAULT '[]',
  status text NOT NULL,
  package_uid text,
  availability_uid text,
  price numeric,
  session_note text,
  client_type text NOT NULL,
  type integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scheduled_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can read their own sessions"
  ON scheduled_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = trainer_uid);

CREATE POLICY "Clients can read their own sessions"
  ON scheduled_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(clients));

CREATE POLICY "Trainers can update their own sessions"
  ON scheduled_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = trainer_uid);

CREATE POLICY "Trainers can insert sessions"
  ON scheduled_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = trainer_uid);