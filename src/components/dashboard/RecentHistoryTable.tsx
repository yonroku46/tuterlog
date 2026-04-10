"use client";

import React, { useState, useEffect } from 'react';
import { Clock, Calendar as CalendarIcon, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { customerService, ClassSession } from '@/services/customerService';

const RecentHistoryTable = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'startTime', direction: 'desc' });

  useEffect(() => {
    const fetchRecentSessions = async () => {
      if (!user) return;
      try {
        const data = await customerService.getRecentSessions(user.uid);
        setSessions(data);
      } catch (error) {
        console.error("Error fetching recent sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentSessions();
  }, [user]);

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatSessionTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={12} className="sort-icon inactive" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="sort-icon active" /> : <ChevronDown size={12} className="sort-icon active" />;
  };

  const sortedSessions = React.useMemo(() => {
    const sortableSessions = [...sessions];
    if (sortConfig !== null) {
      sortableSessions.sort((a: any, b: any) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'completedAtDate') {
          aValue = a.completedAt?.toDate?.() || 0;
          bValue = b.completedAt?.toDate?.() || 0;
        } else {
          aValue = a[sortConfig.key] || '';
          bValue = b[sortConfig.key] || '';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableSessions;
  }, [sessions, sortConfig]);

  return (
    <div className="content-card">
      <div className="card-header">
        <div className="header-title">
          <CalendarIcon size={18} className="header-icon" />
          <h2>최근 수업 이력</h2>
        </div>
        <Link href="/customers" className="view-all">학생별 이력 보기</Link>
      </div>
      <div className="table-responsive">
        <table className="customer-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('startTime')} className="sortable">
                <div className="th-content">날짜 {getSortIcon('startTime')}</div>
              </th>
              <th onClick={() => requestSort('eventTitle')} className="sortable">
                <div className="th-content">수업 내용 {getSortIcon('eventTitle')}</div>
              </th>
              <th>진행 시간</th>
              <th onClick={() => requestSort('completedAtDate')} className="sortable">
                <div className="th-content">완료 시각 {getSortIcon('completedAtDate')}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>이력을 불러오는 중...</td></tr>
            ) : sortedSessions.length > 0 ? (
              sortedSessions.map((session, index) => (
                <tr key={session.id || index}>
                  <td>
                    <div className="date-badge">
                      {formatShortDate(session.startTime)}
                    </div>
                  </td>
                  <td>
                    <div className="summary-cell">
                      <div className="session-title">{session.eventTitle}</div>
                    </div>
                  </td>
                  <td>
                    <div className="time-info">
                      <Clock size={12} />
                      <span>{formatSessionTime(session.startTime)} ~ {formatSessionTime(session.endTime)}</span>
                    </div>
                  </td>
                  <td className="date-cell">
                    {session.completedAt?.toDate 
                      ? session.completedAt.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                      : '-'
                    }
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                  <div className="empty-state">
                    <p>아직 기록된 수업 이력이 없습니다.</p>
                    <Link href="/calendar" className="empty-action">캘린더에서 수업 종료하기</Link>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentHistoryTable;
