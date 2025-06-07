// src/components/success-page.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Copy, Clock, Hash, User, Calendar } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface SuccessData {
  tokenNumber: string;
  eventCode: string;
  visitorName: string;
  timestamp: string;
}

interface SuccessPageProps {
  successData: SuccessData;
}

export default function SuccessPage({ successData }: SuccessPageProps) {
  const [copied, setCopied] = useState(false)

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(successData.tokenNumber)
      setCopied(true)
      toast({
        title: "Token Copied!",
        description: "Your attendance token has been copied to clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the token number.",
        variant: "destructive"
      })
    }
  }

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'medium'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            Attendance Confirmed!
          </CardTitle>
          <p className="text-gray-600">
            Your attendance has been successfully recorded. Please share your token number with the event host.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Token Number - Prominent Display */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-lg text-white text-center space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <Hash className="w-5 h-5" />
              <span className="text-lg font-semibold">Your Token Number</span>
            </div>
            <div className="text-3xl font-bold font-mono tracking-wider">
              {successData.tokenNumber}
            </div>
            <Button
              onClick={copyToken}
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? 'Copied!' : 'Copy Token'}
            </Button>
          </div>

          {/* Attendance Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Attendance Details</h3>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">Visitor Name</span>
                </div>
                <Badge variant="secondary">{successData.visitorName}</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Hash className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">Event Code</span>
                </div>
                <Badge variant="secondary">{successData.eventCode}</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">Timestamp</span>
                </div>
                <span className="text-sm text-gray-800 text-right">
                  {formatDateTime(successData.timestamp)}
                </span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Next Steps:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Share your token number with the event host</li>
              <li>• Keep this confirmation for your records</li>
              <li>• Proceed to the event venue</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={copyToken}
              variant="outline"
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Token Again
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              className="flex-1"
            >
              Submit Another Attendance
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}