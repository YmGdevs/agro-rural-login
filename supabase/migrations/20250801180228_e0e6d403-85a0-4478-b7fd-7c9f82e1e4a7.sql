-- Add foreign key constraint between vouchers and loan_requests
ALTER TABLE vouchers 
ADD CONSTRAINT fk_vouchers_loan_request 
FOREIGN KEY (loan_request_id) 
REFERENCES loan_requests(id) 
ON DELETE CASCADE;