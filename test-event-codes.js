// Test different event code patterns to find valid ones
const API_BASE = 'http://localhost:3001/api';

async function testEventCode(eventCode) {
  console.log(`\n🔍 Testing event code: "${eventCode}"`);
  
  try {
    const response = await fetch(`${API_BASE}/verify-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventcode: eventCode }),
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.data && data.data[0] && data.data[0].status === 'success') {
      console.log('🎉 FOUND VALID EVENT CODE!');
    }
    
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error('Error testing event code:', error.message);
    return { success: false, error: error.message };
  }
}

async function runEventCodeTests() {
  console.log('🚀 Testing various event code patterns...\n');
  
  // Test common patterns
  const eventCodes = [
    // Common date-based patterns
    '2024',
    '2025',
    'EVENT2024',
    'EVENT2025',
    'CONF2024',
    'CONF2025',
    'MEET2024',
    'MEET2025',
    
    // Common word patterns
    'DEMO',
    'TEST',
    'SAMPLE',
    'DEFAULT',
    'MAIN',
    'GENERAL',
    'WORKSHOP',
    'SEMINAR',
    'CONFERENCE',
    
    // Common number patterns
    '001',
    '100',
    '123',
    '1000',
    'E001',
    'E100',
    'EV001',
    'EV100',
    
    // Mixed patterns
    'E2024',
    'C2024',
    'W2024',
    'EV01',
    'EV02',
    'EV03',
    'DEMO01',
    'TEST01',
    
    // Short codes
    'A',
    'B',
    'C',
    'D',
    'E',
    '1',
    '2',
    '3',
    
    // Today's date patterns
    '20250607',
    '060725',
    '07062025',
    
    // Common business patterns
    'ADMIN',
    'USER',
    'GUEST',
    'PUBLIC',
    'OPEN'
  ];
  
  for (const code of eventCodes) {
    await testEventCode(code);
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n✅ Event code pattern testing completed');
}

// Add fetch polyfill for Node.js if needed
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

runEventCodeTests().catch(console.error);
