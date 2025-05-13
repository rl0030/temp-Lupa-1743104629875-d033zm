/*
  # Create notifications table

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `receiver` (text, references users.uid)
      - `sender` (text, references users.uid)
      - `type` (text)
      - `title` (text)
      - `message` (text)
      - `metadata` (jsonb)
      - `is_read` (boolean)
      - `scheduled_for` (timestamptz)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `notifications` table
    - Add policy for users to read their own notifications
    - Add policy for users to update their own notifications
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receiver text REFERENCES users(uid) ON DELETE CASCADE,
  sender text REFERENCES users(uid) ON DELETE SET NULL,
  type text NOT NULL,
  title text,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  scheduled_for timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = receiver);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver);

CREATE POLICY "Users can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender);