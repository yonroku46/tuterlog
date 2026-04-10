"use client";

import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import StatsCard from '@/components/dashboard/StatsCard';
import CustomerTable from '@/components/dashboard/CustomerTable';
import { Users, Calendar, DollarSign, Plus, BarChart3 } from 'lucide-react';
import { googleCalendarService } from '@/services/googleCalendarService';
import "@/styles/pages/dashboard.scss";
import "@/styles/pages/login.scss";
import React, { useState, useEffect } from 'react';

export default function Home() {
  const { user, googleAccessToken, loginWithGoogle, filterKeyword } = useAuth();
  const [counts, setCounts] = useState({ weekly: 0, monthly: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      if (!googleAccessToken) return;

      const now = new Date();
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      try {
        const [weeklyCount, monthlyCount] = await Promise.all([
          googleCalendarService.getEventCount(googleAccessToken, startOfWeek.toISOString(), endOfWeek.toISOString(), filterKeyword),
          googleCalendarService.getEventCount(googleAccessToken, startOfMonth.toISOString(), endOfMonth.toISOString(), filterKeyword)
        ]);
        setCounts({ weekly: weeklyCount, monthly: monthlyCount });
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };

    fetchStats();
  }, [googleAccessToken, filterKeyword]);

  if (!user) {
    return (
      <main className="login-container">
        <div className="login-card">
          <div className="logo">
            <h1>TuterLog</h1>
            <p>언어 교육 스마트 매니저</p>
          </div>
          
          <div className="login-methods">
            <button className="login-btn google" onClick={loginWithGoogle}>
              <Image src="/assets/icons/google.svg" alt="Google" width={22} height={22} />
              Google 계정으로 로그인
            </button>
          </div>

          <p className="footer-note">
            TuterLog는 선생님과 학생의 더 효율적인<br />
            클래스 관리를 돕는 스마트 매니저입니다.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="home-dashboard">
      <header className="header">
          <div className="title-area">
            <h1>대시보드</h1>
            <p>환영합니다, {user.displayName}님!</p>
          </div>
          <div className="actions">
            <button className="btn-primary">
              <Plus size={20} />
              고객 추가
            </button>
          </div>
        </header>

        <section className="stats-grid">
          <StatsCard 
            title="전체 고객" 
            value="1,284" 
            icon={<Users size={24} />} 
            trend="지난달 대비 12.5%" 
            trendUp={true} 
          />
          <StatsCard 
            title="이번 주 스케줄" 
            value={counts.weekly.toString()} 
            icon={<Calendar size={24} />} 
            trend="현재 기준" 
            trendUp={true} 
          />
          <StatsCard 
            title="이번 달 스케줄" 
            value={counts.monthly.toString()} 
            icon={<BarChart3 size={24} />} 
            trend="현재 기준" 
            trendUp={true} 
          />
          <StatsCard 
            title="매출 현황" 
            value="₩45,280,000" 
            icon={<DollarSign size={24} />} 
            trend="지난달 대비 8.1%" 
            trendUp={true} 
          />
        </section>

        <section className="section-container">
          <CustomerTable />
        </section>
    </div>
  );
}
