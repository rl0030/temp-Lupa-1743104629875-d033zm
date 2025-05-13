/*
  # Create realtime messages tables

  1. New Tables
    - `private_messages`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references auth.users.id)
      - `receiver_id` (uuid, references auth.users.id)
      - `text` (text)
      - `type` (integer)
      - `metadata` (jsonb)
      - `timestamp` (bigint)
      - `created_at` (timestamptz)
    
    - `pack_messages`
      - `id` (uuid, primary key)
      - `pack_id` (uuid, references packs.id)
      - `sender_id` (uuid, references auth.users.id)
      - `text` (text)
      - `type` (integer)
      - `metadata` (jsonb)
      - `timestamp` (bigint)
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on both tables
    - Add appropriate policies for reading and writing messages
*/

-- Private messages table
CREATE TABLE IF NOT EXISTS private_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  type integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  timestamp bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages they sent or received"
  ON private_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages they send"
  ON private_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Pack messages table
CREATE TABLE IF NOT EXISTS pack_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid REFERENCES packs(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  type integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  timestamp bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pack_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pack members can read pack messages"
  ON pack_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM packs 
      WHERE id = pack_id 
      AND (auth.uid()::text = ANY(members) OR auth.uid()::text = owner)
    )
  );

CREATE POLICY "Pack members can insert pack messages"
  ON pack_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM packs 
      WHERE id = pack_id 
      AND (auth.uid()::text = ANY(members) OR auth.uid()::text = owner)
    )
  );

-- Conversations table to track last messages
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  other_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_id uuid REFERENCES private_messages(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, other_user_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Pack conversations table
CREATE TABLE IF NOT EXISTS pack_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id uuid REFERENCES packs(id) ON DELETE CASCADE,
  last_message_id uuid REFERENCES pack_messages(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, pack_id)
);

ALTER TABLE pack_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own pack conversations"
  ON pack_conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own pack conversations"
  ON pack_conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pack conversations"
  ON pack_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);