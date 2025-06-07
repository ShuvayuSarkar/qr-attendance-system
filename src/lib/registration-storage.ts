// Local storage utility for tracking registrations
export interface RegistrationRecord {
  eventCode: string;
  phoneNumber: string;
  name: string;
  timestamp: string;
  token?: string;
  sessionId: string;
}

const STORAGE_KEY = 'qr_attendance_registrations';
const SESSION_KEY = 'qr_attendance_session';

// Generate a unique session ID for this browser session
export function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

// Get all registrations from localStorage
export function getStoredRegistrations(): RegistrationRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading stored registrations:', error);
    return [];
  }
}

// Store a new registration
export function storeRegistration(registration: RegistrationRecord): void {
  try {
    const existing = getStoredRegistrations();
    existing.push(registration);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Error storing registration:', error);
  }
}

// Check if a phone number is already registered for an event in this browser
export function isPhoneRegistered(eventCode: string, phoneNumber: string): RegistrationRecord | null {
  const registrations = getStoredRegistrations();
  return registrations.find(reg => 
    reg.eventCode === eventCode && 
    reg.phoneNumber === phoneNumber
  ) || null;
}

// Check if this browser session has already registered for an event
export function isSessionRegistered(eventCode: string): RegistrationRecord | null {
  const sessionId = getSessionId();
  const registrations = getStoredRegistrations();
  return registrations.find(reg => 
    reg.eventCode === eventCode && 
    reg.sessionId === sessionId
  ) || null;
}

// Clear old registrations (older than 30 days)
export function cleanupOldRegistrations(): void {
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
export function getRegistrationStats(): {
  totalRegistrations: number;
  uniqueEvents: number;
  uniquePhones: number;
  currentSession: string;
} {
  const registrations = getStoredRegistrations();
  const sessionId = getSessionId();
  
  return {
    totalRegistrations: registrations.length,
    uniqueEvents: new Set(registrations.map(r => r.eventCode)).size,
    uniquePhones: new Set(registrations.map(r => r.phoneNumber)).size,
    currentSession: sessionId,
  };
}
