
CREATE TABLE public.wallet_payment_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  seller_name TEXT DEFAULT '',
  payment_method TEXT DEFAULT '',
  upi_id TEXT DEFAULT '',
  bank_name TEXT DEFAULT '',
  account_number TEXT DEFAULT '',
  ifsc_code TEXT DEFAULT '',
  payment_id TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wallet_address)
);

ALTER TABLE public.wallet_payment_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read wallet payment profiles"
ON public.wallet_payment_profiles FOR SELECT USING (true);

CREATE POLICY "Anyone can insert wallet payment profiles"
ON public.wallet_payment_profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update wallet payment profiles"
ON public.wallet_payment_profiles FOR UPDATE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_wallet_payment_profiles_updated_at
BEFORE UPDATE ON public.wallet_payment_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
