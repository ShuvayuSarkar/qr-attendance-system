// Test script to verify location data is being sent correctly
const API_BASE = 'http://localhost:3000/api';

async function testLocationData() {
  console.log('🧪 Testing Location Data in Attendance Submission');
  console.log('=' .repeat(50));

  // Step 1: Verify event code
  console.log('\n🔍 Verifying event code...');
  const verifyResponse = await fetch(`${API_BASE}/verify-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventcode: 'E00004' })
  });
  
  const verifyResult = await verifyResponse.json();
  console.log(`   Status: ${verifyResponse.status}`);
  console.log(`   Response: ${JSON.stringify(verifyResult, null, 2)}`);
  
  if (!verifyResponse.ok || !verifyResult.data || verifyResult.data[0].status !== 'success') {
    console.log('❌ Event verification failed');
    return;
  }

  // Step 2: Submit attendance with location data
  console.log('\n📝 Submitting attendance with location data...');
  const attendanceData = {
    eventcode: 'E00004',
    vstrname: 'Location Test User',
    vstrnumb: `9${Math.floor(Math.random() * 1000000000)}`, // Random phone
    vstrfrom: 'Test Organization',
    geoloc: 'Test Address: 123 Main Street, Test City, Test State, Test Country',
    geolat: '12.9716', // Bangalore coordinates
    geolon: '77.5946'
  };

  console.log('\n📋 Payload being sent:');
  console.log(JSON.stringify(attendanceData, null, 2));

  const submitResponse = await fetch(`${API_BASE}/submit-attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(attendanceData)
  });
  
  const submitResult = await submitResponse.json();
  console.log(`\n📤 API Response:`);
  console.log(`   Status: ${submitResponse.status}`);
  console.log(`   Response: ${JSON.stringify(submitResult, null, 2)}`);
  
  // Check if location data is included in response
  if (submitResult.data && submitResult.data[0]) {
    const responseData = submitResult.data[0];
    console.log('\n🗺️  Location Data in Response:');
    console.log(`   Address (geoloc): ${responseData.geoloc || 'NOT FOUND'}`);
    console.log(`   Latitude (geolat): ${responseData.geolat || 'NOT FOUND'}`);
    console.log(`   Longitude (geolon): ${responseData.geolon || 'NOT FOUND'}`);
    
    if (responseData.geoloc && responseData.geolat && responseData.geolon) {
      console.log('\n✅ Location data successfully included in response!');
    } else {
      console.log('\n❌ Location data missing from response!');
    }
  }
}

// Add fetch polyfill for Node.js if needed
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testLocationData().catch(console.error);
