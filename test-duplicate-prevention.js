// Test script for enhanced duplicate prevention mechanisms
// Tests both backend SAP API duplicate prevention and frontend browser-based prevention

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002/api';

// Test scenarios
const testCases = [
  {
    name: "Valid Event Code - E00004",
    eventCode: "E00004",
    visitorData: {
      vstrname: "John Test Duplicate",
      vstrnumb: "9876543210",
      vstrfrom: "Test Organization",
      geoloc: "Test Location",
      geolat: "22.5744",
      geolon: "88.3629"
    }
  },
  {
    name: "Duplicate Phone Number Test",
    eventCode: "E00004", 
    visitorData: {
      vstrname: "Jane Test Duplicate",
      vstrnumb: "9876543210", // Same phone number as above
      vstrfrom: "Another Organization", 
      geoloc: "Test Location 2",
      geolat: "22.5744",
      geolon: "88.3629"
    }
  }
];

async function verifyEventCode(eventCode) {
  console.log(`\n🔍 Testing Event Code: ${eventCode}`);
  
  try {
    const response = await fetch(`${API_BASE}/verify-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventcode: eventCode })
    });

    const result = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(result, null, 2)}`);
    
    return response.ok && result.data && result.data[0] && result.data[0].status === 'success';
  } catch (error) {
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function submitAttendance(eventCode, visitorData) {
  console.log(`\n📝 Submitting Attendance for ${visitorData.vstrname}`);
  console.log(`   Phone: ${visitorData.vstrnumb}`);
  
  try {
    const payload = { eventcode: eventCode, ...visitorData };
    const response = await fetch(`${API_BASE}/submit-attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(result, null, 2)}`);
    
    // Extract token from various possible response structures
    const token = result.tokenno || result.token || 
                 (result.data && Array.isArray(result.data) && result.data.length > 0 && 
                  (result.data[0].tokenno || result.data[0].token));
    
    if (token) {
      console.log(`   ✅ SUCCESS: Token generated - ${token}`);
      return { success: true, token: token, message: result.message };
    } else {
      console.log(`   ❌ FAILED: No token in response`);
      return { success: false, message: result.message || 'No token received' };
    }
  } catch (error) {
    console.error(`   ❌ ERROR: ${error.message}`);
    return { success: false, message: error.message };
  }
}

async function testDuplicatePrevention() {
  console.log('🧪 DUPLICATE PREVENTION TEST SUITE');
  console.log('=' .repeat(60));
  
  let results = [];
  
  for (const testCase of testCases) {
    console.log(`\n📋 Test Case: ${testCase.name}`);
    console.log('-'.repeat(40));
    
    // Step 1: Verify event code
    const isValidEvent = await verifyEventCode(testCase.eventCode);
    
    if (!isValidEvent) {
      console.log(`   ⚠️  Event code ${testCase.eventCode} is not valid/active, skipping submission test`);
      results.push({ 
        testCase: testCase.name, 
        eventValid: false, 
        submissionResult: 'skipped' 
      });
      continue;
    }
    
    // Step 2: Submit attendance
    const submissionResult = await submitAttendance(testCase.eventCode, testCase.visitorData);
    
    results.push({
      testCase: testCase.name,
      eventValid: true,
      submissionResult: submissionResult
    });
    
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.testCase}:`);
    console.log(`   Event Valid: ${result.eventValid ? '✅' : '❌'}`);
    
    if (result.submissionResult === 'skipped') {
      console.log(`   Submission: ⏭️  Skipped`);
    } else if (result.submissionResult.success) {
      console.log(`   Submission: ✅ Success - Token: ${result.submissionResult.token}`);
    } else {
      console.log(`   Submission: ❌ Failed - ${result.submissionResult.message}`);
      
      // Check if it's a duplicate phone number error from SAP
      if (result.submissionResult.message && 
          result.submissionResult.message.includes('Already Exist')) {
        console.log(`   🛡️  DUPLICATE DETECTED: SAP backend prevented duplicate phone number!`);
      }
    }
  });
  
  console.log('\n🎯 DUPLICATE PREVENTION ANALYSIS:');
  console.log('   - First submission should succeed and get a token');
  console.log('   - Second submission with same phone should be blocked by SAP');
  console.log('   - Frontend browser-based checking should also warn users');
  console.log('   - Session-based checking should prevent multiple submissions from same browser');
}

// Frontend Storage Test Simulation
function testFrontendStorage() {
  console.log('\n🖥️  FRONTEND STORAGE SIMULATION');
  console.log('=' .repeat(60));
  
  // Simulate the registration storage functions (would normally run in browser)
  const mockRegistrations = [
    {
      eventCode: "E00004",
      phoneNumber: "9876543210",
      name: "John Test Duplicate",
      timestamp: new Date().toISOString(),
      token: "T000000068",
      sessionId: "session_123456"
    }
  ];
  
  console.log('📱 Simulated Browser Storage:');
  console.log(JSON.stringify(mockRegistrations, null, 2));
  
  // Test duplicate checking logic
  const testPhone = "9876543210";
  const testEvent = "E00004";
  
  const duplicateCheck = mockRegistrations.find(reg => 
    reg.eventCode === testEvent && reg.phoneNumber === testPhone
  );
  
  if (duplicateCheck) {
    console.log(`\n🚨 Frontend Duplicate Detection:`);
    console.log(`   Phone ${testPhone} already registered for event ${testEvent}`);
    console.log(`   Previous token: ${duplicateCheck.token}`);
    console.log(`   Registration time: ${duplicateCheck.timestamp}`);
  }
  
  const sessionCheck = mockRegistrations.find(reg => 
    reg.eventCode === testEvent && reg.sessionId === "session_123456"
  );
  
  if (sessionCheck) {
    console.log(`\n🔒 Session Duplicate Detection:`);
    console.log(`   This browser session already registered for event ${testEvent}`);
    console.log(`   Token: ${sessionCheck.token}`);
  }
}

async function runAllTests() {
  try {
    // Test API-based duplicate prevention
    await testDuplicatePrevention();
    
    // Test frontend storage simulation
    testFrontendStorage();
    
    console.log('\n✅ All duplicate prevention tests completed!');
    console.log('\n📋 What to test manually in the browser:');
    console.log('   1. Open http://localhost:3002');
    console.log('   2. Enter event code E00004 and verify');
    console.log('   3. Fill form with phone number 9876543210');
    console.log('   4. Submit - should succeed');
    console.log('   5. Try same phone number again - should show warning');
    console.log('   6. Refresh page and try same event code - should show session warning');
    
  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

// Run the tests
if (require.main === module) {
  runAllTests();
}

module.exports = { testDuplicatePrevention, testFrontendStorage };
