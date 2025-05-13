/*
  # Create user stripe details table

  1. New Tables
    - `user_stripe_details`
      - `id` (uuid, primary key)
      - `lupa_uid` (text, references users.uid)
      - `customer_id` (text)
      - `stripe_account_id` (text)
      - `stripe_account_enabled` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `user_stripe_details` table
    - Add policy for users to read and update their own stripe details
*/

CREATE TABLE IF NOT EXISTS user_stripe_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lupa_uid text REFERENCES users(uid) ON DELETE CASCADE,
  customer_id text,
  stripe_account_id text,
  stripe_account_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_stripe_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own stripe details"
  ON user_stripe_details
  FOR SELECT
  TO authenticated
  USING (auth.uid() = lupa_uid);

CREATE POLICY "Users can update their own stripe details"
  ON user_stripe_details
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = lupa_uid);

CREATE POLICY "Users can insert their own stripe details"
  ON user_stripe_details
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = lupa_uid);