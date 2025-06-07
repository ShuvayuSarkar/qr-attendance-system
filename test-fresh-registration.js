// Test with a fresh phone number that hasn't been used
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3003/api';
const TEST_EVENT_CODE = 'E00004';
const FRESH_PHONE = `98765${Date.now().toString().slice(-5)}`; // Generate unique phone

async function testFreshRegistration() {
  console.log('🧪 Testing Fresh Registration');
  console.log('=' .repeat(50));
  
  console.log(`\n📱 Using fresh phone number: ${FRESH_PHONE}`);
  
  // Step 1: Verify event code
  console.log('\n🔍 Verifying event code...');
  const verifyResponse = await fetch(`${API_BASE}/verify-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventcode: TEST_EVENT_CODE })
  });
  
  const verifyResult = await verifyResponse.json();
  console.log(`   Status: ${verifyResponse.status}`);
  console.log(`   Response: ${JSON.stringify(verifyResult, null, 2)}`);
  
  if (!verifyResponse.ok || !verifyResult.data || verifyResult.data[0].status !== 'success') {
    console.log('❌ Event verification failed');
    return;
  }
  
  // Step 2: Submit attendance with fresh phone
  console.log('\n📝 Submitting attendance with fresh phone...');
  const submitResponse = await fetch(`${API_BASE}/submit-attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventcode: TEST_EVENT_CODE,
      vstrname: 'Fresh Test User',
      vstrnumb: FRESH_PHONE,
      vstrfrom: 'Test Organization',
      geoloc: 'Test Location',
      geolat: '22.5744',
      geolon: '88.3629'
    })
  });
  
  const submitResult = await submitResponse.json();
  console.log(`   Status: ${submitResponse.status}`);
  console.log(`   Response: ${JSON.stringify(submitResult, null, 2)}`);
  
  const token = submitResult.tokenno || submitResult.token || 
               (submitResult.data && Array.isArray(submitResult.data) && submitResult.data.length > 0 && 
                (submitResult.data[0].tokenno || submitResult.data[0].token));
  
  if (token) {
    console.log(`✅ SUCCESS: Registration completed with token ${token}`);
    
    // Step 3: Test duplicate with same phone
    console.log('\n🔄 Testing duplicate registration with same phone...');
    const duplicateResponse = await fetch(`${API_BASE}/submit-attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventcode: TEST_EVENT_CODE,
        vstrname: 'Duplicate Test User',
        vstrnumb: FRESH_PHONE, // Same phone number
        vstrfrom: 'Another Organization',
        geoloc: 'Different Location',
        geolat: '22.5744',
        geolon: '88.3629'
      })
    });
    
    const duplicateResult = await duplicateResponse.json();
    console.log(`   Status: ${duplicateResponse.status}`);
    console.log(`   Response: ${JSON.stringify(duplicateResult, null, 2)}`);
    
    if (duplicateResult.data && duplicateResult.data[0] && 
        duplicateResult.data[0].message === 'Visitor Number Already Exist For Event') {
      console.log('✅ DUPLICATE PREVENTION WORKING: SAP correctly blocked duplicate phone number');
    } else {
      console.log('❌ DUPLICATE PREVENTION FAILED: Should have blocked duplicate phone');
    }
  } else {
    console.log('❌ FAILED: No token received for fresh registration');
  }
}

testFreshRegistration().catch(console.error);
