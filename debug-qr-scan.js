// Test script to debug QR scan flow for agent AGT-002
console.log('🔍 Testing QR scan flow for agent AGT-002...');

// Simulate the QR data format that should be generated
const testOrderData = {
  orderId: "test-order-123",
  orderNumber: "ORD-12345",
  customerName: "Test Customer",
  items: [
    { name: "Product A", quantity: 2 },
    { name: "Product B", quantity: 1 }
  ],
  timestamp: new Date().toISOString(),
  agentId: "94e705fa-e5a2-44ae-9780-0acb961cdf60" // AGT-002 ID
};

const qrDataString = JSON.stringify(testOrderData);

console.log('📋 Generated QR Data:');
console.log(qrDataString);

console.log('\n🔍 Parsing QR Data back:');
try {
  const parsed = JSON.parse(qrDataString);
  console.log('✅ Successfully parsed:', parsed);
  
  // Check required fields
  const requiredFields = ['orderId', 'orderNumber', 'customerName', 'items', 'timestamp', 'agentId'];
  const missingFields = requiredFields.filter(field => !parsed[field]);
  
  if (missingFields.length > 0) {
    console.error('❌ Missing required fields:', missingFields);
  } else {
    console.log('✅ All required fields present');
  }
} catch (error) {
  console.error('❌ Failed to parse QR data:', error);
}

console.log('\n🔍 Testing Supabase URL call...');
const SUPABASE_URL = 'https://apninbhrxrprrbcqgdeo.supabase.co/functions/v1/generate-otp';
console.log('Target URL:', SUPABASE_URL);

console.log('\n✅ Test completed. Use this QR data for testing:');
console.log(qrDataString);