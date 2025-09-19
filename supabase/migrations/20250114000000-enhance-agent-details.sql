-- Add agent-specific fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN agent_name TEXT;

ALTER TABLE public.profiles 
ADD COLUMN vehicle_number TEXT;

ALTER TABLE public.profiles 
ADD COLUMN vehicle_type TEXT;

ALTER TABLE public.profiles 
ADD COLUMN license_number TEXT;

ALTER TABLE public.profiles 
ADD COLUMN contact_number TEXT;

-- Update existing agent profiles with sample data for testing
UPDATE public.profiles 
SET 
  agent_name = 'Agent ' || COALESCE(agent_id, 'Unknown'),
  vehicle_number = 'VH-001',
  vehicle_type = 'Motorcycle',
  license_number = 'DL-12345678',
  contact_number = phone
WHERE role = 'agent';

-- Create a view that joins orders with agent details for easier querying
CREATE OR REPLACE VIEW public.orders_with_agent_details AS
SELECT 
  o.*,
  ap.full_name as agent_full_name,
  ap.agent_name,
  ap.agent_id as agent_code,
  ap.vehicle_number,
  ap.vehicle_type,
  ap.license_number,
  ap.contact_number as agent_contact,
  ap.phone as agent_phone
FROM public.orders o
LEFT JOIN public.profiles ap ON o.agent_id = ap.user_id;

-- Grant permissions for the view
GRANT SELECT ON public.orders_with_agent_details TO authenticated;

-- Create a function to get complete order details with agent info
CREATE OR REPLACE FUNCTION public.get_order_with_agent_details(order_uuid UUID)
RETURNS SETOF public.orders_with_agent_details
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT * FROM public.orders_with_agent_details 
  WHERE id = order_uuid;
$$;
