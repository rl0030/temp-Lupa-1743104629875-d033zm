/*
  # Create packs table

  1. New Tables
    - `packs`
      - `id` (uuid, primary key)
      - `uid` (text, unique)
      - `owner` (text, references users.uid)
      - `name` (text)
      - `members` (text[])
      - `pending_invites` (text[])
      - `creator` (text, references users.uid)
      - `package_uid` (text)
      - `greeting_message` (text)
      - `is_live` (boolean)
      - `external_invites` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `packs` table
    - Add policy for authenticated users to read packs they are members of
    - Add policy for authenticated users to update packs they own
*/

CREATE TABLE IF NOT EXISTS packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  owner text REFERENCES users(uid) ON DELETE CASCADE,
  name text NOT NULL,
  members text[] DEFAULT '{}',
  pending_invites text[] DEFAULT '{}',
  creator text REFERENCES users(uid) ON DELETE CASCADE,
  package_uid text,
  greeting_message text,
  is_live boolean DEFAULT false,
  external_invites jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read packs they are members of"
  ON packs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(members) OR auth.uid() = owner);

CREATE POLICY "Users can update packs they own"
  ON packs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner);

CREATE POLICY "Users can insert packs they create"
  ON packs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator);

CREATE POLICY "Users can read packs they are invited to"
  ON packs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(pending_invites));