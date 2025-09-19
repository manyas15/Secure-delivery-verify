-- Update your profile to be an agent for testing
UPDATE public.profiles 
SET role = 'agent', agent_id = 'AGT-001', phone = '+1234567890'
WHERE user_id = '9b0606c7-64b6-42c3-b2a2-7163c4404472';

-- Create sample orders assigned to you as the agent
INSERT INTO public.orders (
  order_number, 
  customer_id, 
  agent_id,
  customer_name, 
  customer_phone, 
  delivery_address, 
  items, 
  total_amount, 
  status
) VALUES 
  (
    'ORD-2024-001', 
    '9b0606c7-64b6-42c3-b2a2-7163c4404472', 
    '9b0606c7-64b6-42c3-b2a2-7163c4404472',
    'Test Customer', 
    '+1234567894', 
    '123 Main Street, Downtown, City 12345', 
    '[{"name": "Smartphone", "quantity": 1, "price": 599.99}, {"name": "Phone Case", "quantity": 1, "price": 25.99}]', 
    625.98, 
    'in_transit'
  ),
  (
    'ORD-2024-002', 
    '9b0606c7-64b6-42c3-b2a2-7163c4404472', 
    '9b0606c7-64b6-42c3-b2a2-7163c4404472',
    'Customer Mike Johnson', 
    '+1234567892', 
    '456 Oak Avenue, Suburb, City 67890', 
    '[{"name": "Laptop", "quantity": 1, "price": 1299.99}, {"name": "Mouse", "quantity": 1, "price": 29.99}]', 
    1329.98, 
    'in_transit'
  ),
  (
    'ORD-2024-003', 
    '9b0606c7-64b6-42c3-b2a2-7163c4404472', 
    '9b0606c7-64b6-42c3-b2a2-7163c4404472',
    'Customer Emma Davis', 
    '+1234567893', 
    '789 Pine Street, Uptown, City 11111', 
    '[{"name": "Tablet", "quantity": 1, "price": 399.99}, {"name": "Stylus", "quantity": 1, "price": 49.99}]', 
    449.98, 
    'assigned'
  );