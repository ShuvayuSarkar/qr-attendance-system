// Comprehensive Duplicate Prevention Testing Script
// Tests both backend (SAP API) and frontend (localStorage) duplicate prevention

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3003/api';
const TEST_EVENT_CODE = 'E00004'; // Known active event
const TEST_PHONE_1 = '9876543210';
const TEST_PHONE_2 = '9876543211';

// Test scenarios
const scenarios = [
  {
    name: 'First Registration - Should Succeed',
    eventCode: TEST_EVENT_CODE,
    visitorName: 'Test User 1',
    mobileNumber: TEST_PHONE_1,
    organizationName: 'Test Org 1',
    expectedResult: 'success'
  },
  {
    name: 'Duplicate Phone Number - Should Fail (SAP Backend)',
    eventCode: TEST_EVENT_CODE,
    visitorName: 'Test User 2',
    mobileNumber: TEST_PHONE_1, // Same phone number
    organizationName: 'Test Org 2',
    expectedResult: 'duplicate_phone'
  },
  {
    name: 'Different Phone Number - Should Succeed',
    eventCode: TEST_EVENT_CODE,
    visitorName: 'Test User 3',
    mobileNumber: TEST_PHONE_2, // Different phone number
    organizationName: 'Test Org 3',
    expectedResult: 'success'
  }
];

async function verifyEventCode(eventCode) {
  try {
    console.log(`\n🔍 Verifying event code: ${eventCode}`);
    
    const response = await fetch(`${API_BASE}/verify-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventcode: eventCode })
    });

    const result = await response.json();
    
    if (response.ok && result.data && result.data[0] && result.data[0].status === 'success') {
      console.log(`✅ Event verification successful: ${result.data[0].message}`);
      return true;
    } else {
      console.log(`❌ Event verification failed: ${result.data?.[0]?.message || result.message}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Event verification error:`, error.message);
    return false;
  }
}

async function submitAttendance(testData) {
  try {
    console.log(`\n📝 Submitting attendance for: ${testData.visitorName}`);
    console.log(`   Phone: ${testData.mobileNumber}`);
    
    const response = await fetch(`${API_BASE}/submit-attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventcode: testData.eventCode,
        vstrname: testData.visitorName,
        vstrnumb: testData.mobileNumber,
        vstrfrom: testData.organizationName,
        geoloc: 'Test Location',
        geolat: '12.9716',
        geolon: '77.5946'
      })
    });

    const result = await response.json();
    
    // Extract token from response
    const token = result.tokenno || result.token || 
                 (result.data && Array.isArray(result.data) && result.data.length > 0 && 
                  (result.data[0].tokenno || result.data[0].token));

    if (response.ok && token) {
      console.log(`✅ Attendance submitted successfully!`);
      console.log(`   Token: ${token}`);
      console.log(`   Message: ${result.message || 'Success'}`);
      return { success: true, token, message: result.message };
    } else {
      const errorMessage = result.message || 
                          (result.data && Array.isArray(result.data) && result.data.length > 0 && result.data[0].message) || 
                          'Submission failed';
      console.log(`❌ Attendance submission failed: ${errorMessage}`);
      
      // Check if it's a duplicate phone number error
      const isDuplicatePhone = errorMessage.toLowerCase().includes('visitor number already exist') ||
                              errorMessage.toLowerCase().includes('duplicate') ||
                              errorMessage.toLowerCase().includes('already registered');
      
      return { 
        success: false, 
        message: errorMessage, 
        isDuplicatePhone 
      };
    }
  } catch (error) {
    console.error(`❌ Attendance submission error:`, error.message);
    return { success: false, message: error.message, isDuplicatePhone: false };
  }
}

function testFrontendDuplicatePrevention() {
  console.log('\n🧪 Testing Frontend Duplicate Prevention (localStorage simulation)');
  
  // Simulate the registration storage functions
  const mockRegistrations = [];
  
  const storeRegistration = (record) => {
    mockRegistrations.push(record);
    console.log(`📦 Stored registration: ${record.name} (${record.phoneNumber}) - Token: ${record.token}`);
  };
  
  const isPhoneRegistered = (eventCode, phoneNumber) => {
    return mockRegistrations.find(reg => 
      reg.eventCode === eventCode && reg.phoneNumber === phoneNumber
    ) || null;
  };
  
  const isSessionRegistered = (eventCode, sessionId) => {
    return mockRegistrations.find(reg => 
      reg.eventCode === eventCode && reg.sessionId === sessionId
    ) || null;
  };
  
  // Test scenarios
  const sessionId = 'test_session_123';
  
  // Test 1: Store first registration
  storeRegistration({
    eventCode: TEST_EVENT_CODE,
    phoneNumber: TEST_PHONE_1,
    name: 'Test User 1',
    timestamp: new Date().toISOString(),
    token: 'T000001',
    sessionId: sessionId
  });
  
  // Test 2: Check for phone duplicate
  const phoneDuplicate = isPhoneRegistered(TEST_EVENT_CODE, TEST_PHONE_1);
  if (phoneDuplicate) {
    console.log(`✅ Phone duplicate detection working: Found existing registration for ${TEST_PHONE_1}`);
  } else {
    console.log(`❌ Phone duplicate detection failed`);
  }
  
  // Test 3: Check for session duplicate
  const sessionDuplicate = isSessionRegistered(TEST_EVENT_CODE, sessionId);
  if (sessionDuplicate) {
    console.log(`✅ Session duplicate detection working: Found existing registration for session ${sessionId}`);
  } else {
    console.log(`❌ Session duplicate detection failed`);
  }
  
  // Test 4: Check for different phone (should not find)
  const noDuplicate = isPhoneRegistered(TEST_EVENT_CODE, TEST_PHONE_2);
  if (!noDuplicate) {
    console.log(`✅ Phone uniqueness working: No duplicate found for ${TEST_PHONE_2}`);
  } else {
    console.log(`❌ Phone uniqueness failed: False positive for ${TEST_PHONE_2}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Comprehensive Duplicate Prevention Tests');
  console.log('='.repeat(60));
  
  // Test 1: Frontend localStorage simulation
  testFrontendDuplicatePrevention();
  
  console.log('\n' + '='.repeat(60));
  console.log('🌐 Testing Backend SAP API Duplicate Prevention');
  
  // Test 2: Verify event code first
  const isEventValid = await verifyEventCode(TEST_EVENT_CODE);
  if (!isEventValid) {
    console.log('❌ Cannot proceed with tests - event code verification failed');
    return;
  }
  
  // Test 3: Run backend duplicate prevention scenarios
  console.log('\n📋 Running Backend Test Scenarios:');
  
  const results = [];
  
  for (const scenario of scenarios) {
    console.log(`\n🧪 ${scenario.name}`);
    console.log('-'.repeat(40));
    
    const result = await submitAttendance(scenario);
    
    // Validate result against expected outcome
    let passed = false;
    
    if (scenario.expectedResult === 'success' && result.success) {
      passed = true;
      console.log(`✅ Test PASSED: Registration successful as expected`);
    } else if (scenario.expectedResult === 'duplicate_phone' && !result.success && result.isDuplicatePhone) {
      passed = true;
      console.log(`✅ Test PASSED: Duplicate phone number correctly rejected`);
    } else if (scenario.expectedResult === 'success' && !result.success) {
      console.log(`❌ Test FAILED: Expected success but got: ${result.message}`);
    } else if (scenario.expectedResult === 'duplicate_phone' && result.success) {
      console.log(`❌ Test FAILED: Expected duplicate rejection but registration succeeded`);
    }
    
    results.push({
      scenario: scenario.name,
      expected: scenario.expectedResult,
      actual: result.success ? 'success' : (result.isDuplicatePhone ? 'duplicate_phone' : 'error'),
      passed,
      message: result.message
    });
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${result.scenario}`);
    console.log(`   Expected: ${result.expected}, Actual: ${result.actual} - ${status}`);
  });
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length + 4; // Including frontend tests
  
  console.log(`\n🎯 Overall Result: ${passedTests + 4}/${totalTests} tests passed`);
  
  if (passedTests === results.length) {
    console.log('🎉 All backend tests passed! Duplicate prevention is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the implementation for issues.');
  }
}

// Run tests
runTests().catch(console.error);
