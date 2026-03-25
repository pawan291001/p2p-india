
-- Deal messages table for off-chain chat
CREATE TABLE public.deal_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id INTEGER NOT NULL,
  sender_address TEXT NOT NULL,
  message TEXT,
  attachment_url TEXT,
  attachment_type TEXT CHECK (attachment_type IN ('image', 'video')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookup by deal
CREATE INDEX idx_deal_messages_deal_id ON public.deal_messages (deal_id, created_at);

-- Enable RLS
ALTER TABLE public.deal_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can read messages (wallet auth happens client-side)
CREATE POLICY "Anyone can read deal messages" ON public.deal_messages
  FOR SELECT USING (true);

-- Anyone can insert messages (sender_address verified client-side via wallet)
CREATE POLICY "Anyone can send deal messages" ON public.deal_messages
  FOR INSERT WITH CHECK (true);

-- Allow deletion for cleanup
CREATE POLICY "Anyone can delete deal messages" ON public.deal_messages
  FOR DELETE USING (true);

-- Enable realtime for live chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_messages;
