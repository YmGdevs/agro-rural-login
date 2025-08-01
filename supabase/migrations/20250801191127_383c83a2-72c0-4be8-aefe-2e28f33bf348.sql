-- Create vouchers manually for the approved loan requests that don't have them yet
INSERT INTO vouchers (loan_request_id, voucher_code)
SELECT lr.id, generate_voucher_code()
FROM loan_requests lr
WHERE lr.status = 'approved' 
AND NOT EXISTS (SELECT 1 FROM vouchers v WHERE v.loan_request_id = lr.id);