-- Run this in your Supabase SQL editor
CREATE TABLE IF NOT EXISTS tiktok_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_chat_id bigint UNIQUE NOT NULL,
  tiktok_open_id text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
