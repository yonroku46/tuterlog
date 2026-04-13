"use client";

import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentHistoryTable from '@/components/dashboard/RecentHistoryTable';
import { Users, Calendar, Coins, Plus, BarChart3 } from 'lucide-react';
import { googleCalendarService } from '@/services/googleCalendarService';
import { customerService } from '@/services/customerService';
import "@/styles/pages/dashboard.scss";
import "@/styles/pages/login.scss";
import React, { useState, useEffect } from 'react';

export default function Home() {
  const { user, googleAccessToken, loginWithGoogle, filterKeyword } = useAuth();
  const [counts, setCounts] = useState({ weekly: 0, monthly: 0, revenue: 0 });
  const [customerCount, setCustomerCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!googleAccessToken || !user?.uid) return;

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
        const [weeklyCount, monthlyEvents, customerList] = await Promise.all([
          googleCalendarService.getEventCount(googleAccessToken, startOfWeek.toISOString(), endOfWeek.toISOString(), filterKeyword),
          googleCalendarService.getEvents(googleAccessToken, startOfMonth.toISOString(), endOfMonth.toISOString()),
          customerService.getCustomers(user.uid)
        ]);

        let calculatedMonthlyCount = 0;

        monthlyEvents.forEach((event: any) => {
          const isTargetEvent = !filterKeyword || (event.summary && event.summary.toLowerCase().includes(filterKeyword.toLowerCase()));
          if (isTargetEvent) {
            calculatedMonthlyCount++;
          }
        });

        // 실제 수업 완료 이력 기반 매출 계산
        const historyPromises = customerList.map(c => 
          c.id ? customerService.getClassHistory(user.uid, c.id) : Promise.resolve([])
        );
        const allHistories = await Promise.all(historyPromises);

        let actualRevenue = 0;

        customerList.forEach((customer, idx) => {
          const history = allHistories[idx];
          const completedThisMonth = history.filter(session => {
            return session.startTime >= startOfMonth.toISOString() && session.startTime <= endOfMonth.toISOString();
          });

          if (completedThisMonth.length > 0 && customer.unitPrice) {
            actualRevenue += (completedThisMonth.length * customer.unitPrice);
          }
        });

        setCounts({ weekly: weeklyCount, monthly: calculatedMonthlyCount, revenue: actualRevenue });
        setCustomerCount(customerList.length);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };

    fetchStats();
  }, [googleAccessToken, filterKeyword, user]);

  useEffect(() => {
    if (!user) {
      document.title = `로그인 | TuterLog`;
    } else {
      document.title = `대시보드 | TuterLog`;
    }
  }, [user]);

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
        </header>

        <section className="stats-grid">
          <StatsCard 
            title="전체 고객" 
            value={`${customerCount}명`} 
            icon={<Users size={24} />} 
            trend="현재 관리 중" 
            trendUp={true} 
          />
          <StatsCard 
            title="이번 주 스케줄" 
            value={`${counts.weekly.toString()}건`} 
            icon={<Calendar size={24} />} 
            trend="현재 기준" 
            trendUp={true} 
          />
          <StatsCard 
            title="이번 달 스케줄" 
            value={`${counts.monthly.toString()}건`} 
            icon={<BarChart3 size={24} />} 
            trend="현재 기준" 
            trendUp={true} 
          />
          <StatsCard 
            title="매출 현황" 
            value={counts.revenue > 0 ? `${counts.revenue.toLocaleString()}원` : "0원"}
            icon={<Coins size={24} />} 
            trend="이번 달 누적 (완료 기준)" 
            trendUp={true} 
          />
        </section>

        <section className="section-container">
          <RecentHistoryTable />
        </section>
    </div>
  );
}
