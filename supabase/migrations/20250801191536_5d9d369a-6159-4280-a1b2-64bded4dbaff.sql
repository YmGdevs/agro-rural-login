-- Enable real-time for vouchers table
ALTER TABLE vouchers REPLICA IDENTITY FULL;

-- Add vouchers table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE vouchers;