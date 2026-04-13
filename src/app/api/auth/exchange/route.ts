import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Missing auth code' }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'OAuth credentials not set in environment variables' }, { status: 500 });
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        // In @react-oauth/google, popup auth-code flow uses 'postmessage' as redirect_uri
        redirect_uri: 'postmessage',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Google token exchange error:', data);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      id_token: data.id_token,
      expires_in: data.expires_in
    });
  } catch (error: any) {
    console.error('Token exchange error:', error);
    return NextResponse.json({ error: 'Failed to exchange token', details: error.message }, { status: 500 });
  }
}
