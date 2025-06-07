'use client'

import { useState, useEffect } from 'react'
import AttendanceForm from '@/components/attendance-form'
import AttendanceFormMobile from '@/components/attendance-form-mobile'
import SuccessPage from '@/components/success-page'
import { Toaster } from '@/components/ui/toaster'

interface AttendanceData {
  eventCode: string;
  mobileNumber: string;
  visitorName: string;
  organizationName: string;
  timestamp: string;
  ipAddress: string;
  latitude: number;
  longitude: number;
  locationName: string;
}

interface SuccessData {
  tokenNumber: string;
  eventCode: string;
  visitorName: string;
  timestamp: string;
}

export default function HomePage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [successData, setSuccessData] = useState<SuccessData | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Check if screen is mobile size
  useEffect(() => {
    setIsClient(true) // Mark as client-side rendered
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint in Tailwind
    }
    
    // Check on mount
    checkMobile()
    
    // Add resize listener
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleAttendanceSubmit = async (data: AttendanceData) => {
    try {
      // Generate token number (6-digit alphanumeric)
      const tokenNumber = generateToken(data.visitorName, data.mobileNumber, data.timestamp)
      
      // TODO: Submit to SAP backend
      console.log('Submitting attendance data:', data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Set success data
      setSuccessData({
        tokenNumber,
        eventCode: data.eventCode,
        visitorName: data.visitorName,
        timestamp: data.timestamp
      })
      
      setIsSubmitted(true)
      
    } catch (error) {
      console.error('Error submitting attendance:', error)
      throw error
    }
  }

  const generateToken = (name: string, mobile: string, timestamp: string): string => {
    // Generate a 6-digit alphanumeric token based on name, mobile, and timestamp
    const combined = name + mobile + timestamp
    const hash = combined.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0)
    }, 0)
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let token = ''
    let tempHash = hash
    
    for (let i = 0; i < 6; i++) {
      token += chars[tempHash % chars.length]
      tempHash = Math.floor(tempHash / chars.length) + Date.now() + i
    }
    
    return token
  }

  if (isSubmitted && successData) {
    return <SuccessPage successData={successData} />
  }

  // Show loading state during server-side rendering
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {isMobile ? (
        <AttendanceFormMobile onSubmit={handleAttendanceSubmit} />
      ) : (
        <AttendanceForm onSubmit={handleAttendanceSubmit} />
      )}
      <Toaster />
    </>
  )
}