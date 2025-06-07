// Frontend Registration Storage Testing Script
// Tests the localStorage-based duplicate prevention utilities

// Mock localStorage for Node.js testing
class MockStorage {
  constructor() {
    this.store = {};
  }
  
  getItem(key) {
    return this.store[key] || null;
  }
  
  setItem(key, value) {
    this.store[key] = value;
  }
  
  removeItem(key) {
    delete this.store[key];
  }
  
  clear() {
    this.store = {};
  }
}

// Mock sessionStorage
const mockSessionStorage = new MockStorage();
const mockLocalStorage = new MockStorage();

// Mock browser globals
global.sessionStorage = mockSessionStorage;
global.localStorage = mockLocalStorage;

// Now import the registration storage utilities
// Note: This would normally be imported, but for testing we'll inline the functions

const STORAGE_KEY = 'qr_attendance_registrations';
const SESSION_KEY = 'qr_attendance_session';

// Generate a unique session ID for this browser session
function getSessionId() {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

// Get all registrations from localStorage
function getStoredRegistrations() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading stored registrations:', error);
    return [];
  }
}

// Store a new registration
function storeRegistration(registration) {
  try {
    const existing = getStoredRegistrations();
    existing.push(registration);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Error storing registration:', error);
  }
}

// Check if a phone number is already registered for an event in this browser
function isPhoneRegistered(eventCode, phoneNumber) {
  const registrations = getStoredRegistrations();
  return registrations.find(reg => 
    reg.eventCode === eventCode && 
    reg.phoneNumber === phoneNumber
  ) || null;
}

// Check if this browser session has already registered for an event
function isSessionRegistered(eventCode) {
  const sessionId = getSessionId();
  const registrations = getStoredRegistrations();
  return registrations.find(reg => 
    reg.eventCode === eventCode && 
    reg.sessionId === sessionId
  ) || null;
}

// Clear old registrations (older than 30 days)
function cleanupOldRegistrations() {
  try {
    const registrations = getStoredRegistrations();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const filtered = registrations.filter(reg => {
      const regTime = new Date(reg.timestamp).getTime();
      return regTime > thirtyDaysAgo;
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error cleaning up registrations:', error);
  }
}

// Get registration statistics for debugging
function getRegistrationStats() {
  const registrations = getStoredRegistrations();
  const sessionId = getSessionId();
  
  return {
    totalRegistrations: registrations.length,
    uniqueEvents: new Set(registrations.map(r => r.eventCode)).size,
    uniquePhones: new Set(registrations.map(r => r.phoneNumber)).size,
    currentSession: sessionId,
  };
}

// Test functions
function runRegistrationStorageTests() {
  console.log('🧪 Testing Registration Storage Utilities');
  console.log('='.repeat(50));
  
  // Clear storage for clean test
  localStorage.clear();
  sessionStorage.clear();
  
  console.log('\n📊 Initial State:');
  let stats = getRegistrationStats();
  console.log(`   Registrations: ${stats.totalRegistrations}`);
  console.log(`   Session ID: ${stats.currentSession}`);
  
  // Test 1: Session ID generation
  console.log('\n🔑 Test 1: Session ID Generation');
  const sessionId1 = getSessionId();
  const sessionId2 = getSessionId();
  
  if (sessionId1 === sessionId2) {
    console.log('✅ Session ID consistency: Same session ID returned');
  } else {
    console.log('❌ Session ID consistency: Different session IDs returned');
  }
  
  // Test 2: Store first registration
  console.log('\n📝 Test 2: Store Registration');
  const registration1 = {
    eventCode: 'E00004',
    phoneNumber: '9876543210',
    name: 'Test User 1',
    timestamp: new Date().toISOString(),
    token: 'T000001',
    sessionId: sessionId1
  };
  
  storeRegistration(registration1);
  const stored = getStoredRegistrations();
  
  if (stored.length === 1 && stored[0].phoneNumber === '9876543210') {
    console.log('✅ Registration storage: Successfully stored registration');
  } else {
    console.log('❌ Registration storage: Failed to store registration');
  }
  
  // Test 3: Phone number duplicate detection
  console.log('\n📱 Test 3: Phone Number Duplicate Detection');
  const phoneDuplicate = isPhoneRegistered('E00004', '9876543210');
  
  if (phoneDuplicate && phoneDuplicate.name === 'Test User 1') {
    console.log('✅ Phone duplicate detection: Found existing registration');
  } else {
    console.log('❌ Phone duplicate detection: Failed to find existing registration');
  }
  
  // Test 4: Phone number uniqueness
  const noPhoneDuplicate = isPhoneRegistered('E00004', '9876543211');
  
  if (!noPhoneDuplicate) {
    console.log('✅ Phone uniqueness: No false positive for different phone');
  } else {
    console.log('❌ Phone uniqueness: False positive detected');
  }
  
  // Test 5: Session duplicate detection
  console.log('\n🖥️  Test 5: Session Duplicate Detection');
  const sessionDuplicate = isSessionRegistered('E00004');
  
  if (sessionDuplicate && sessionDuplicate.sessionId === sessionId1) {
    console.log('✅ Session duplicate detection: Found existing session registration');
  } else {
    console.log('❌ Session duplicate detection: Failed to find existing session registration');
  }
  
  // Test 6: Session uniqueness (different event)
  const noSessionDuplicate = isSessionRegistered('E00005');
  
  if (!noSessionDuplicate) {
    console.log('✅ Session uniqueness: No false positive for different event');
  } else {
    console.log('❌ Session uniqueness: False positive detected');
  }
  
  // Test 7: Store second registration (different phone)
  console.log('\n📝 Test 7: Store Second Registration');
  const registration2 = {
    eventCode: 'E00004',
    phoneNumber: '9876543211',
    name: 'Test User 2',
    timestamp: new Date().toISOString(),
    token: 'T000002',
    sessionId: sessionId1
  };
  
  storeRegistration(registration2);
  stats = getRegistrationStats();
  
  if (stats.totalRegistrations === 2 && stats.uniquePhones === 2) {
    console.log('✅ Multiple registrations: Successfully stored second registration');
  } else {
    console.log('❌ Multiple registrations: Failed to handle multiple registrations correctly');
  }
  
  // Test 8: Cleanup old registrations
  console.log('\n🧹 Test 8: Cleanup Old Registrations');
  
  // Add an old registration (35 days ago)
  const oldRegistration = {
    eventCode: 'E00003',
    phoneNumber: '9876543212',
    name: 'Old User',
    timestamp: new Date(Date.now() - (35 * 24 * 60 * 60 * 1000)).toISOString(),
    token: 'T000003',
    sessionId: 'old_session'
  };
  
  storeRegistration(oldRegistration);
  
  const beforeCleanup = getStoredRegistrations().length;
  cleanupOldRegistrations();
  const afterCleanup = getStoredRegistrations().length;
  
  if (beforeCleanup === 3 && afterCleanup === 2) {
    console.log('✅ Cleanup: Successfully removed old registrations');
  } else {
    console.log(`❌ Cleanup: Failed to clean old registrations (Before: ${beforeCleanup}, After: ${afterCleanup})`);
  }
  
  // Final stats
  console.log('\n📊 Final Statistics:');
  stats = getRegistrationStats();
  console.log(`   Total Registrations: ${stats.totalRegistrations}`);
  console.log(`   Unique Events: ${stats.uniqueEvents}`);
  console.log(`   Unique Phones: ${stats.uniquePhones}`);
  console.log(`   Current Session: ${stats.currentSession}`);
  
  console.log('\n🎯 Registration Storage Tests Complete!');
}

// Run the tests
runRegistrationStorageTests();
