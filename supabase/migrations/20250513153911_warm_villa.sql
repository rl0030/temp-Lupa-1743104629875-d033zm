/*
  # Create activities tables (bootcamps, seminars, dailies)

  1. New Tables
    - `bootcamps`
      - `id` (uuid, primary key)
      - `uid` (text, unique)
      - `name` (text)
      - `description` (text)
      - `start_time` (text)
      - `end_time` (text)
      - `date` (text)
      - `date_in_utc` (text)
      - `date_only` (text)
      - `user_slots` (text[])
      - `max_slots` (integer)
      - `pricing` (jsonb)
      - `location` (jsonb)
      - `trainer_uid` (text, references users.uid)
      - `metadata` (jsonb)
      - `media` (text)
      - `categories` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
    - `seminars` (similar structure to bootcamps)
    
    - `dailies`
      - `id` (uuid, primary key)
      - `uid` (text, unique)
      - `trainer_uid` (text, references users.uid)
      - `title` (text)
      - `description` (text)
      - `date` (timestamptz)
      - `date_utc` (text)
      - `date_only` (text)
      - `items` (jsonb)
      - `media` (text)
      - `tags` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for reading and writing
*/

-- Bootcamps table
CREATE TABLE IF NOT EXISTS bootcamps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  start_time text NOT NULL,
  end_time text NOT NULL,
  date text NOT NULL,
  date_in_utc text NOT NULL,
  date_only text NOT NULL,
  user_slots text[] DEFAULT '{}',
  max_slots integer NOT NULL,
  pricing jsonb NOT NULL,
  location jsonb NOT NULL,
  trainer_uid text REFERENCES users(uid) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}',
  media text,
  categories text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bootcamps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can read and write their own bootcamps"
  ON bootcamps
  FOR ALL
  TO authenticated
  USING (auth.uid() = trainer_uid);

CREATE POLICY "Users can read all bootcamps"
  ON bootcamps
  FOR SELECT
  TO authenticated
  USING (true);

-- Seminars table
CREATE TABLE IF NOT EXISTS seminars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  start_time text NOT NULL,
  end_time text NOT NULL,
  date text NOT NULL,
  date_in_utc text NOT NULL,
  date_only text NOT NULL,
  user_slots text[] DEFAULT '{}',
  max_slots integer NOT NULL,
  pricing jsonb NOT NULL,
  location jsonb NOT NULL,
  trainer_uid text REFERENCES users(uid) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}',
  media text,
  categories text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE seminars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can read and write their own seminars"
  ON seminars
  FOR ALL
  TO authenticated
  USING (auth.uid() = trainer_uid);

CREATE POLICY "Users can read all seminars"
  ON seminars
  FOR SELECT
  TO authenticated
  USING (true);

-- Dailies table
CREATE TABLE IF NOT EXISTS dailies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  trainer_uid text REFERENCES users(uid) ON DELETE CASCADE,
  title text,
  description text,
  date timestamptz NOT NULL,
  date_utc text NOT NULL,
  date_only text NOT NULL,
  items jsonb DEFAULT '[]',
  media text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE dailies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can read and write their own dailies"
  ON dailies
  FOR ALL
  TO authenticated
  USING (auth.uid() = trainer_uid);

CREATE POLICY "Users can read all dailies"
  ON dailies
  FOR SELECT
  TO authenticated
  USING (true);