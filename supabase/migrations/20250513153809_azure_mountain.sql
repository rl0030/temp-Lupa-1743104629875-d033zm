/*
  # Create trainer availability table

  1. New Tables
    - `trainer_availability`
      - `id` (uuid, primary key)
      - `uid` (text, unique)
      - `trainer_uid` (text, references users.uid)
      - `date` (text)
      - `start_time` (text)
      - `end_time` (text)
      - `is_booked` (boolean)
      - `price` (numeric)
      - `package_uid` (text)
      - `scheduled_meeting_uid` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `trainer_availability` table
    - Add policy for authenticated users to read trainer availability
    - Add policy for trainers to update their own availability
*/

CREATE TABLE IF NOT EXISTS trainer_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  trainer_uid text REFERENCES users(uid) ON DELETE CASCADE,
  date text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  is_booked boolean DEFAULT false,
  price numeric,
  package_uid text,
  scheduled_meeting_uid text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trainer_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read trainer availability"
  ON trainer_availability
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Trainers can update their own availability"
  ON trainer_availability
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = trainer_uid);

CREATE POLICY "Trainers can insert their own availability"
  ON trainer_availability
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = trainer_uid);

CREATE POLICY "Trainers can delete their own availability"
  ON trainer_availability
  FOR DELETE
  TO authenticated
  USING (auth.uid() = trainer_uid);