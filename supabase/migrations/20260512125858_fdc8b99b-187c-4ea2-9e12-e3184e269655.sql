CREATE TABLE public.device_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'ios',
  bundle_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon) to insert/upsert their own device token from the app
CREATE POLICY "anon_can_insert_device_tokens"
ON public.device_tokens FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to update last_seen_at on existing tokens
CREATE POLICY "anon_can_update_last_seen"
ON public.device_tokens FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Reads/deletes are service-role only (no policy for select/delete)