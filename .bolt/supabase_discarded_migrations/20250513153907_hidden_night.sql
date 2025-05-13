/*
  # Create session summary table

  1. New Tables
    - `session_summary`
      - `id` (uuid, primary key)
      - `trainer_uid` (text, references users.uid)
      - `clients` (text[])
      - `appointment_note` (text)
      - `exercises_completed` (jsonb)
      - `total_session_duration` (integer)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `session_summary` table
    - Add policy for trainers to read and write their own session summaries
    - Add policy for clients to read their own session summaries
*/

CREATE TABLE IF NOT EXISTS session_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_uid text REFERENCES users(uid) ON DELETE CASCADE,
  clients text[] NOT NULL,
  appointment_note text,
  exercises_completed jsonb DEFAULT '[]',
  total_session_duration integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE session_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can read and write their own session summaries"
  ON session_summary
  FOR ALL
  TO authenticated
  USING (auth.uid() = trainer_uid);

CREATE POLICY "Clients can read their own session summaries"
  ON session_summary
  FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(clients));