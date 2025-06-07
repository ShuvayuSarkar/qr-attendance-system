// app/api/submit-attendance/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const {
      eventcode,
      vstrname,
      vstrnumb,
      vstrfrom,
      geoloc,
      geolat,
      geolon
    } = await request.json();

    // Basic validation
    if (!eventcode || !vstrname || !vstrnumb || !vstrfrom || !geoloc || geolat === undefined || geolon === undefined) {
      return NextResponse.json({ status: 'fail', message: 'Missing required fields.' }, { status: 400 });
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
        apikey: 'SUBMIT',
        eventcode,
        vstrname,
        vstrnumb,
        vstrfrom,
        geoloc,
        geolat,
        geolon,
      }),
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            // Ignore if response is not JSON
        }
        console.error('SAP API Error during submission:', response.status, response.statusText, errorData);
        // The SAP API returns an array in the "data" field for this specific error case
        if (errorData && errorData.data && Array.isArray(errorData.data) && errorData.data.length > 0) {
             return NextResponse.json(errorData.data[0], { status: response.status });
        }
        return NextResponse.json({ status: 'fail', message: errorData?.message || 'Error submitting attendance to SAP.' }, { status: response.status });
    }    const data = await response.json();
    
    // Add geolocation data to the response
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      data.data[0].geoloc = geoloc;
      data.data[0].geolat = geolat;
      data.data[0].geolon = geolon;
    }
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in /api/submit-attendance:', error);
    return NextResponse.json({ status: 'fail', message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
