-- Check orders for agent AGT-002 (Jaspreet)
-- Agent internal ID: 94e705fa-e5a2-44ae-9780-0acb961cdf60

-- Check all orders
SELECT 
  id,
  order_number,
  customer_name,
  customer_phone,
  status,
  agent_id,
  created_at
FROM orders 
WHERE agent_id = '94e705fa-e5a2-44ae-9780-0acb961cdf60'
   OR agent_id = 'AGT-002'
ORDER BY created_at DESC;

-- Also check if there are any orders for customer phone +919781098370
SELECT 
  id,
  order_number,
  customer_name,
  customer_phone,
  status,
  agent_id,
  created_at
FROM orders 
WHERE customer_phone = '+919781098370'
ORDER BY created_at DESC;