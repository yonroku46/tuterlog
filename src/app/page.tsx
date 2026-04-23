"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentHistoryTable from '@/components/dashboard/RecentHistoryTable';
import { Users, Calendar, Coins, Plus, BarChart3 } from 'lucide-react';
import { googleCalendarService } from '@/services/googleCalendarService';
import { customerService } from '@/services/customerService';
import "@/styles/pages/dashboard.scss";
import "@/styles/pages/login.scss";

export default function Home() {
  const { user, googleAccessToken, loginWithGoogle, filterKeyword } = useAuth();
  const [counts, setCounts] = useState({ weekly: 0, monthly: 0, revenue: 0 });
  const [customerCount, setCustomerCount] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchStats = async () => {
      if (!googleAccessToken || !user?.uid) return;

      const startOfWeek = new Date(currentDate);
      const now = new Date();
      const isCurrentMonth = currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear();
      
      const weeklyRefDate = isCurrentMonth ? now : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      startOfWeek.setTime(weeklyRefDate.getTime());
      startOfWeek.setDate(weeklyRefDate.getDate() - weeklyRefDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

      try {
        const [weeklyCount, monthlyEvents, customers, monthlyStats] = await Promise.all([
          googleCalendarService.getEventCount(googleAccessToken, startOfWeek.toISOString(), new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(), filterKeyword),
          googleCalendarService.getEvents(googleAccessToken, startOfMonth.toISOString(), endOfMonth.toISOString()),
          customerService.getCustomers(user.uid),
          customerService.getMonthlyStats(user.uid, currentDate.getFullYear(), currentDate.getMonth())
        ]);

        let calculatedMonthlyCount = 0;
        monthlyEvents.forEach((event: any) => {
          const isTargetEvent = !filterKeyword || (event.summary && event.summary.toLowerCase().includes(filterKeyword.toLowerCase()));
          if (isTargetEvent) calculatedMonthlyCount++;
        });

        setCounts({ 
          weekly: weeklyCount, 
          monthly: calculatedMonthlyCount, 
          revenue: monthlyStats.totalRevenue 
        });
        setCustomerCount(customers.length);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };

    fetchStats();
  }, [googleAccessToken, filterKeyword, user, currentDate]);

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
          <p className="footer-note">TuterLog는 선생님과 학생의 더 효율적인 클래스 관리를 돕는 스마트 매니저입니다.</p>
          <div className="legal-links">
            <Link href="/docs/terms">서비스 이용약관</Link>
            <span className="divider">|</span>
            <Link href="/docs/privacy" className="bold">개인정보처리방침</Link>
          </div>
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
      </header>

      <section className="stats-grid">
        <StatsCard title="전체 고객" value={`${customerCount}명`} icon={<Users size={24} />} trend="현재 관리 중" trendUp={true} />
        <StatsCard title="이번 주 스케줄" value={`${counts.weekly}건`} icon={<Calendar size={24} />} trend="현재 기준" trendUp={true} />
        <StatsCard title="이번 달 스케줄" value={`${counts.monthly}건`} icon={<BarChart3 size={24} />} trend="현재 기준" trendUp={true} />
        <StatsCard title="매출 현황" value={counts.revenue > 0 ? `${counts.revenue.toLocaleString()}원` : "0원"} icon={<Coins size={24} />} trend="이번 달 누적 (완료 기준)" trendUp={true} />
      </section>

      <section className="section-container">
        <RecentHistoryTable />
      </section>
    </div>
  );
}
