// Test script to verify frontend location capture and API integration
const API_BASE = 'http://localhost:3000/api';

// Simulate geolocation API response
const mockLocationData = {
  coords: {
    latitude: 12.9716,
    longitude: 77.5946,
    accuracy: 10
  }
};

async function testFrontendLocationFlow() {
  console.log('🧪 Testing Frontend Location Capture Flow');
  console.log('=' .repeat(50));

  // Step 1: Simulate getting user location (like frontend does)
  console.log('\n📍 Simulating geolocation capture...');
  const userLocation = {
    latitude: mockLocationData.coords.latitude,
    longitude: mockLocationData.coords.longitude
  };
  console.log(`   Captured Location: ${userLocation.latitude}, ${userLocation.longitude}`);

  // Step 2: Simulate fetching location name (like frontend does)
  console.log('\n🌍 Fetching location name from coordinates...');
  let locationName = 'Unknown Location';
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.latitude}&lon=${userLocation.longitude}`;
    console.log(`   Nominatim URL: ${nominatimUrl}`);
    
    const response = await fetch(nominatimUrl);
    if (response.ok) {
      const locationData = await response.json();
      locationName = locationData.display_name || 'Unknown Location';
      console.log(`   ✅ Location Name: ${locationName}`);
    } else {
      console.log(`   ❌ Failed to fetch location name (Status: ${response.status})`);
    }
  } catch (error) {
    console.log(`   ❌ Error fetching location name: ${error.message}`);
  }

  // Step 3: Verify event code (like frontend does)
  console.log('\n🔍 Verifying event code...');
  const verifyResponse = await fetch(`${API_BASE}/verify-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventcode: 'E00004' })
  });
  
  const verifyResult = await verifyResponse.json();
  console.log(`   Status: ${verifyResponse.status}`);
  
  if (!verifyResponse.ok || !verifyResult.data || verifyResult.data[0].status !== 'success') {
    console.log('❌ Event verification failed');
    return;
  }
  console.log('   ✅ Event code verified successfully');

  // Step 4: Submit attendance with real location data (like frontend does)
  console.log('\n📝 Submitting attendance with captured location...');
  const attendancePayload = {
    eventcode: 'E00004',
    vstrname: 'Frontend Test User',
    vstrnumb: `9${Math.floor(Math.random() * 1000000000)}`, // Random phone
    vstrfrom: 'Frontend Test Organization',
    geoloc: locationName,
    geolat: userLocation.latitude.toString(),
    geolon: userLocation.longitude.toString()
  };

  console.log('\n📋 Frontend-style payload:');
  console.log(JSON.stringify(attendancePayload, null, 2));

  const submitResponse = await fetch(`${API_BASE}/submit-attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(attendancePayload)
  });
  
  const submitResult = await submitResponse.json();
  console.log(`\n📤 API Response:`);
  console.log(`   Status: ${submitResponse.status}`);
  console.log(`   Success: ${submitResponse.ok ? '✅' : '❌'}`);
  
  if (submitResult.data && submitResult.data[0]) {
    const responseData = submitResult.data[0];
    console.log(`   Token: ${responseData.token || 'NO TOKEN'}`);
    console.log(`   Message: ${responseData.message || 'NO MESSAGE'}`);
    
    // Verify location data round-trip
    console.log('\n🗺️  Location Data Verification:');
    console.log(`   Original Address: ${locationName}`);
    console.log(`   Returned Address: ${responseData.geoloc || 'NOT RETURNED'}`);
    console.log(`   Original Latitude: ${userLocation.latitude}`);
    console.log(`   Returned Latitude: ${responseData.geolat || 'NOT RETURNED'}`);
    console.log(`   Original Longitude: ${userLocation.longitude}`);
    console.log(`   Returned Longitude: ${responseData.geolon || 'NOT RETURNED'}`);
    
    const locationMatch = (
      responseData.geoloc === locationName &&
      responseData.geolat == userLocation.latitude.toString() &&
      responseData.geolon == userLocation.longitude.toString()
    );
    
    console.log(`\n${locationMatch ? '✅' : '❌'} Location data integrity: ${locationMatch ? 'PASSED' : 'FAILED'}`);
    
    if (responseData.token) {
      console.log('\n🎉 Frontend location flow test SUCCESSFUL!');
      console.log(`   Token generated: ${responseData.token}`);
    } else {
      console.log('\n❌ Frontend location flow test FAILED - No token generated');
    }
  } else {
    console.log('\n❌ Invalid API response structure');
  }
}

// Test different location scenarios
async function testLocationScenarios() {
  console.log('\n\n🌍 Testing Different Location Scenarios');
  console.log('=' .repeat(50));

  const scenarios = [
    {
      name: 'Mumbai, India',
      lat: 19.0760,
      lon: 72.8777
    },
    {
      name: 'Delhi, India',
      lat: 28.6139,
      lon: 77.2090
    },
    {
      name: 'Kolkata, India', 
      lat: 22.5726,
      lon: 88.3639
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\n📍 Testing location: ${scenario.name}`);
    
    // Get location name
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${scenario.lat}&lon=${scenario.lon}`
      );
      
      if (response.ok) {
        const locationData = await response.json();
        console.log(`   Address: ${locationData.display_name || 'Unknown'}`);
        console.log(`   Coordinates: ${scenario.lat}, ${scenario.lon}`);
        console.log(`   ✅ Location resolution successful`);
      } else {
        console.log(`   ❌ Failed to resolve location`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Add fetch polyfill for Node.js if needed
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

async function runAllTests() {
  await testFrontendLocationFlow();
  await testLocationScenarios();
  
  console.log('\n\n🏁 All location tests completed!');
}

runAllTests().catch(console.error);
