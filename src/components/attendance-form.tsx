// src/components/attendance-form.tsx
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
import { Loader2, MapPin, Clock, User, Building, Phone, Hash, AlertTriangle, CheckCircle } from 'lucide-react'
import { 
  getSessionId, 
  storeRegistration, 
  isPhoneRegistered, 
  isSessionRegistered, 
  cleanupOldRegistrations,
  RegistrationRecord 
} from '@/lib/registration-storage'

// Form validation schema
const attendanceSchema = z.object({
  eventCode: z.string().min(1, 'Event code is required'),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits').max(15, 'Mobile number is too long'),
  visitorName: z.string().min(2, 'Name must be at least 2 characters'),
  organizationName: z.string().min(2, 'Organization name is required'),
})

type AttendanceFormData = z.infer<typeof attendanceSchema>

// Updated interface for data passed to onSubmit prop
interface AttendanceFormSubmitData {
  token: string;
  eventCode: string;
  visitorName: string;
  timestamp: string;
}

interface AttendanceFormProps {
  onSubmit: (data: AttendanceFormSubmitData) => Promise<void>;
}

export default function AttendanceForm({ onSubmit }: AttendanceFormProps) {  const [isEventCodeVerified, setIsEventCodeVerified] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null)
  const [locationName, setLocationName] = useState<string>('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isOnLeftSide, setIsOnLeftSide] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [sessionRegistration, setSessionRegistration] = useState<RegistrationRecord | null>(null)
  const blobRef = useRef<HTMLDivElement | null>(null)

  const form = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      eventCode: '',
      mobileNumber: '',
      visitorName: '',
      organizationName: '',
    },  })

  // Clean up old registrations on component mount
  useEffect(() => {
    cleanupOldRegistrations()
  }, [])
  // Blob movement effect - responsive for mobile and desktop
  useEffect(() => {
    const moveBlob = (e: MouseEvent | TouchEvent) => {
      let clientX: number, clientY: number;
      
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      // Check if the touch/mouse is on the left side of the screen (desktop) or top section (mobile)
      const isDesktop = window.innerWidth >= 1024; // lg breakpoint
      const inInteractiveArea = isDesktop 
        ? clientX < window.innerWidth / 2  // Left side on desktop
        : clientY < window.innerHeight * 0.28; // Top 28% on mobile

      setIsOnLeftSide(inInteractiveArea);

      if (blobRef.current && inInteractiveArea) {
        // Update blob position
        blobRef.current.style.left = `${clientX - 48}px`;
        blobRef.current.style.top = `${clientY - 48}px`;
      }
    };

    // Add both mouse and touch event listeners
    document.addEventListener('mousemove', moveBlob);
    document.addEventListener('touchmove', moveBlob, { passive: true });

    // Cleanup the event listeners on component unmount
    return () => {
      document.removeEventListener('mousemove', moveBlob);
      document.removeEventListener('touchmove', moveBlob);
    };
  }, [isOnLeftSide]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          setUserLocation(location)
          
          // Fetch location name
          try {
            const locResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`
            )
            if (locResponse.ok) {
              const locationData = await locResponse.json()
              setLocationName(locationData.display_name || 'Unknown Location')
            } else {
              setLocationName('Unknown Location')
            }
          } catch (e) {
            console.error("Error fetching location name:", e);
            setLocationName('Unknown Location')
          }
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

  // Function to check for phone number duplicates
  const checkPhoneDuplicate = (phoneNumber: string) => {
    const eventCode = form.getValues('eventCode')
    if (!eventCode || !phoneNumber || phoneNumber.length < 10) {
      setDuplicateWarning(null)
      return
    }

    const existingReg = isPhoneRegistered(eventCode, phoneNumber)
    if (existingReg) {
      setDuplicateWarning(`This phone number is already registered for this event. Token: ${existingReg.token}`)
    } else {
      setDuplicateWarning(null)
    }
  }

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

    // Check if this browser session has already registered for this event
    const existingSessionReg = isSessionRegistered(eventCode)
    if (existingSessionReg) {
      setSessionRegistration(existingSessionReg)
      toast({
        title: "Already Registered",
        description: `This browser has already registered for this event. Token: ${existingSessionReg.token}`,
        variant: "destructive"
      })
      return
    }    setIsVerifyingCode(true)
    setDuplicateWarning(null)
    
    try {
      const response = await fetch('/api/verify-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventcode: eventCode }),
      });      const result = await response.json();

      if (response.ok && result.data && result.data[0] && result.data[0].status === 'success') {
        setIsEventCodeVerified(true)
        toast({
          title: "Event Code Verified",
          description: result.data[0].message || "Please fill in your details below.",
        })
      } else {
        setIsEventCodeVerified(false);
        const errorMessage = result.data && result.data[0] ? result.data[0].message : result.message;
        toast({
          title: "Event Code Issue",
          description: errorMessage || "Please check the event code and try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error verifying event code:', error);
      toast({
        title: "Verification Error",
        description: "An unexpected error occurred during verification.",
        variant: "destructive"
      })
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const handleSubmit = async (formData: AttendanceFormData) => {
    if (!userLocation) {
      toast({
        title: "Location Required",
        description: "Location access is required to submit attendance.",
        variant: "destructive",
      });
      return;
    }
    if (!isEventCodeVerified) {
        toast({
            title: "Event Code Not Verified",
            description: "Please verify the event code first.",
            variant: "destructive",
        });
        return;
    }    setIsSubmitting(true);
    const submissionTimestamp = new Date().toISOString();

    try {
      const apiPayload = {
        eventcode: formData.eventCode,
        vstrname: formData.visitorName,
        vstrnumb: formData.mobileNumber,
        vstrfrom: formData.organizationName,
        geoloc: locationName || 'Unknown Location',
        geolat: userLocation.latitude,
        geolon: userLocation.longitude,
      };

      const response = await fetch('/api/submit-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });      const apiResponse = await response.json();

      // Standardize token extraction, matching mobile component
      const token = apiResponse.tokenno || apiResponse.token || (apiResponse.data && Array.isArray(apiResponse.data) && apiResponse.data.length > 0 && (apiResponse.data[0].tokenno || apiResponse.data[0].token));

      if (response.ok && token) {
        // Store registration in browser localStorage for duplicate prevention
        const registrationRecord: RegistrationRecord = {
          eventCode: formData.eventCode,
          phoneNumber: formData.mobileNumber,
          name: formData.visitorName,
          timestamp: submissionTimestamp,
          token: token,
          sessionId: getSessionId()
        };
        storeRegistration(registrationRecord);

        toast({
          title: "Attendance Submitted!",
          description: apiResponse.message || `Your token is ${token}.`,
        });

        await onSubmit({
          token: token,
          eventCode: formData.eventCode,
          visitorName: formData.visitorName,
          timestamp: submissionTimestamp,
        });
        form.reset();
        setIsEventCodeVerified(false);
      } else {
        const errorMessage = apiResponse.message || (apiResponse.data && Array.isArray(apiResponse.data) && apiResponse.data.length > 0 && apiResponse.data[0].message) || "Submission failed. Please check details.";
        toast({
          title: "Submission Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting attendance:", error);
      toast({
        title: "Submission Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row relative overflow-x-hidden">
      {/* Top/Left Side - Animated Company Branding - Responsive */}
      <div className="w-full h-[28vh] lg:h-auto lg:w-1/2 bg-gray-200 flex items-center justify-center relative overflow-hidden">
        {/* Main Content */}        <div 
          className="text-center space-y-4 lg:space-y-6 z-10 relative px-4 max-w-full overflow-hidden"
          style={{
            animation: 'fadeInScale 1s ease-out'
          }}
        >{/* Company Logo */}
          <div className="flex items-center justify-center mb-4 lg:mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/brand-logo.png" 
              alt="Company Logo" 
              className="h-16 lg:h-24 w-auto object-contain"
              onError={(e) => {
                // Fallback to default icon if logo fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto hidden">
              <Building className="w-12 h-12 lg:w-16 lg:h-16 text-blue-600" />
            </div>
          </div>            <div className="space-y-2 lg:space-y-4 max-w-full">
            <h1 className="text-lg lg:text-4xl font-bold text-gray-800 px-2 break-words">
              Welcome to Our Event!
            </h1>
            <p className="text-xs lg:text-lg text-gray-600 max-w-sm lg:max-w-md mx-auto px-2 leading-relaxed break-words">
              Please complete your attendance registration to join us at this exclusive Electrician & Mechanic Meet.
            </p>
          </div>
          
          {/* Current time display */}
          <div className="flex items-center justify-center text-xs lg:text-sm text-gray-500 space-x-2 mt-4 lg:mt-8">
            <Clock className="w-3 h-3 lg:w-4 lg:h-4" />
            <span>{currentTime.toLocaleString()}</span>
          </div>
        </div>        {/* Floating Abstract Shapes - Hidden on mobile to prevent overflow */}
        <div className="hidden lg:block">
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

        {/* Mobile-specific simple background shapes */}
        <div className="lg:hidden">
          <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-purple-400 rounded-full opacity-30 filter blur-xl"></div>
          <div className="absolute top-3/4 right-1/4 w-20 h-20 bg-pink-400 rounded-full opacity-25 filter blur-xl"></div>
        </div></div>      {/* Bottom/Right Side - Attendance Form - Responsive */}
      <div className="w-full flex-1 lg:w-1/2 flex flex-col items-center justify-start lg:justify-center bg-white px-2 lg:px-8 py-4 lg:py-6 relative z-10">
        <Card className="w-full max-w-[calc(100vw-1rem)] sm:max-w-sm lg:max-w-md shadow-xl mx-2 lg:mx-0">
          <CardHeader className="text-center space-y-2 pb-3 lg:pb-6">
            <CardTitle className="text-base lg:text-2xl font-bold">Event Attendance</CardTitle>
            <CardDescription className="text-xs lg:text-base">
              Please enter your details to register your attendance
            </CardDescription>
          </CardHeader>          <CardContent className="space-y-3 lg:space-y-6 px-3 lg:px-6">
            {/* Session Registration Warning */}            {sessionRegistration && (
              <div className="flex items-start space-x-2 p-2 lg:p-4 bg-blue-50 border border-blue-200 rounded-md">
                <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="text-xs lg:text-sm font-medium text-blue-800">Already Registered</p>
                  <p className="text-xs text-blue-600 break-all truncate">Token: {sessionRegistration.token}</p>
                </div>
              </div>
            )}

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 lg:space-y-4 w-full min-w-0">
                {/* Event Code Field */}
              <div className="space-y-1.5">
                <Label htmlFor="eventCode" className="flex items-center space-x-2 text-xs lg:text-base">
                  <Hash className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span>Event Code</span>
                </Label>                <div className="flex space-x-2 min-w-0">                  <Input
                    id="eventCode"
                    placeholder="Event code"
                    {...form.register('eventCode')}
                    disabled={isEventCodeVerified}
                    className={`text-sm lg:text-base flex-1 min-w-0 ${isEventCodeVerified ? 'bg-green-50 border-green-200' : ''}`}
                  />
                  <Button
                    type="button"
                    onClick={verifyEventCode}
                    disabled={isVerifyingCode || isEventCodeVerified}
                    variant={isEventCodeVerified ? "default" : "outline"}
                    className="shrink-0 px-2 lg:px-4 text-xs lg:text-sm"
                    size="sm"
                  >
                    {isVerifyingCode ? (
                      <Loader2 className="w-3 h-3 lg:w-4 lg:h-4 animate-spin" />
                    ) : isEventCodeVerified ? (
                      "✓"
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
                {form.formState.errors.eventCode && (
                  <p className="text-xs text-red-500">{form.formState.errors.eventCode.message}</p>
                )}
              </div>              {/* Other form fields - disabled until event code is verified */}              <div className="space-y-3 lg:space-y-4 w-full min-w-0">
                <div className="space-y-2 w-full min-w-0">
                  <Label htmlFor="mobileNumber" className="flex items-center space-x-2 text-sm lg:text-base">
                    <Phone className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span>Mobile Number</span>
                  </Label>                  <Input
                    id="mobileNumber"
                    type="tel"
                    placeholder="Mobile number"
                    {...form.register('mobileNumber')}
                    disabled={!isEventCodeVerified}
                    className="text-sm lg:text-base w-full min-w-0"
                    onChange={(e) => {
                      form.setValue('mobileNumber', e.target.value);
                      checkPhoneDuplicate(e.target.value);
                    }}
                  />
                  {form.formState.errors.mobileNumber && (
                    <p className="text-xs lg:text-sm text-red-500">{form.formState.errors.mobileNumber.message}</p>
                  )}                  {duplicateWarning && (
                    <div className="flex items-start space-x-2 p-2 lg:p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <AlertTriangle className="w-3 h-3 lg:w-4 lg:h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs lg:text-sm text-yellow-800 break-words min-w-0">{duplicateWarning}</p>
                    </div>
                  )}
                </div>                <div className="space-y-2 w-full min-w-0">
                  <Label htmlFor="visitorName" className="flex items-center space-x-2 text-sm lg:text-base">
                    <User className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span>Visitor Name</span>
                  </Label>                  <Input
                    id="visitorName"
                    placeholder="Full name"
                    {...form.register('visitorName')}
                    disabled={!isEventCodeVerified}
                    className="text-sm lg:text-base w-full min-w-0"
                  />
                  {form.formState.errors.visitorName && (
                    <p className="text-xs lg:text-sm text-red-500">{form.formState.errors.visitorName.message}</p>
                  )}
                </div>                <div className="space-y-2 w-full min-w-0">
                  <Label htmlFor="organizationName" className="flex items-center space-x-2 text-sm lg:text-base">
                    <Building className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span>Organization / Shop Name</span>
                  </Label>                  <Input
                    id="organizationName"
                    placeholder="Organization/Shop name"
                    {...form.register('organizationName')}
                    disabled={!isEventCodeVerified}
                    className="text-sm lg:text-base w-full min-w-0"
                  />
                  {form.formState.errors.organizationName && (
                    <p className="text-xs lg:text-sm text-red-500">{form.formState.errors.organizationName.message}</p>
                  )}
                </div>
              </div>              {/* Location information display */}
              {userLocation ? (
                <div className="space-y-2 lg:space-y-3 p-3 lg:p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-800">
                    <MapPin className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span className="text-xs lg:text-sm font-medium">Location Captured Successfully</span>
                  </div>                  <div className="space-y-2 text-xs lg:text-sm text-green-700">
                    <div className="break-words">
                      <span className="font-medium">Address:</span> <span className="break-all">{locationName || 'Loading address...'}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="break-all">
                        <span className="font-medium">Lat:</span> {userLocation.latitude.toFixed(6)}
                      </div>
                      <div className="break-all">
                        <span className="font-medium">Lon:</span> {userLocation.longitude.toFixed(6)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 p-3 lg:p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-amber-800">
                    <MapPin className="w-3 h-3 lg:w-4 lg:h-4 animate-pulse" />
                    <span className="text-xs lg:text-sm font-medium">Capturing Location...</span>
                  </div>
                  <p className="text-xs lg:text-sm text-amber-700">
                    Please allow location access to continue with attendance submission.
                  </p>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 text-white hover:bg-blue-700 text-sm lg:text-base py-2 lg:py-3"
                disabled={!isEventCodeVerified || isSubmitting || !userLocation}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3 h-3 lg:w-4 lg:h-4 mr-2 animate-spin" />
                    Submitting Attendance...
                  </>
                ) : (
                  'Submit Attendance'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>      {/* Interactive Blob (visible only in branding area - left side desktop, top section mobile) */}
      <div
        ref={blobRef}
        className="blob absolute -z-1 w-16 h-16 lg:w-24 lg:h-24 bg-blue-500 rounded-full opacity-50 pointer-events-none"
        style={{
          filter: 'url(#goo) blur(20px) lg:blur(32px)',
          display: isOnLeftSide ? 'block' : 'none'
        }}
      />

      {/* SVG Filter for Blob */}
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