"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, AlertCircle, CheckCircle, ExternalLink, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { googleCalendarService } from '@/services/googleCalendarService';
import "@/styles/pages/calendar.scss";

const CalendarPage = () => {
  const { user, loading: authLoading, googleAccessToken, loginWithGoogle, filterKeyword } = useAuth();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  const formatTime = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return ''; 
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  const years = Array.from({ length: 11 }, (_, i) => year - 5 + i);

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setEvents({});
    setCurrentDate(new Date(newYear, newMonth, 1));
    setSelectedDay(null);
    setShowPicker(false);
  };

  const fetchGoogleEvents = async () => {
    if (!googleAccessToken) return;
    setEvents({});
    setLoading(true);
    setError(null);
    try {
      const timeMin = new Date(year, month, 1).toISOString();
      const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const data = await googleCalendarService.getEvents(googleAccessToken, timeMin, timeMax);
      const eventMap: Record<number, any[]> = {};
      data.forEach((event: any) => {
        const start = event.start?.dateTime || event.start?.date;
        if (start) {
          const day = new Date(start).getDate();
          if (!eventMap[day]) eventMap[day] = [];
          eventMap[day].push(event);
        }
      });
      setEvents(eventMap);
    } catch (error: any) {
      console.error('Failed to fetch calendar events:', error);
      setError('스케줄을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (googleAccessToken) fetchGoogleEvents();
  }, [currentDate, googleAccessToken]);

  const handleFinishClass = async (event: any) => {
    const shouldSendNoti = window.confirm(`[${event.summary}] 을 종료하시겠습니까?\n\n'확인'을 누르시면 종료 알림톡이 자동으로 발송됩니다.`);
    
    if (shouldSendNoti) {
      try {
        console.log('Sending AlimTalk notification via external API...');
        // Mocking an external API call
        // await fetch('https://api.your-alimtalk-service.com/send', { method: 'POST', ... });
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network dev
        
        alert(`알림톡 발송 완료! [${event.summary}] 수업이 성공적으로 종료 처리되었습니다.`);
      } catch (error) {
        console.error('Failed to send AlimTalk:', error);
        alert('알림톡 발송 중 오류가 발생했지만, 수업 종료 처리는 진행됩니다.');
      }
    } else {
      if (window.confirm('알림톡 없이 수업을 종료하시겠습니까?')) {
        alert(`[${event.summary}] 수업이 종료되었습니다.`);
      }
    }
  };

  const openGoogleCalendar = () => {
    window.open('https://calendar.google.com/', '_blank');
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const renderCalendar = () => {
    const cells = [];
    for (let i = 0; i < startDay; i++) {
      cells.push(<div key={`empty-${i}`} className="day-cell other-month"></div>);
    }
    for (let day = 1; day <= totalDays; day++) {
      const dayEvents = events[day] || [];
      const hasEvents = dayEvents.length > 0;
      const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
      
      cells.push(
        <div 
          key={day} 
          className={`day-cell ${selectedDay === day ? 'selected' : ''} ${isToday ? 'today' : ''} ${hasEvents ? 'has-events' : ''}`}
          onClick={() => setSelectedDay(day)}
        >
          <div className="day-number">{day}</div>
          <div className="event-indicators">
            {dayEvents.slice(0, 3).map((_, idx) => (
              <span key={idx} className="dot"></span>
            ))}
          </div>
          <div className="desktop-events">
            {dayEvents.slice(0, 2).map((event, idx) => (
              <div key={idx} className="event-item">{event.summary}</div>
            ))}
            {dayEvents.length > 2 && <div className="more-count">+{dayEvents.length - 2}</div>}
          </div>
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="calendar-page-container">
      <header className="page-header">
        <div className="header-top-row">
          <div className="title-section">
            <h1>일정 확인</h1>
            <div className="date-selector" ref={pickerRef} onClick={() => setShowPicker(!showPicker)}>
              <span>{year}년 {monthNames[month]}</span>
              <CalendarIcon size={16} className="picker-icon" />
              
              {showPicker && (
                <div className="picker-dropdown" onClick={e => e.stopPropagation()}>
                  <div className="picker-grid">
                    <div className="year-col">
                      {years.map(y => (
                        <button key={y} className={y === year ? 'active' : ''} onClick={() => handleMonthChange(y, month)}>{y}</button>
                      ))}
                    </div>
                    <div className="month-col">
                      {monthNames.map((m, idx) => (
                        <button key={m} className={idx === month ? 'active' : ''} onClick={() => handleMonthChange(year, idx)}>{m}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <button onClick={openGoogleCalendar} className="google-link-btn">
            <ExternalLink size={16} />
            <span>구글 캘린더</span>
          </button>
        </div>

        <div className="header-actions">
          <div className="nav-group">
            <button onClick={() => handleMonthChange(year, month - 1)} className="nav-btn"><ChevronLeft size={20} /></button>
            <button onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date().getDate()); }} className="today-btn">오늘</button>
            <button onClick={() => handleMonthChange(year, month + 1)} className="nav-btn"><ChevronRight size={20} /></button>
          </div>
        </div>
      </header>

      {!googleAccessToken && (
        <div className="sync-banner" onClick={loginWithGoogle}>
          <AlertCircle size={20} />
          <span>구글 캘린더 연동이 필요합니다. 클릭하여 연동하세요.</span>
        </div>
      )}

      {error ? (
        <div className="error-state-card">
          <AlertCircle size={48} className="error-icon" />
          <h2>일정을 불러올 수 없습니다</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => window.location.reload()} className="retry-btn">다시 시도</button>
            <button onClick={loginWithGoogle} className="login-btn">재인증하기</button>
          </div>
        </div>
      ) : (
        <div className="calendar-layout-grid">
          <section className="calendar-main">
            <div className="calendar-grid">
              {dayNames.map(day => <div key={day} className="day-name">{day}</div>)}
              {renderCalendar()}
            </div>
          </section>

          <section className={`agenda-sidebar ${selectedDay ? 'active' : ''}`}>
            <div className="agenda-header">
              <h3>{selectedDay ? `${month + 1}월 ${selectedDay}일 일정` : '일정을 선택하세요'}</h3>
              {selectedDay && <span className="event-count">{events[selectedDay]?.length || 0}개</span>}
            </div>
            <div className="agenda-list">
              {!selectedDay ? (
                <div className="empty-agenda">날짜를 선택하여 일정을 확인하세요.</div>
              ) : !events[selectedDay] || events[selectedDay].length === 0 ? (
                <div className="empty-agenda">등록된 일정이 없습니다.</div>
              ) : (
                events[selectedDay].map((event, idx) => {
                  const isFocused = event.summary?.toLowerCase().includes(filterKeyword?.toLowerCase() || "");
                  return (
                    <div key={idx} className={`agenda-item ${isFocused ? 'focused' : ''}`}>
                      <div className="time-box">
                        <span className="start">{formatTime(event.start?.dateTime || event.start?.date)}</span>
                        <span className="end">~{formatTime(event.end?.dateTime || event.end?.date)}</span>
                      </div>
                      <div className="info-box">
                        <div className="summary">{event.summary}</div>
                        {event.summary?.includes(filterKeyword) && (
                          <button className="done-btn" onClick={() => handleFinishClass(event)}>
                            수업종료
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
