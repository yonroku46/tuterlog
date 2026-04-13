"use client";

import { Users, Calendar, Settings, LogOut, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import Image from 'next/image';

interface SidebarProps {
  onItemClick?: () => void;
}

const Sidebar = ({ onItemClick }: SidebarProps) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  const navItems = [
    { icon: <LayoutGrid size={20} />, label: '대시보드', href: '/' },
    { icon: <Users size={20} />, label: '고객 관리', href: '/customers' },
    { icon: <Calendar size={20} />, label: '일정 확인', href: '/calendar' },
    { icon: <Settings size={20} />, label: '설정', href: '/settings' },
  ];

  return (
    <aside className="sidebar">
      <Link href="/">
        <div className="logo">
          <Image 
            src="/assets/icons/favicon.svg" 
            alt="TuterLog Logo" 
            width={32} 
            height={32}
            className="logo-icon"
          />
          <span>TuterLog</span>
        </div>
      </Link>

      <nav className="nav">
        {navItems.map((item, index) => (
          <Link 
            key={index} 
            href={item.href}
            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            onClick={onItemClick}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {user && (
        <div className="user-section">
          <div className="user-info">
            <div className="name">{user.displayName || 'User'}</div>
            <div className="email">{user.email}</div>
          </div>
          <button className="logout-btn" onClick={logout} title="로그아웃">
            <LogOut size={20} />
          </button>
        </div>
      )}
      <div className="sidebar-footer">
        <Link href="/docs/terms" onClick={onItemClick}>약관</Link>
        <Link href="/docs/privacy" onClick={onItemClick} className="legal-bold">개인정보</Link>
      </div>
    </aside>
  );
};

export default Sidebar;
