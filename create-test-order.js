// Create a test order and generate proper QR code for testing
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://apninbhrxrprrbcqgdeo.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbmluYmhyeHJwcnJiY3FnZGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNjQxMTksImV4cCI6MjA2Nzc0MDExOX0.jLtXQobNMoHpVE8NA7YI5xirX9QZFANn5IEXhHEQpAw'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function createTestOrder() {
  console.log('🔍 Creating test order for QR code testing...')
  
  // Test order data
  const testOrder = {
    order_number: `TEST-${Date.now()}`,
    customer_name: 'Jatin Agent',
    customer_phone: '+919781098370',
    customer_id: '2c09cd28-03ee-4567-b51d-cd783cbc1718', // Jatin's user_id
    agent_id: '94e705fa-e5a2-44ae-9780-0acb961cdf60', // AGT-002 internal ID
    delivery_address: 'Test Address, City',
    items: [
      { name: 'Test Product A', quantity: 2, price: 100 },
      { name: 'Test Product B', quantity: 1, price: 50 }
    ],
    total_amount: 250,
    status: 'assigned',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  console.log('📦 Test order data:', testOrder)
  
  // Insert the test order
  const { data: order, error } = await supabase
    .from('orders')
    .insert(testOrder)
    .select()
    .single()
  
  if (error) {
    console.error('❌ Failed to create test order:', error)
    return null
  }
  
  console.log('✅ Test order created:', order)
  
  // Generate QR code data for this order
  const qrData = JSON.stringify({
    orderId: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    items: order.items,
    timestamp: new Date().toISOString(),
    agentId: order.agent_id
  })
  
  console.log('📱 QR Code Data for testing:')
  console.log(qrData)
  
  return { order, qrData }
}

async function testQRScan(qrData) {
  console.log('🔍 Testing QR scan with real order data...')
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ qrData })
    })
    
    console.log('📊 Response status:', response.status)
    const responseText = await response.text()
    console.log('📄 Response:', responseText)
    
    if (response.ok) {
      console.log('✅ QR scan successful!')
      const result = JSON.parse(responseText)
      console.log('📱 OTP result:', result)
    } else {
      console.log('❌ QR scan failed')
      try {
        const error = JSON.parse(responseText)
        console.log('📋 Error details:', error)
      } catch (e) {
        console.log('📄 Raw error:', responseText)
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error)
  }
}

// Main test function
async function runTest() {
  const result = await createTestOrder()
  if (result) {
    await testQRScan(result.qrData)
  }
}

// Check if we're in a module environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createTestOrder, testQRScan }
} else {
  runTest()
}