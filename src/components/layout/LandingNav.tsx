"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function LandingNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="landing-nav-inner">
        <Link href="/" className="landing-nav-logo">
          <Image src="/assets/icons/favicon.svg" alt="TuterLog" width={28} height={28} />
          TuterLog
        </Link>
        <div className="landing-nav-links">
          <Link 
            href="/pricing" 
            className="landing-nav-link"
            style={isActive('/pricing') ? { color: '#6366f1', fontWeight: 600 } : {}}
          >
            요금제
          </Link>
          <Link 
            href="/contact" 
            className="landing-nav-link"
            style={isActive('/contact') ? { color: '#6366f1', fontWeight: 600 } : {}}
          >
            문의하기
          </Link>
          {user ? (
            <>
              <span className="landing-nav-welcome">안녕하세요, {user.displayName}님</span>
              <Link href="/my/dashboard" className="landing-nav-cta">
                <LayoutDashboard size={15} />
                대시보드
              </Link>
            </>
          ) : (
            <Link href="/login" className="landing-nav-cta">시작하기</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
