// app/api/verify-event/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { eventcode } = await request.json();

    if (!eventcode) {
      return NextResponse.json({ status: 'fail', message: 'Event code is required.' }, { status: 400 });
    }

    const sapApiUrl = process.env.SAP_API_URL;
    const sapApiUser = process.env.SAP_API_USER;
    const sapApiPass = process.env.SAP_API_PASS;

    if (!sapApiUrl || !sapApiUser || !sapApiPass) {
      console.error('SAP API credentials or URL not configured in .env.local');
      return NextResponse.json({ status: 'fail', message: 'Server configuration error.' }, { status: 500 });
    }

    const response = await fetch(sapApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${sapApiUser}:${sapApiPass}`),
      },
      body: JSON.stringify({
        apikey: 'VALIDATE',
        eventcode: eventcode,
      }),
    });

    if (!response.ok) {
      // Attempt to parse error from SAP if available
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // Ignore if response is not JSON
      }
      console.error('SAP API Error:', response.status, response.statusText, errorData);
      return NextResponse.json({ status: 'fail', message: errorData?.message || 'Error validating event code with SAP.' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in /api/verify-event:', error);
    return NextResponse.json({ status: 'fail', message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
