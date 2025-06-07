// src/components/attendance-form-mobile.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Loader2, MapPin, Clock, User, Building, Phone, Hash, Zap, Wrench } from 'lucide-react'

// Form validation schema
const attendanceSchema = z.object({
  eventCode: z.string().min(1, 'Event code is required'),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits').max(15, 'Mobile number is too long'),
  visitorName: z.string().min(2, 'Name must be at least 2 characters'),
  organizationName: z.string().min(2, 'Organization name is required'),
})

type AttendanceFormData = z.infer<typeof attendanceSchema>

interface AttendanceFormProps {
  onSubmit: (data: AttendanceFormData & { 
    timestamp: string;
    ipAddress: string;
    latitude: number;
    longitude: number;
    locationName: string;
  }) => Promise<void>;
}

export default function AttendanceFormMobile({ onSubmit }: AttendanceFormProps) {
  const [isEventCodeVerified, setIsEventCodeVerified] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null)
  const [currentTime, setCurrentTime] = useState<Date | null>(null) // Start with null
  const [isMounted, setIsMounted] = useState(false) // Track if component is mounted
  const [isInTopSection, setIsInTopSection] = useState(false)
  const blobRef = useRef<HTMLDivElement | null>(null)

  const form = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      eventCode: '',
      mobileNumber: '',
      visitorName: '',
      organizationName: '',
    },
  })
  
  // Set mounted state and initialize time only on client
  useEffect(() => {
    setIsMounted(true)
    setCurrentTime(new Date())
  }, [])

  // Blob movement effect for mobile - similar to desktop
  useEffect(() => {
    const moveBlob = (e: TouchEvent | MouseEvent) => {
      let clientX: number, clientY: number;
      
      if ('touches' in e) {
        // Touch event
        clientX = e.touches[0]?.clientX || 0;
        clientY = e.touches[0]?.clientY || 0;
      } else {
        // Mouse event
        clientX = e.clientX;
        clientY = e.clientY;
      }

      // Check if the touch/mouse is in the top section (35% of screen height)
      setIsInTopSection(clientY < window.innerHeight * 0.35);

      if (blobRef.current && isInTopSection) {
        // Update blob position
        blobRef.current.style.left = `${clientX - 48}px`;
        blobRef.current.style.top = `${clientY - 48}px`;
      }
    };

    // Add both touch and mouse event listeners for mobile compatibility
    document.addEventListener('mousemove', moveBlob);
    document.addEventListener('touchmove', moveBlob);

    // Cleanup the event listeners on component unmount
    return () => {
      document.removeEventListener('mousemove', moveBlob);
      document.removeEventListener('touchmove', moveBlob);
    };
  }, [isInTopSection]);

  // Update current time every second - only after mounted
  useEffect(() => {
    if (!isMounted) return

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [isMounted])

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          toast({
            title: "Location Access Required",
            description: "Please enable location access to complete attendance.",
            variant: "destructive"
          })
        }
      )
    }
  }, [])

  const verifyEventCode = async () => {
    const eventCode = form.getValues('eventCode')
    if (!eventCode) {
      toast({
        title: "Event Code Required",
        description: "Please enter the event code to continue.",
        variant: "destructive"
      })
      return
    }

    setIsVerifyingCode(true)
    try {
      // TODO: Replace with actual API call to verify event code
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API call
      setIsEventCodeVerified(true)
      toast({
        title: "Event Code Verified",
        description: "Please fill in your details below.",
      })
    } catch (error) {
      toast({
        title: "Invalid Event Code",
        description: "Please check the event code and try again.",
        variant: "destructive"
      })
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const handleSubmit = async (data: AttendanceFormData) => {
    if (!userLocation) {
      toast({
        title: "Location Required",
        description: "Location access is required to complete attendance.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Get location name from coordinates
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.latitude}&lon=${userLocation.longitude}`
      )
      const locationData = await response.json()
      const locationName = locationData.display_name || 'Unknown Location'

      // Get user's IP address
      const ipResponse = await fetch('https://api.ipify.org?format=json')
      const ipData = await ipResponse.json()

      await onSubmit({
        ...data,
        timestamp: new Date().toISOString(),
        ipAddress: ipData.ip,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        locationName
      })

    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Don't render time until component is mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col relative">
        {/* Top Branding Section - 35% with exact desktop styling */}
        <div className="h-[35vh] bg-gray-200 relative overflow-hidden flex items-center justify-center">
          {/* Main Content */}
          <div 
            className="text-center space-y-4 z-10 relative px-4"
            style={{
              animation: 'fadeInScale 1s ease-out'
            }}
          >
            <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-4">
              <Building className="w-10 h-10 text-blue-600" />
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-gray-800">
                Welcome to Our Event!
              </h1>
              <p className="text-sm text-gray-600 max-w-xs mx-auto">
                Please complete your attendance registration to join us at this exclusive Electrician & Mechanic Meet.
              </p>
            </div>
            
            {/* Current time display */}
            <div className="flex items-center justify-center text-xs text-gray-500 space-x-2 mt-6">
              <Clock className="w-3 h-3" />
              <span>Loading...</span>
            </div>
          </div>

          {/* Floating Abstract Shapes - exact desktop match */}
          <div
            className="absolute top-1/2 left-1/4 w-32 h-32 bg-purple-500 rounded-full opacity-60 filter blur-3xl"
            style={{
              animation: 'float1 4s ease-in-out infinite alternate'
            }}
          />

          <div
            className="absolute top-1/2 left-1/4 w-32 h-32 bg-pink-800 rounded-full opacity-60 filter blur-3xl"
            style={{
              animation: 'float2 4s ease-in-out infinite alternate'
            }}
          />

          <div
            className="absolute top-1/4 left-1/3 w-24 h-24 bg-indigo-900 rounded-full opacity-50 filter blur-2xl"
            style={{
              animation: 'float3 5s ease-in-out infinite alternate'
            }}
          />

          <div
            className="absolute top-1/3 left-1/2 w-40 h-40 bg-purple-400 rounded-full opacity-70 filter blur-3xl"
            style={{
              animation: 'float4 6s ease-in-out infinite alternate'
            }}
          />

          <div
            className="absolute top-1/2 right-1/4 w-28 h-28 bg-pink-500 rounded-full opacity-40 filter blur-xl"
            style={{
              animation: 'float5 3s ease-in-out infinite alternate'
            }}
          />
        </div>

        {/* Form Section - 65% */}
        <div className="flex-1 p-4 flex items-start justify-center pt-6 bg-white">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-bold">Event Attendance</CardTitle>
              <CardDescription className="text-sm">
                Please enter your details to register your attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">Loading form...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Top Branding Section - 35% with exact desktop styling */}
      <div className="h-[35vh] bg-gray-200 relative overflow-hidden flex items-center justify-center">
        {/* Main Content */}
        <div 
          className="text-center space-y-4 z-10 relative px-4"
          style={{
            animation: 'fadeInScale 1s ease-out'
          }}
        >
          <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-4">
            <Building className="w-10 h-10 text-blue-600" />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome to Our Event!
            </h1>
            <p className="text-sm text-gray-600 max-w-xs mx-auto">
              Please complete your attendance registration to join us at this exclusive Electrician & Mechanic Meet.
            </p>
          </div>
          
          {/* Current time display */}
          <div className="flex items-center justify-center text-xs text-gray-500 space-x-2 mt-6">
            <Clock className="w-3 h-3" />
            <span>{currentTime?.toLocaleString() || 'Loading...'}</span>
          </div>
        </div>

        {/* Floating Abstract Shapes - exact desktop match */}
        <div
          className="absolute top-1/2 left-1/4 w-32 h-32 bg-purple-500 rounded-full opacity-60 filter blur-3xl"
          style={{
            animation: 'float1 4s ease-in-out infinite alternate'
          }}
        />

        <div
          className="absolute top-1/2 left-1/4 w-32 h-32 bg-pink-800 rounded-full opacity-60 filter blur-3xl"
          style={{
            animation: 'float2 4s ease-in-out infinite alternate'
          }}
        />

        <div
          className="absolute top-1/4 left-1/3 w-24 h-24 bg-indigo-900 rounded-full opacity-50 filter blur-2xl"
          style={{
            animation: 'float3 5s ease-in-out infinite alternate'
          }}
        />

        <div
          className="absolute top-1/3 left-1/2 w-40 h-40 bg-purple-400 rounded-full opacity-70 filter blur-3xl"
          style={{
            animation: 'float4 6s ease-in-out infinite alternate'
          }}
        />

        <div
          className="absolute top-1/2 right-1/4 w-28 h-28 bg-pink-500 rounded-full opacity-40 filter blur-xl"
          style={{
            animation: 'float5 3s ease-in-out infinite alternate'
          }}
        />
      </div>

      {/* Form Section - 65% */}
      <div className="flex-1 p-4 flex items-start justify-center pt-6 bg-white">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold">Event Attendance</CardTitle>
            <CardDescription className="text-sm">
              Please enter your details to register your attendance
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Event Code Field */}
              <div className="space-y-2">
                <Label htmlFor="eventCode" className="flex items-center space-x-2 text-sm">
                  <Hash className="w-4 h-4" />
                  <span>Event Code</span>
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="eventCode"
                    placeholder="Enter event code"
                    {...form.register('eventCode')}
                    disabled={isEventCodeVerified}
                    className={`text-sm ${isEventCodeVerified ? 'bg-green-50 border-green-200' : ''}`}
                  />
                  <Button
                    type="button"
                    onClick={verifyEventCode}
                    disabled={isVerifyingCode || isEventCodeVerified}
                    variant={isEventCodeVerified ? "default" : "outline"}
                    size="sm"
                    className="shrink-0 px-3"
                  >
                    {isVerifyingCode ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isEventCodeVerified ? (
                      "Verified"
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
                {form.formState.errors.eventCode && (
                  <p className="text-xs text-red-500">{form.formState.errors.eventCode.message}</p>
                )}
              </div>

              {/* Other form fields - disabled until event code is verified */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber" className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4" />
                    <span>Mobile Number</span>
                  </Label>
                  <Input
                    id="mobileNumber"
                    type="tel"
                    placeholder="Enter your mobile number"
                    {...form.register('mobileNumber')}
                    disabled={!isEventCodeVerified}
                    className="text-sm"
                  />
                  {form.formState.errors.mobileNumber && (
                    <p className="text-xs text-red-500">{form.formState.errors.mobileNumber.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitorName" className="flex items-center space-x-2 text-sm">
                    <User className="w-4 h-4" />
                    <span>Visitor Name</span>
                  </Label>
                  <Input
                    id="visitorName"
                    placeholder="Enter your full name"
                    {...form.register('visitorName')}
                    disabled={!isEventCodeVerified}
                    className="text-sm"
                  />
                  {form.formState.errors.visitorName && (
                    <p className="text-xs text-red-500">{form.formState.errors.visitorName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationName" className="flex items-center space-x-2 text-sm">
                    <Building className="w-4 h-4" />
                    <span>Organization / Shop Name</span>
                  </Label>
                  <Input
                    id="organizationName"
                    placeholder="Enter your organization or shop name"
                    {...form.register('organizationName')}
                    disabled={!isEventCodeVerified}
                    className="text-sm"
                  />
                  {form.formState.errors.organizationName && (
                    <p className="text-xs text-red-500">{form.formState.errors.organizationName.message}</p>
                  )}
                </div>
              </div>

              {/* Location status */}
              <div className="flex items-center justify-center text-xs text-gray-500 space-x-2 py-2">
                <MapPin className="w-3 h-3" />
                <span>
                  {userLocation ? 'Location captured' : 'Capturing location...'}
                </span>
              </div>

              {/* Submit button - matching desktop style */}
              <Button
                type="submit"
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                disabled={!isEventCodeVerified || isSubmitting || !userLocation}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting Attendance...
                  </>
                ) : (
                  'Submit Attendance'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Blob (visible only in the top section) - matching desktop */}
      <div
        ref={blobRef}
        className="blob absolute -z-1 w-24 h-24 bg-blue-500 rounded-full opacity-50 pointer-events-none"
        style={{
          filter: 'url(#goo) blur(32px)',
          display: isInTopSection ? 'block' : 'none'
        }}
      />

      {/* SVG Filter for Blob - exact match to desktop */}
      <svg xmlns="http://www.w3.org/2000/svg" className="hidden">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes float1 {
          from {
            transform: translate(-50%, -50%);
          }
          to {
            transform: translate(50%, 50%);
          }
        }

        @keyframes float2 {
          from {
            transform: translate(100%, 100%);
          }
          to {
            transform: translate(-120%, -50%);
          }
        }

        @keyframes float3 {
          from {
            transform: translate(-100%, -100%);
          }
          to {
            transform: translate(100%, 0%);
          }
        }

        @keyframes float4 {
          from {
            transform: translate(50%, -50%);
          }
          to {
            transform: translate(-100%, 30%);
          }
        }

        @keyframes float5 {
          from {
            transform: translate(100%, 50%);
          }
          to {
            transform: translate(-50%, 150%);
          }
        }
      `}</style>
    </div>
  )
}