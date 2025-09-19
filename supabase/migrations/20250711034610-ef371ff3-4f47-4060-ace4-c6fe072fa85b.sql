-- Create sample agent profiles
INSERT INTO public.profiles (user_id, full_name, role, phone, agent_id) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Agent John Smith', 'agent', '+1234567890', 'AGT-001'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Agent Sarah Wilson', 'agent', '+1234567891', 'AGT-002');

-- Create sample customer profiles  
INSERT INTO public.profiles (user_id, full_name, role, phone) VALUES 
  ('550e8400-e29b-41d4-a716-446655440003', 'Customer Mike Johnson', 'customer', '+1234567892'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Customer Emma Davis', 'customer', '+1234567893');

-- Create sample orders for testing
INSERT INTO public.orders (
  id,
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
    '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    'ORD-2024-001', 
    '9b0606c7-64b6-42c3-b2a2-7163c4404472', 
    '550e8400-e29b-41d4-a716-446655440001',
    'Jatin Yadav', 
    '+1234567894', 
    '123 Main Street, Downtown, City 12345', 
    '[{"name": "Smartphone", "quantity": 1, "price": 599.99}, {"name": "Phone Case", "quantity": 1, "price": 25.99}]', 
    625.98, 
    'in_transit'
  ),
  (
    '2b3c4d5e-6f78-90ab-cdef-123456789012',
    'ORD-2024-002', 
    '550e8400-e29b-41d4-a716-446655440003', 
    '550e8400-e29b-41d4-a716-446655440001',
    'Mike Johnson', 
    '+1234567892', 
    '456 Oak Avenue, Suburb, City 67890', 
    '[{"name": "Laptop", "quantity": 1, "price": 1299.99}, {"name": "Mouse", "quantity": 1, "price": 29.99}]', 
    1329.98, 
    'in_transit'
  ),
  (
    '3c4d5e6f-7890-abcd-ef12-34567890abcd',
    'ORD-2024-003', 
    '550e8400-e29b-41d4-a716-446655440004', 
    '550e8400-e29b-41d4-a716-446655440002',
    'Emma Davis', 
    '+1234567893', 
    '789 Pine Street, Uptown, City 11111', 
    '[{"name": "Tablet", "quantity": 1, "price": 399.99}, {"name": "Stylus", "quantity": 1, "price": 49.99}]', 
    449.98, 
    'assigned'
  ),
  (
    '4d5e6f78-90ab-cdef-1234-567890abcdef',
    'ORD-2024-004', 
    '9b0606c7-64b6-42c3-b2a2-7163c4404472', 
    '550e8400-e29b-41d4-a716-446655440002',
    'Jatin Yadav', 
    '+1234567894', 
    '321 Elm Drive, Eastside, City 22222', 
    '[{"name": "Headphones", "quantity": 1, "price": 199.99}, {"name": "Cable", "quantity": 1, "price": 15.99}]', 
    215.98, 
    'pending'
  );