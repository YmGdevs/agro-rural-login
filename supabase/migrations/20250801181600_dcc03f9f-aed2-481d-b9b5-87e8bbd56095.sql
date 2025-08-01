-- Fix the voucher code generation function to avoid naming conflict
CREATE OR REPLACE FUNCTION public.generate_voucher_code()
RETURNS TEXT AS $$
DECLARE
  today_str TEXT;
  sequence_num INTEGER;
  new_voucher_code TEXT;
BEGIN
  -- Get today's date in YYYYMMDD format
  today_str := to_char(CURRENT_DATE, 'YYYYMMDD');
  
  -- Get the next sequence number for today
  SELECT COALESCE(MAX(
    CASE 
      WHEN v.voucher_code LIKE 'VCH-' || today_str || '-%' 
      THEN CAST(RIGHT(v.voucher_code, 3) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO sequence_num
  FROM vouchers v
  WHERE v.voucher_code LIKE 'VCH-' || today_str || '-%';
  
  -- Generate the voucher code
  new_voucher_code := 'VCH-' || today_str || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN new_voucher_code;
END;
$$ LANGUAGE plpgsql;

-- Now create the missing voucher
INSERT INTO vouchers (loan_request_id, voucher_code)
VALUES ('2bbdd20e-ad8d-4f23-a048-10dd262d314c', generate_voucher_code());