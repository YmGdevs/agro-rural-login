-- Create missing voucher for the approved loan
INSERT INTO vouchers (loan_request_id, voucher_code)
SELECT 
  '2bbdd20e-ad8d-4f23-a048-10dd262d314c',
  generate_voucher_code()
WHERE NOT EXISTS (
  SELECT 1 FROM vouchers WHERE loan_request_id = '2bbdd20e-ad8d-4f23-a048-10dd262d314c'
);