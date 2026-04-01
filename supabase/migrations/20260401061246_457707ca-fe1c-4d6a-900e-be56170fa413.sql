
CREATE TABLE public.crypto_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  image_url TEXT,
  source TEXT DEFAULT 'AI Generated',
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.crypto_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read crypto news"
  ON public.crypto_news
  FOR SELECT
  TO anon, authenticated
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.crypto_news;
