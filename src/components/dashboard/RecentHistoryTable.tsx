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
  
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  useEffect(() => {
    const fetchMonthlySessions = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await customerService.getMonthSessions(user.uid, selectedYear, selectedMonth);
        setSessions(data);
      } catch (error) {
        console.error("Error fetching monthly sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlySessions();
  }, [user, selectedYear, selectedMonth]);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i);

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

  const handleToday = () => {
    const today = new Date();
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
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
        <div className="history-filter-area">
          <div className="title-filter-group">
            <div className="header-title">
              <CalendarIcon size={18} className="header-icon" />
              <h2>수업 이력</h2>
            </div>
            
            <div className="header-extra">
              <Link href="/customers" className="view-all">학생별 보기</Link>
            </div>

            <div className="filter-controls">
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {years.map(y => <option key={y} value={y}>{y}년</option>)}
              </select>

              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {months.map(m => <option key={m} value={m}>{m + 1}월</option>)}
              </select>
              
              <button className="btn-today" onClick={handleToday}>이번 달</button>
            </div>
          </div>
        </div>
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
    </div>
  );
};

export default RecentHistoryTable;
