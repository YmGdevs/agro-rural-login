-- Create loan_requests table
CREATE TABLE public.loan_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producer_id UUID NOT NULL,
  extensionista_id UUID NOT NULL,
  loan_type TEXT NOT NULL CHECK (loan_type IN ('money', 'item')),
  amount DECIMAL(12,2),
  item_description TEXT,
  description TEXT,
  justification TEXT NOT NULL,
  community_consent BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  review_comments TEXT
);

-- Create regional_capacity table
CREATE TABLE public.regional_capacity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region TEXT NOT NULL,
  total_area_m2 DECIMAL(15,2) DEFAULT 0,
  total_producers INTEGER DEFAULT 0,
  total_parcelas INTEGER DEFAULT 0,
  average_loan_amount DECIMAL(12,2) DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(region)
);

-- Enable RLS
ALTER TABLE public.loan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_capacity ENABLE ROW LEVEL SECURITY;

-- RLS policies for loan_requests
CREATE POLICY "Empresa fomentadora can view all loan requests"
ON public.loan_requests
FOR SELECT
USING (get_current_user_role() = 'empresa_fomentadora' OR get_current_user_role() = 'admin');

CREATE POLICY "Extensionistas can view their loan requests"
ON public.loan_requests
FOR SELECT
USING (get_current_user_role() = 'admin' OR extensionista_id = (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Extensionistas can create loan requests"
ON public.loan_requests
FOR INSERT
WITH CHECK (get_current_user_role() IN ('extensionista', 'admin') AND extensionista_id = (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Empresa fomentadora can update loan requests"
ON public.loan_requests
FOR UPDATE
USING (get_current_user_role() = 'empresa_fomentadora' OR get_current_user_role() = 'admin');

-- RLS policies for regional_capacity
CREATE POLICY "All authenticated users can view regional capacity"
ON public.regional_capacity
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage regional capacity"
ON public.regional_capacity
FOR ALL
USING (get_current_user_role() = 'admin');

-- Add foreign key constraints
ALTER TABLE public.loan_requests
ADD CONSTRAINT fk_loan_requests_producer
FOREIGN KEY (producer_id) REFERENCES public.producers(id);

ALTER TABLE public.loan_requests
ADD CONSTRAINT fk_loan_requests_extensionista
FOREIGN KEY (extensionista_id) REFERENCES public.profiles(id);

ALTER TABLE public.loan_requests
ADD CONSTRAINT fk_loan_requests_reviewer
FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_loan_requests_updated_at
BEFORE UPDATE ON public.loan_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_regional_capacity_updated_at
BEFORE UPDATE ON public.regional_capacity
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update regional capacity stats
CREATE OR REPLACE FUNCTION update_regional_capacity_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update regional capacity when loan requests change
  INSERT INTO public.regional_capacity (region, total_area_m2, total_producers, total_parcelas)
  SELECT 
    COALESCE(prof.region, 'Unknown') as region,
    COALESCE(SUM(parc.area_metros_quadrados), 0) as total_area_m2,
    COUNT(DISTINCT prod.id) as total_producers,
    COUNT(parc.id) as total_parcelas
  FROM public.producers prod
  LEFT JOIN public.profiles prof ON prod.extensionista_id = prof.id
  LEFT JOIN public.parcelas parc ON prod.id = parc.produtor_id
  WHERE prof.region = COALESCE((SELECT region FROM profiles WHERE id = NEW.extensionista_id), 'Unknown')
  GROUP BY prof.region
  ON CONFLICT (region) 
  DO UPDATE SET
    total_area_m2 = EXCLUDED.total_area_m2,
    total_producers = EXCLUDED.total_producers,
    total_parcelas = EXCLUDED.total_parcelas,
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for regional capacity updates
CREATE TRIGGER update_regional_stats_on_loan_request
AFTER INSERT OR UPDATE ON public.loan_requests
FOR EACH ROW
EXECUTE FUNCTION update_regional_capacity_stats();