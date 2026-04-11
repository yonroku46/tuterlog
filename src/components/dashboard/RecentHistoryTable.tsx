"use client";

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { customerService, ClassSession } from '@/services/customerService';
import DataTable, { Column } from '@/components/ui/DataTable';

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
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
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

  const columns: Column<ClassSession>[] = [
    {
      header: '날짜',
      key: 'startTime',
      sortable: true,
      render: (session) => (
        <span className="date-text">{formatShortDate(session.startTime)}</span>
      )
    },
    {
      header: '수업 내용',
      key: 'eventTitle',
      sortable: true,
      render: (session) => (
        <div className="summary-cell">
          <div className="session-title">{session.eventTitle}</div>
        </div>
      )
    },
    {
      header: '진행 시간',
      key: 'duration',
      render: (session) => (
        <div className="time-info">
          <span>{formatSessionTime(session.startTime)} ~ {formatSessionTime(session.endTime)}</span>
        </div>
      )
    },
    {
      header: '완료 시각',
      key: 'completedAtDate',
      sortable: true,
      className: 'date-cell',
      render: (session) => (
        session.completedAt?.toDate 
          ? session.completedAt.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
          : '-'
      )
    }
  ];

  return (
    <div className="content-card">
      <div className="card-header">
        <div className="header-title">
          <CalendarIcon size={18} className="header-icon" />
          <h2>최근 수업 이력</h2>
        </div>
        <Link href="/customers" className="view-all">학생별 이력 보기</Link>
      </div>
      <DataTable
        data={sortedSessions}
        columns={columns}
        loading={loading}
        sortConfig={sortConfig}
        onSort={requestSort}
        emptyMessage="아직 기록된 수업 이력이 없습니다."
        rowKey={(session, index) => session.id || index}
      />
      {!loading && sortedSessions.length === 0 && (
        <div className="empty-state-action" style={{ textAlign: 'center', paddingBottom: '2rem' }}>
          <Link href="/calendar" className="empty-action" style={{ 
            display: 'inline-block',
            padding: '0.6rem 1.25rem',
            background: '#f5f6ff',
            color: '#6366f1',
            borderRadius: '0.75rem',
            fontWeight: 700,
            fontSize: '0.85rem'
           }}>캘린더에서 수업 종료하기</Link>
        </div>
      )}
    </div>
  );
};

export default RecentHistoryTable;
