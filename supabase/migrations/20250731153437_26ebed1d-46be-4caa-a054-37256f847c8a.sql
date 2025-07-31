-- Create table for land plots/parcelas
CREATE TABLE public.parcelas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  produtor_id UUID NOT NULL REFERENCES public.producers(id) ON DELETE CASCADE,
  coordenadas JSONB NOT NULL, -- Store GPS coordinates as JSON
  area_metros_quadrados DECIMAL,
  perimetro_metros DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.parcelas ENABLE ROW LEVEL SECURITY;

-- Create policies for parcelas access
CREATE POLICY "Anyone can view parcelas" 
ON public.parcelas 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create parcelas" 
ON public.parcelas 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update parcelas" 
ON public.parcelas 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_parcelas_updated_at
BEFORE UPDATE ON public.parcelas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();