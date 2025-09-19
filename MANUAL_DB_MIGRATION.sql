-- Manual Database Migration Script
-- Execute these commands in your Supabase SQL Editor to add agent details

-- Step 1: Add new columns to profiles table
-- Note: Run these one by one in Supabase SQL Editor. Ignore "column already exists" errors.

ALTER TABLE public.profiles ADD COLUMN agent_name TEXT;
ALTER TABLE public.profiles ADD COLUMN vehicle_number TEXT;
ALTER TABLE public.profiles ADD COLUMN vehicle_type TEXT;
ALTER TABLE public.profiles ADD COLUMN license_number TEXT;
ALTER TABLE public.profiles ADD COLUMN contact_number TEXT;

-- Step 2: Update existing agent profiles with sample data
UPDATE public.profiles 
SET 
  agent_name = CASE 
    WHEN agent_id IS NOT NULL THEN 'Agent ' || agent_id
    ELSE 'Agent Unknown'
  END,
  vehicle_number = 'VH-001',
  vehicle_type = 'Motorcycle',
  license_number = 'DL-12345678',
  contact_number = phone
WHERE role = 'agent' AND agent_name IS NULL;

-- Step 3: Create a view for orders with agent details
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

-- Step 4: Grant permissions
GRANT SELECT ON public.orders_with_agent_details TO authenticated;

-- Step 5: Create function for fetching order with agent details
CREATE OR REPLACE FUNCTION public.get_order_with_agent_details(order_uuid UUID)
RETURNS SETOF public.orders_with_agent_details
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT * FROM public.orders_with_agent_details 
  WHERE id = order_uuid;
$$;

-- Step 6: Verify the setup by checking existing orders
SELECT 
  o.order_number,
  o.customer_name,
  ap.full_name as agent_name,
  ap.agent_id,
  ap.vehicle_number
FROM public.orders o
LEFT JOIN public.profiles ap ON o.agent_id = ap.user_id
LIMIT 5;
