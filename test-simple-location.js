// Simple test to verify location data handling
const API_BASE = 'http://localhost:3000/api';

async function testLocationDataHandling() {
  console.log('🧪 Testing Location Data API Handling');
  console.log('='.repeat(50));

  try {
    // Test 1: Basic location data submission
    console.log('\n📝 Test 1: Basic location data submission');
    const testData = {
      eventcode: 'E00004',
      vstrname: 'Location API Test',
      vstrnumb: `9${Math.floor(Math.random() * 1000000000)}`,
      vstrfrom: 'Test Organization',
      geoloc: 'Test Location: Bangalore, Karnataka, India',
      geolat: '12.9716',
      geolon: '77.5946'
    };

    console.log('Payload:', JSON.stringify(testData, null, 2));

    const response = await fetch(`${API_BASE}/submit-attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    // Check if location data is preserved
    if (result.data && result.data[0]) {
      const data = result.data[0];
      console.log('\n🔍 Location Data Check:');
      console.log(`✓ geoloc: ${data.geoloc || 'MISSING'}`);
      console.log(`✓ geolat: ${data.geolat || 'MISSING'}`);
      console.log(`✓ geolon: ${data.geolon || 'MISSING'}`);
      console.log(`✓ token: ${data.token || 'MISSING'}`);

      const hasAllLocationData = data.geoloc && data.geolat && data.geolon;
      console.log(`\n${hasAllLocationData ? '✅' : '❌'} Location data integrity: ${hasAllLocationData ? 'PASSED' : 'FAILED'}`);
    }

    // Test 2: Check different coordinate formats
    console.log('\n📝 Test 2: Different coordinate formats');
    const floatData = {
      eventcode: 'E00004',
      vstrname: 'Float Coords Test',
      vstrnumb: `9${Math.floor(Math.random() * 1000000000)}`,
      vstrfrom: 'Test Organization',
      geoloc: 'Mumbai, Maharashtra, India',
      geolat: 19.0760,  // Number instead of string
      geolon: 72.8777   // Number instead of string
    };

    const response2 = await fetch(`${API_BASE}/submit-attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(floatData)
    });

    const result2 = await response2.json();
    console.log('Float coordinates response:', response2.status);

    if (result2.data && result2.data[0]) {
      const data = result2.data[0];
      console.log('Float coords preserved:', data.geolat, data.geolon);
    }

    console.log('\n✅ Location data API tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Add fetch polyfill for Node.js if needed
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testLocationDataHandling();
