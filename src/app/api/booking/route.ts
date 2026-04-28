import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, date, time, name, phone, duration } = body;

    if (!slug || !date || !time || !name || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: '서버 환경설정 오류 (Firebase Admin 설정이 필요합니다.)' }, { status: 500 });
    }

    // 1. Find user's config by slug using admin SDK
    const profileRef = adminDb.collection('bookingProfiles').doc(slug);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      return NextResponse.json({ error: '예약 페이지를 찾을 수 없습니다.' }, { status: 404 });
    }

    const configData = profileDoc.data();
    if (!configData) {
      return NextResponse.json({ error: '예약 데이터를 불러올 수 없습니다.' }, { status: 500 });
    }

    const targetUserId = configData.uid;

    if (!configData.isBookingEnabled) {
      return NextResponse.json({ error: '현재 예약이 비활성화되어 있습니다.' }, { status: 403 });
    }

    const teacherName = configData.teacherName || '선생님';

    // 2. Get user's Google Refresh Token from their config sub-document using admin SDK
    const userConfigRef = adminDb.collection('users').doc(targetUserId).collection('customers').doc('config');
    const userConfigDoc = await userConfigRef.get();
    const refreshToken = userConfigDoc.exists ? userConfigDoc.data()?.googleRefreshToken : null;

    if (!refreshToken) {
      return NextResponse.json({ error: '해당 선생님의 구글 캘린더가 연동되어 있지 않습니다.' }, { status: 400 });
    }

    // 3. Refresh Access Token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      return NextResponse.json({ error: 'Google 인증 만료로 예약을 진행할 수 없습니다.' }, { status: 500 });
    }

    const accessToken = tokenData.access_token;

    // 4. Create Google Calendar Event
    const startDateTime = new Date(`${date}T${time}:00+09:00`); // Assuming KST
    const endDateTime = new Date(startDateTime.getTime() + (duration || 60) * 60000);

    const eventDetails = {
      summary: `[TuterLog 예약] ${teacherName} 선생님 - ${name}님`,
      description: `수강생 이름: ${name}\n수강생 연락처: ${phone}\n\nTuterLog를 통해 자동 생성된 일정입니다.`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Asia/Seoul',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Asia/Seoul',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const createEventUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
    const eventResponse = await fetch(createEventUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventDetails)
    });

    if (!eventResponse.ok) {
      const errorData = await eventResponse.json();
      console.error('Google API Create Event Error:', errorData);
      return NextResponse.json({ error: '구글 캘린더 일정 생성에 실패했습니다.' }, { status: 500 });
    }

    const eventData = await eventResponse.json();

    return NextResponse.json({ success: true, eventId: eventData.id });
  } catch (error: any) {
    console.error('Booking Error:', error);
    return NextResponse.json({ error: '예약 처리 중 오류가 발생했습니다.', details: error.message }, { status: 500 });
  }
}
