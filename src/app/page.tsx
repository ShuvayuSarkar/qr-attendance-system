'use client'

import { useState, useEffect } from 'react'
import AttendanceForm from '@/components/attendance-form'
import SuccessPage from '@/components/success-page'
import { Toaster } from '@/components/ui/toaster'
import { Loader2 } from 'lucide-react'

// Define the shape of data expected by SuccessPage
interface SuccessPageProps {
  token: string;
  eventCode: string;
  visitorName: string;
  timestamp: string;
}

// Define the shape of data passed from form submission to handleAttendanceSubmit
interface FormSubmitData {
  token: string;
  eventCode: string;
  visitorName: string;
  timestamp: string;
}

export default function Page() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [submissionData, setSubmissionData] = useState<SuccessPageProps | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAttendanceSubmit = async (data: FormSubmitData) => {
    console.log('Attendance submitted, data received in page.tsx:', data);
    setSubmissionData({
      token: data.token,
      eventCode: data.eventCode,
      visitorName: data.visitorName,
      timestamp: data.timestamp,
    });
    setShowSuccess(true);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {!showSuccess ? (
        <AttendanceForm onSubmit={handleAttendanceSubmit} />
      ) : (
        submissionData && (
          <SuccessPage 
            token={submissionData.token}
            eventCode={submissionData.eventCode}
            visitorName={submissionData.visitorName}
            timestamp={submissionData.timestamp}
          />
        )
      )}
      <Toaster />
    </main>
  );
}