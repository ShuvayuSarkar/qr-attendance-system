// Test with actual valid event codes
const API_BASE = 'http://localhost:3001/api';

async function testEventCode(eventCode, description) {
  console.log(`\n🔍 Testing ${description}: "${eventCode}"`);
  
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
      console.log('✅ VALID AND ACTIVE EVENT CODE!');
    } else if (data.data && data.data[0]) {
      console.log(`❌ Event Status: ${data.data[0].status} - ${data.data[0].message}`);
    }
    
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error('Error testing event code:', error.message);
    return { success: false, error: error.message };
  }
}

async function testAttendanceSubmission(eventCode, description) {
  console.log(`\n📝 Testing attendance submission for ${description}: "${eventCode}"`);
  
  const attendanceData = {
    eventcode: eventCode,
    vstrname: "Jane Smith",
    vstrnumb: "9123456789", // Different number to avoid duplicates
    vstrfrom: "Tech Solutions Ltd",
    geoloc: "Conference Center, Mumbai, Maharashtra, India",
    geolat: 19.0760,
    geolon: 72.8777
  };
  
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
    
    if (data.data && data.data[0] && data.data[0].status === 'success') {
      console.log(`✅ ATTENDANCE SUBMITTED! Token: ${data.data[0].token}`);
    } else if (data.data && data.data[0]) {
      console.log(`❌ Submission Status: ${data.data[0].status} - ${data.data[0].message}`);
    }
    
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error('Error testing attendance submission:', error.message);
    return { success: false, error: error.message };
  }
}

async function runRealEventTests() {
  console.log('🚀 Testing with REAL event codes from SAP system...\n');
  
  // Test all the event codes you provided
  const eventTests = [
    { code: 'E00004', description: 'Valid and Active Event' },
    { code: 'E00003', description: 'Valid but Past Event' },
    { code: 'E00005', description: 'Valid but Future Event' },
    { code: 'E00006', description: 'Invalid Event Code' },
  ];
  
  console.log('=== EVENT CODE VALIDATION TESTS ===');
  for (const test of eventTests) {
    await testEventCode(test.code, test.description);
  }
  
  console.log('\n=== ATTENDANCE SUBMISSION TESTS ===');
  // Test attendance submission for each event
  for (const test of eventTests) {
    await testAttendanceSubmission(test.code, test.description);
  }
  
  console.log('\n✅ Real event code testing completed!');
  console.log('\n📊 Expected Results Summary:');
  console.log('- E00004: Should allow validation AND submission (active event)');
  console.log('- E00003: Should fail validation (past event)');
  console.log('- E00005: Should fail validation (future event)'); 
  console.log('- E00006: Should fail validation (invalid code)');
}

// Add fetch polyfill for Node.js if needed
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

runRealEventTests().catch(console.error);
