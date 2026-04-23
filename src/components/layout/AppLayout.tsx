"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Sidebar from './Sidebar';
import "@/styles/pages/dashboard.scss";
import "@/styles/layout/sidebar.scss";
import { Menu, X, Loader2 } from 'lucide-react';

import Image from 'next/image';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-brand">
          <Image 
            src="/assets/icons/favicon.svg" 
            alt="TuterLog Logo" 
            width={64} 
            height={64}
            className="loading-logo"
            priority
          />
          TuterLog
        </div>
        <Loader2 className="loader-spinner" size={40} />
        <p className="loading-text">기분 좋은 하루를 준비 중입니다...</p>
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className={`dashboard-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="mobile-header">
        <Link href="/my/dashboard" className="logo-link">
          <Image 
            src="/assets/icons/favicon.svg" 
            alt="TuterLog Logo" 
            width={24} 
            height={24}
          />
        </Link>
        <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <div className={`sidebar-wrapper ${isSidebarOpen ? 'active' : ''}`}>
        <Sidebar onItemClick={() => setIsSidebarOpen(false)} />
      </div>

      <main className="dashboard-main-content">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
