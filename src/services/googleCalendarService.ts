export interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

export const googleCalendarService = {
  async getEvents(accessToken: string, timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Google API Error:', errorData);

      if (response.status === 403) {
        throw new Error('Google Calendar API가 활성화되지 않았거나 권한이 없습니다. (Google Cloud Console에서 활성화 필요)');
      }
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-session-expired'));
        throw new Error('로그인 세션이 만료되었습니다.');
      }
      throw new Error(`Google API 오류 (${response.status}): ${errorData.error?.message || '일정을 불러올 수 없습니다.'}`);
    }

    const data = await response.json();
    return data.items || [];
  },

  async getEventCount(accessToken: string, timeMin: string, timeMax: string, keyword?: string): Promise<number> {
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&fields=items(id,summary)`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) return 0;
    const data = await response.json();
    const items = data.items || [];

    if (!keyword) return items.length;

    return items.filter((item: any) => 
      item.summary && item.summary.toLowerCase().includes(keyword.toLowerCase())
    ).length;
  }
};
