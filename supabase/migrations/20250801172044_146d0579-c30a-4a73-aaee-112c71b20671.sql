-- Create vouchers table
CREATE TABLE public.vouchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_request_id UUID NOT NULL UNIQUE,
  voucher_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vouchers
CREATE POLICY "Extensionistas can view vouchers for their loan requests"
ON public.vouchers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM loan_requests lr
    WHERE lr.id = vouchers.loan_request_id
    AND (
      get_current_user_role() = 'admin'::app_role
      OR lr.extensionista_id = (
        SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Empresa fomentadora can view all vouchers"
ON public.vouchers
FOR SELECT
USING (
  get_current_user_role() = ANY (ARRAY['empresa_fomentadora'::app_role, 'admin'::app_role])
);

CREATE POLICY "System can create vouchers"
ON public.vouchers
FOR INSERT
WITH CHECK (auth.role() = 'authenticated'::text);

-- Function to generate unique voucher code
CREATE OR REPLACE FUNCTION generate_voucher_code()
RETURNS TEXT AS $$
DECLARE
  today_str TEXT;
  sequence_num INTEGER;
  voucher_code TEXT;
BEGIN
  -- Get today's date in YYYYMMDD format
  today_str := to_char(CURRENT_DATE, 'YYYYMMDD');
  
  -- Get the next sequence number for today
  SELECT COALESCE(MAX(
    CASE 
      WHEN voucher_code LIKE 'VCH-' || today_str || '-%' 
      THEN CAST(RIGHT(voucher_code, 3) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO sequence_num
  FROM vouchers
  WHERE voucher_code LIKE 'VCH-' || today_str || '-%';
  
  -- Generate the voucher code
  voucher_code := 'VCH-' || today_str || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN voucher_code;
END;
$$ LANGUAGE plpgsql;

-- Function to create voucher for approved loan
CREATE OR REPLACE FUNCTION create_voucher_for_approved_loan()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create voucher if status changed to 'approved' and no voucher exists yet
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Check if voucher already exists
    IF NOT EXISTS (SELECT 1 FROM vouchers WHERE loan_request_id = NEW.id) THEN
      INSERT INTO vouchers (loan_request_id, voucher_code)
      VALUES (NEW.id, generate_voucher_code());
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER create_voucher_on_approval
  AFTER UPDATE ON loan_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_voucher_for_approved_loan();

-- Create function to update timestamps
CREATE TRIGGER update_vouchers_updated_at
  BEFORE UPDATE ON public.vouchers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();