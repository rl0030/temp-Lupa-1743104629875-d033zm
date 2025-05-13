/*
  # Create purchased packages table

  1. New Tables
    - `purchased_packages`
      - `id` (uuid, primary key)
      - `uid` (text, unique)
      - `purchase_uid` (text)
      - `client_type` (text)
      - `client` (text)
      - `trainer_uid` (text, references users.uid)
      - `name` (text)
      - `description` (text)
      - `num_sessions` (integer)
      - `price` (numeric)
      - `status` (text)
      - `scheduled_meeting_uids` (text[])
      - `package_type` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `purchased_packages` table
    - Add policy for clients to read their own purchased packages
    - Add policy for trainers to read packages purchased from them
*/

CREATE TABLE IF NOT EXISTS purchased_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  purchase_uid text NOT NULL,
  client_type text NOT NULL,
  client text NOT NULL,
  trainer_uid text REFERENCES users(uid) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  num_sessions integer NOT NULL,
  price numeric NOT NULL,
  status text NOT NULL,
  scheduled_meeting_uids text[] DEFAULT '{}',
  package_type integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE purchased_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can read their own purchased packages"
  ON purchased_packages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = client);

CREATE POLICY "Trainers can read packages purchased from them"
  ON purchased_packages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = trainer_uid);

CREATE POLICY "Trainers can update packages they sold"
  ON purchased_packages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = trainer_uid);