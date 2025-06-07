// Test script for API endpoints
const API_BASE = 'http://localhost:3001/api';

async function testVerifyEvent(eventCode) {
  console.log(`\n🔍 Testing verify-event with code: ${eventCode}`);
  
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
    
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error('Error testing verify-event:', error.message);
    return { success: false, error: error.message };
  }
}

async function testSubmitAttendance(attendanceData) {
  console.log(`\n📝 Testing submit-attendance`);
  
  try {
    const response = await fetch(`${API_BASE}/submit-attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attendanceData),
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error('Error testing submit-attendance:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  
  // Test 1: Try to verify with an invalid event code
  await testVerifyEvent('INVALID_CODE');
  
  // Test 2: Try to verify with a potentially valid event code format
  await testVerifyEvent('TEST123');
  
  // Test 3: Try to submit attendance with sample data
  const sampleAttendance = {
    eventcode: 'TEST123',
    vstrname: 'John Doe',
    vstrnumb: '1234567890',
    vstrfrom: 'Test Organization',
    geoloc: 'Test Location',
    geolat: 12.3456,
    geolon: 78.9101
  };
  
  await testSubmitAttendance(sampleAttendance);
  
  console.log('\n✅ API Tests Completed');
}

// Add fetch polyfill for Node.js if needed
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

runTests().catch(console.error);
