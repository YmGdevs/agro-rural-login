-- Create producers table
CREATE TABLE public.producers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  genero TEXT NOT NULL,
  idade INTEGER NOT NULL,
  nuit TEXT NOT NULL UNIQUE,
  documento_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.producers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view producers (public data)
CREATE POLICY "Anyone can view producers" 
ON public.producers 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to create producers
CREATE POLICY "Anyone can create producers" 
ON public.producers 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_producers_updated_at
BEFORE UPDATE ON public.producers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();