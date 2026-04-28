"use client";

import React, { useEffect, useState } from 'react';
import { collection, collectionGroup, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Calendar as CalendarIcon, Clock, User, Phone, CheckCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = React.use(params);
  const slug = unwrappedParams.slug;
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const profileDoc = await getDoc(doc(db, "bookingProfiles", slug));
        
        if (!profileDoc.exists()) {
          setError('해당 예약 페이지를 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        const configData = profileDoc.data();

        if (!configData.isBookingEnabled) {
          setError('현재 예약이 비활성화되어 있습니다.');
          setLoading(false);
          return;
        }

        setTeacher({
          name: configData.teacherName || '선생님',
          duration: configData.bookingDuration || 60,
          email: '', // 이메일은 공개 프로필에 노출하지 않음
          bookingDays: configData.bookingDays || [1, 2, 3, 4, 5],
          bookingStartTime: configData.bookingStartTime || '09:00',
          bookingEndTime: configData.bookingEndTime || '18:00',
          bookingNotice: configData.bookingNotice || ''
        });
      } catch (err) {
        console.error(err);
        setError('정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [slug]);

  // 시간 슬롯 생성 로직 (선생님 설정 기준 + 현재 시간 필터링)
  const generateTimeSlots = () => {
    if (!teacher) return [];
    
    const slots = [];
    const startHour = parseInt(teacher.bookingStartTime.split(':')[0], 10);
    const endHour = parseInt(teacher.bookingEndTime.split(':')[0], 10);
    
    for (let i = startHour; i <= endHour; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
      if (i !== endHour) {
        slots.push(`${i.toString().padStart(2, '0')}:30`);
      }
    }

    if (!selectedDate) return slots;

    const today = new Date();
    const [y, m, d] = selectedDate.split('-').map(Number);
    const selected = new Date(y, m - 1, d);

    // 선택된 날짜가 오늘인 경우
    if (today.getFullYear() === selected.getFullYear() && 
        today.getMonth() === selected.getMonth() && 
        today.getDate() === selected.getDate()) {
      
      const currentHour = today.getHours();
      const currentMinute = today.getMinutes();
      
      return slots.filter(time => {
        const [hour, minute] = time.split(':').map(Number);
        if (hour > currentHour) return true;
        if (hour === currentHour && minute > currentMinute) return true;
        return false;
      });
    }

    return slots;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !name || !phone) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slug,
          date: selectedDate,
          time: selectedTime,
          name,
          phone,
          duration: teacher.duration
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '예약 실패');
      }

      setIsSuccess(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <Loader2 size={40} className="animate-spin" color="#4f46e5" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px' }}>오류</h1>
          <p style={{ color: '#64748b' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center', padding: '50px 40px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', maxWidth: '500px', width: '90%' }}>
          <CheckCircle size={60} color="#10b981" style={{ margin: '0 auto 20px' }} />
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px' }}>예약이 완료되었습니다!</h1>
          <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '30px' }}>
            {selectedDate} {selectedTime}에 {teacher.name} 선생님과의 예약이 확정되었습니다.<br/>
            선생님의 구글 캘린더에 일정이 추가되었으며, 입력하신 연락처({phone})가 전달되었습니다.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '12px 24px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            다른 예약 하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1000px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        {/* 상단 헤더 영역 - 모바일에서는 세로 배치 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9' }}>
          
          {/* 왼쪽 정보 패널 */}
          <div style={{ flex: '1 1 350px', padding: '40px', backgroundColor: '#fafafa', borderRight: '1px solid #f1f5f9' }}>
            <h3 style={{ color: '#64748b', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>TuterLog Booking</h3>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' }}>{teacher.name} 선생님</h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', marginBottom: '15px', fontSize: '15px' }}>
              <Clock size={18} />
              <span>{teacher.duration}분 화상/대면 미팅</span>
            </div>
            
            <p style={{ color: '#475569', lineHeight: '1.6', marginTop: '30px', fontSize: '15px' }}>
              원하시는 날짜와 시간을 선택해 주세요. 예약이 확정되면 구글 캘린더 일정이 자동으로 생성됩니다.
            </p>
            
            {teacher.bookingNotice && (
              <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#eef2ff', borderRadius: '12px', border: '1px solid #c7d2fe' }}>
                <h4 style={{ color: '#4338ca', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>선생님 안내사항</h4>
                <p style={{ color: '#4f46e5', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {teacher.bookingNotice}
                </p>
              </div>
            )}
          </div>

          {/* 오른쪽 선택 패널 */}
          <div style={{ flex: '2 1 500px', padding: '40px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '25px' }}>일정 선택</h2>
            
            <form onSubmit={handleBooking}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>날짜</label>
                  <div style={{ position: 'relative' }}>
                    <CalendarIcon size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                    <input 
                      type="date" 
                      value={selectedDate}
                      onChange={(e) => {
                        const dateVal = e.target.value;
                        if (!dateVal) {
                          setSelectedDate('');
                          return;
                        }
                        
                        // 타임존 이슈 방지를 위해 로컬 시간대로 파싱
                        const [y, m, dNum] = dateVal.split('-').map(Number);
                        const d = new Date(y, m - 1, dNum);
                        
                        if (!teacher.bookingDays.includes(d.getDay())) {
                          alert('해당 요일은 예약이 불가능합니다. 다른 날짜를 선택해주세요.');
                          setSelectedDate('');
                        } else {
                          setSelectedDate(dateVal);
                          // 날짜가 바뀌면 선택된 시간 초기화
                          setSelectedTime('');
                        }
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      style={{ width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', outline: 'none' }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>시간</label>
                  <div style={{ position: 'relative' }}>
                    <Clock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      style={{ width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', outline: 'none', backgroundColor: 'white' }}
                      required
                      disabled={!selectedDate}
                    >
                      <option value="">시간 선택</option>
                      {generateTimeSlots().map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {selectedDate && selectedTime && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <hr style={{ border: 0, borderTop: '1px solid #f1f5f9', margin: '30px 0' }} />
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' }}>예약자 정보</h2>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>이름</label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="이름을 입력해주세요"
                        style={{ width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', outline: 'none' }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '30px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>연락처</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="예) 010-1234-5678"
                        style={{ width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', outline: 'none' }}
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    style={{ width: '100%', padding: '14px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'background-color 0.2s' }}
                  >
                    {isSubmitting ? (
                      <><Loader2 size={18} className="animate-spin" /> 예약 처리 중...</>
                    ) : (
                      '예약 확정하기'
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
