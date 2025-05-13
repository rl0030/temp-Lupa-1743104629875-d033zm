/*
  # Create scheduled events tables

  1. New Tables
    - `user_scheduled_events`
      - `id` (uuid, primary key)
      - `uid` (text, unique)
      - `user_uid` (text, references users.uid)
      - `date` (text)
      - `start_time` (text)
      - `end_time` (text)
      - `type` (text)
      - `event_uid` (text)
      - `package_uid` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
    - `pack_scheduled_events`
      - `id` (uuid, primary key)
      - `uid` (text, unique)
      - `pack_uid` (text, references packs.uid)
      - `date` (text)
      - `start_time` (text)
      - `end_time` (text)
      - `type` (text)
      - `event_uid` (text)
      - `package_uid` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for reading and writing
*/

-- User scheduled events table
CREATE TABLE IF NOT EXISTS user_scheduled_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  user_uid text REFERENCES users(uid) ON DELETE CASCADE,
  date text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  type text NOT NULL,
  event_uid text NOT NULL,
  package_uid text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_scheduled_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own scheduled events"
  ON user_scheduled_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_uid);

CREATE POLICY "Users can insert their own scheduled events"
  ON user_scheduled_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_uid);

CREATE POLICY "Users can update their own scheduled events"
  ON user_scheduled_events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_uid);

-- Pack scheduled events table
CREATE TABLE IF NOT EXISTS pack_scheduled_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  pack_uid text NOT NULL,
  date text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  type text NOT NULL,
  event_uid text NOT NULL,
  package_uid text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pack_scheduled_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pack members can read pack scheduled events"
  ON pack_scheduled_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM packs 
      WHERE uid = pack_uid 
      AND (auth.uid()::text = ANY(members) OR auth.uid()::text = owner)
    )
  );

CREATE POLICY "Pack owners can insert pack scheduled events"
  ON pack_scheduled_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM packs 
      WHERE uid = pack_uid 
      AND auth.uid()::text = owner
    )
  );

CREATE POLICY "Pack owners can update pack scheduled events"
  ON pack_scheduled_events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM packs 
      WHERE uid = pack_uid 
      AND auth.uid()::text = owner
    )
  );