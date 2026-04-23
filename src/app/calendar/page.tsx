"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { googleCalendarService } from '@/services/googleCalendarService';
import { customerService, Customer } from '@/services/customerService';
import MonthPicker from '@/components/ui/MonthPicker';
import "@/styles/pages/calendar.scss";

const CalendarPage = () => {
  const { user, loading: authLoading, googleAccessToken, loginWithGoogle, filterKeyword } = useAuth();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [completedEventIds, setCompletedEventIds] = useState<string[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);



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

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setEvents({});
    setCurrentDate(new Date(newYear, newMonth, 1));
    setSelectedDay(null);
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

  useEffect(() => {
    const fetchCustomers = async () => {
      if (user?.uid) {
        try {
          const data = await customerService.getCustomers(user.uid);
          setCustomers(data);
        } catch (error) {
          console.error("Failed to fetch customers:", error);
        }
      }
    };
    fetchCustomers();
  }, [user]);

  useEffect(() => {
    const fetchCompletedSessions = async () => {
      if (!user?.uid || !events[selectedDay || 0] || customers.length === 0) return;
      
      try {
        const currentEvents = events[selectedDay || 0];
        const completedIds: string[] = [];
        
        // Optimize: Only check customers who have events today
        const todaysCustomers = customers.filter(c => 
          currentEvents.some(e => e.summary?.includes(c.nickname))
        );

        for (const customer of todaysCustomers) {
          if (!customer.id) continue;
          const history = await customerService.getClassHistory(user.uid, customer.id);
          // Match by googleEventId
          history.forEach(session => {
            if (session.googleEventId) {
              completedIds.push(session.googleEventId);
            }
          });
        }
        
        setCompletedEventIds(prev => {
          // Merge and deduplicate
          const combined = [...prev, ...completedIds];
          return Array.from(new Set(combined));
        });
      } catch (error) {
        console.error("Failed to fetch completed sessions:", error);
      }
    };
    fetchCompletedSessions();
  }, [selectedDay, user, events, customers]);

  const handleFinishClass = async (event: any, customer?: Customer) => {
    if (!customer || !customer.id) {
      alert("매칭되는 고객이 없습니다. 수업 종료를 위해 먼저 고객 추가가 필요합니다.");
      return;
    }

    const shouldSendNoti = window.confirm(`[${event.summary}] 을 종료하시겠습니까?\n\n'확인'을 누르시면 종료 알림톡이 자동으로 발송됩니다.`);
    
    const recordSession = async () => {
      try {
        if (!user?.uid) return;
        
        await customerService.recordClassSession(user.uid, customer.id!, {
          googleEventId: event.id,
          eventTitle: event.summary || "제목 없음",
          startTime: event.start?.dateTime || event.start?.date || new Date().toISOString(),
          endTime: event.end?.dateTime || event.end?.date || new Date().toISOString()
        });
        
        const updatedCustomers = await customerService.getCustomers(user.uid);
        setCustomers(updatedCustomers);
        
        return true;
      } catch (error) {
        console.error("Failed to record session:", error);
        alert("수업 기록 저장 중 오류가 발생했습니다.");
        return false;
      }
    };

    if (shouldSendNoti) {
      try {
        console.log('Sending AlimTalk notification via external API...');
        
        if (!customer.phone) {
          alert('고객의 연락처(전화번호)가 등록되어 있지 않아 알림톡을 발송할 수 없습니다.');
          return false;
        }

        const response = await fetch('/api/solapi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: customer.phone,
            nickname: customer.nickname || customer.name
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '알림톡 발송 실패');
        }
        
        const success = await recordSession();
        if (success) {
          alert(`알림톡 발송 완료! [${event.summary}] 수업이 성공적으로 종료 및 기록되었습니다.`);
          return true;
        }
      } catch (error) {
        console.error('Failed to send AlimTalk:', error);
        alert('알림톡 발송 중 오류가 발생했지만, 수업 정보를 기록합니다.');
        return await recordSession();
      }
    } else {
      if (window.confirm('알림톡 없이 수업을 종료하시겠습니까?')) {
        const success = await recordSession();
        if (success) {
          alert(`[${event.summary}] 수업 정보가 기록되었습니다.`);
          return true;
        }
      }
    }
    return false;
  };

  const openGoogleCalendar = () => {
    const isPWA = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
    if (isPWA) {
      window.location.href = 'https://calendar.google.com/';
    } else {
      window.open('https://calendar.google.com/', '_blank');
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  if (authLoading) return null;
  if (!user) return <div className="loading-state">인증 확인 중...</div>;

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
      
      const hasUncompletedPastEvent = dayEvents.some(event => {
        const isCompleted = completedEventIds.includes(event.id);
        const isPastEndTime = new Date() > new Date(event.end?.dateTime || event.end?.date || 0);
        return isPastEndTime && !isCompleted && event.summary?.includes(filterKeyword);
      });
      
      cells.push(
        <div 
          key={day} 
          className={`day-cell ${selectedDay === day ? 'selected' : ''} ${isToday ? 'today' : ''} ${hasEvents ? 'has-events' : ''} ${hasUncompletedPastEvent ? 'needs-action-day' : ''}`}
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
            <MonthPicker currentDate={currentDate} onChange={handleMonthChange} />
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
                  const matchingCustomer = customers.find(c => {
                    if (!event.summary || !c.nickname) return false;
                    return event.summary === c.nickname || 
                           event.summary.startsWith(c.nickname + "와") || 
                           event.summary.startsWith(c.nickname + "과") ||
                           event.summary.startsWith(c.nickname + " ");
                  });

                  const isCompleted = completedEventIds.includes(event.id);
                  const isPastEndTime = new Date() > new Date(event.end?.dateTime || event.end?.date || 0);
                  const needsAction = isPastEndTime && !isCompleted && event.summary?.includes(filterKeyword);
                  
                  const getContrastYIQ = (hexcolor: string) => {
                    if (!hexcolor) return '#FFFFFF';
                    const hex = hexcolor.replace("#", "");
                    if (hex.length !== 6) return '#FFFFFF';
                    const r = parseInt(hex.substr(0, 2), 16);
                    const g = parseInt(hex.substr(2, 2), 16);
                    const b = parseInt(hex.substr(4, 2), 16);
                    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                    return (yiq >= 128) ? '#000000' : '#FFFFFF';
                  };
                  
                  return (
                    <div key={idx} className={`agenda-item ${isFocused ? 'focused' : ''} ${matchingCustomer ? 'has-customer' : ''} ${isCompleted ? 'completed' : ''}`}>
                      <div className="agenda-item-body">
                        <div className="time-box">
                          <span className="start">{formatTime(event.start?.dateTime || event.start?.date)}</span>
                          <span className="end">~{formatTime(event.end?.dateTime || event.end?.date)}</span>
                        </div>
                        <div className="info-box">
                          <div className="summary">{event.summary}</div>
                          {event.summary?.includes(filterKeyword) && (
                            isCompleted ? (
                              <div className="completed-badge">
                                <CheckCircle size={14} />
                                <span>수업완료</span>
                              </div>
                            ) : (
                              <button 
                                className={`done-btn ${needsAction ? 'pulse-accent' : ''}`} 
                                onClick={() => {
                                  handleFinishClass(event, matchingCustomer).then(success => {
                                    if (success) setCompletedEventIds(prev => [...prev, event.id]);
                                  });
                                }}
                                disabled={!isPastEndTime}
                              >
                                수업종료 {needsAction && ' (미완료)'}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                      {matchingCustomer && (
                        <div 
                          className="customer-profile clickable"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/customers?search=${encodeURIComponent(matchingCustomer.nickname || matchingCustomer.name)}`);
                          }}
                        >
                          <div 
                            className="avatar-circle"
                            style={{
                              backgroundColor: matchingCustomer.color || '#4f46e5',
                              color: getContrastYIQ(matchingCustomer.color || '#4f46e5')
                            }}
                          >
                            {matchingCustomer.name.charAt(0)}
                          </div>
                          <span className="customer-nickname">{matchingCustomer.nickname}</span>
                        </div>
                      )}
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
