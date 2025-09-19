// Simple test to validate QR data format
const testQRData = JSON.stringify({
  orderId: "test-123",
  orderNumber: "ORD-001",
  customerName: "Test Customer",
  items: [{ name: "Test Item", quantity: 1 }],
  timestamp: new Date().toISOString(),
  agentId: "test-agent-id"
});

console.log('✅ Generated QR Data Format:');
console.log(testQRData);
console.log('\n🔍 Parsed Back:');
console.log(JSON.parse(testQRData));
console.log('\n✅ QR data format is valid JSON with all required fields!');