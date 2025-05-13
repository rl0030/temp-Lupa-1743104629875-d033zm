/*
  # Create trainer client relationship table

  1. New Tables
    - `trainer_client_relationship`
      - `id` (uuid, primary key)
      - `uid` (text, unique)
      - `trainer_uid` (text, references users.uid)
      - `client_uid` (text, references users.uid)
      - `linked_programs` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `trainer_client_relationship` table
    - Add policy for trainers to read and update their client relationships
    - Add policy for clients to read their trainer relationships
*/

CREATE TABLE IF NOT EXISTS trainer_client_relationship (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  trainer_uid text REFERENCES users(uid) ON DELETE CASCADE,
  client_uid text NOT NULL,
  linked_programs text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trainer_client_relationship ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can read and update their client relationships"
  ON trainer_client_relationship
  FOR ALL
  TO authenticated
  USING (auth.uid() = trainer_uid);

CREATE POLICY "Clients can read their trainer relationships"
  ON trainer_client_relationship
  FOR SELECT
  TO authenticated
  USING (auth.uid() = client_uid);