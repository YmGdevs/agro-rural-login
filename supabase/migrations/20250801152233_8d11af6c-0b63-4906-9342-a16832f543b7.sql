-- Enable real-time for loan_requests table
ALTER TABLE loan_requests REPLICA IDENTITY FULL;

-- Add loan_requests table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE loan_requests;