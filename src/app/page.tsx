"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { 
  Calendar, Users, BarChart3,
  ArrowRight, CheckCircle2, Zap,
  Shield, Bell
} from 'lucide-react';
import LandingNav from '@/components/layout/LandingNav';
import LandingFooter from '@/components/layout/LandingFooter';
import "@/styles/pages/landing.scss";

const FEATURES = [
  {
    icon: <Calendar size={24} />,
    title: '구글 캘린더 자동 연동',
    desc: '기존 구글 캘린더 일정을 그대로 가져옵니다. 별도 입력 없이 수업 일정이 자동으로 동기화됩니다.',
  },
  {
    icon: <Users size={24} />,
    title: '학생 정보 통합 관리',
    desc: '학생별 수업 이력, 단가, 메모를 한 곳에서 관리하세요. 클릭 한 번으로 전체 히스토리 확인이 가능합니다.',
  },
  {
    icon: <BarChart3 size={24} />,
    title: '매출 자동 집계',
    desc: '수업 완료 버튼 하나로 매출이 자동 계산됩니다. 월별 통계로 수익 흐름을 한눈에 파악하세요.',
  },
  {
    icon: <Bell size={24} />,
    title: '수업 종료 알림톡',
    desc: '수업이 끝나면 학생에게 카카오 알림톡이 자동 발송됩니다. 깔끔한 소통이 가능합니다.',
  },
  {
    icon: <Shield size={24} />,
    title: '안전한 데이터 보호',
    desc: 'Firebase 기반의 강력한 보안으로 학생 정보와 수업 기록을 안전하게 보관합니다.',
  },
  {
    icon: <Zap size={24} />,
    title: '3초 만에 로그인',
    desc: '구글 계정 하나면 끝. 별도 회원가입 없이 지금 바로 시작할 수 있습니다.',
  },
];

const STEPS = [
  { num: '01', title: '구글 계정으로 로그인', desc: '기존 구글 계정으로 3초 만에 시작합니다.' },
  { num: '02', title: '캘린더 연동', desc: '구글 캘린더 권한 허용 한 번으로 수업 일정이 자동 동기화됩니다.' },
  { num: '03', title: '수업 관리 시작', desc: '학생 등록, 수업 기록, 매출 통계를 바로 활용하세요.' },
];

const STATS = [
  { label: '전체 학생', value: '12명', fill: '70%' },
  { label: '이번 주 수업', value: '8건', fill: '55%' },
  { label: '이번 달 매출', value: '320,000원', fill: '80%' },
];

const AVATARS = [
  { src: '/assets/avatars/avatar1.webp' },
  { src: '/assets/avatars/avatar2.webp' },
  { src: '/assets/avatars/avatar3.webp' },
  { src: '/assets/avatars/avatar4.webp' },
];

const NAV_ITEMS = ['대시보드', '고객 관리', '일정 확인', '설정'];

export default function LandingPage() {
  const { user } = useAuth();

  const ctaHref = user ? '/my/dashboard' : '/login';
  const ctaLabel = user ? '대시보드로 가기' : '무료로 시작하기';

  return (
    <div className="landing-page">
      <LandingNav />

      {/* ── HERO ── */}
      <section className="landing-hero">
        <div className="landing-hero-badge">
          <span className="landing-hero-badge-dot" />
          언어 교육 전문 스마트 매니저
        </div>
        <h1 className="landing-hero-title">
          수업은 집중하고,<br />
          관리는 <em className="landing-hero-title-em">TuterLog</em>에게
        </h1>
        <p className="landing-hero-sub">
          구글 캘린더 연동부터 학생 관리, 매출 통계까지.<br />
          튜터에게 꼭 필요한 기능만 담았습니다.
        </p>
        <div className="landing-hero-actions">
          <Link href={ctaHref} className="landing-hero-btn-primary">
            {ctaLabel} <ArrowRight size={18} />
          </Link>
          <Link href="/docs/terms" className="landing-hero-btn-secondary">
            <CheckCircle2 size={16} /> 무료 · 광고 없음
          </Link>
        </div>
        <div className="landing-hero-proof">
          <div className="landing-hero-proof-avatars">
            {AVATARS.map((a, i) => (
              <div key={i} className="landing-hero-proof-avatar">
                <Image 
                  src={a.src} 
                  alt={`User avatar ${i + 1}`} 
                  width={32} 
                  height={32} 
                  className="rounded-full"
                />
              </div>
            ))}
          </div>
          <p className="landing-hero-proof-text">
            <strong>현직 튜터들</strong>이 선택한 스마트 매니저
          </p>
        </div>
      </section>

      {/* ── APP MOCKUP ── */}
      <div className="landing-mockup">
        <div className="landing-mockup-window">
          <div className="landing-mockup-bar">
            <div className="landing-mockup-dot" />
            <div className="landing-mockup-dot" />
            <div className="landing-mockup-dot" />
            <div className="landing-mockup-url">tuterlog.com/my/dashboard</div>
          </div>
          <div className="landing-mockup-body">
            <div className="landing-mock-sidebar">
              <div className="landing-mock-logo">
                <div className="landing-mock-logo-icon" />
                TuterLog
              </div>
              {NAV_ITEMS.map((item, i) => (
                <div key={i} className={`landing-mock-nav-item${i === 0 ? ' active' : ''}`}>
                  <div className="landing-mock-nav-icon" />
                  {item}
                </div>
              ))}
            </div>
            <div className="landing-mock-content">
              <div className="landing-mock-header">
                <div>
                  <div className="landing-mock-title">대시보드</div>
                  <div className="landing-mock-subtitle">환영합니다 👋</div>
                </div>
                <div className="landing-mock-action-btn" />
              </div>
              <div className="landing-mock-stats">
                {STATS.map((s, i) => (
                  <div key={i} className="landing-stat-card">
                    <div className="landing-stat-label">{s.label}</div>
                    <div className="landing-stat-value">{s.value}</div>
                    <div className="landing-stat-bar">
                      <div className="landing-stat-bar-fill" style={{ width: s.fill }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="landing-mock-table">
                {[
                  { color: '#6366f1' },
                  { color: '#8b5cf6' },
                  { color: '#06b6d4' },
                ].map((row, i) => (
                  <div key={i} className="landing-mock-row">
                    <div className="landing-mock-row-avatar" style={{ background: row.color }} />
                    <div className="landing-mock-row-info">
                      <div className="landing-mock-row-name" />
                      <div className="landing-mock-row-sub" />
                    </div>
                    <div className="landing-mock-row-badge" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="landing-features">
        <div className="landing-features-header">
          <p className="landing-features-eyebrow">핵심 기능</p>
          <h2 className="landing-features-title">수업에만 집중할 수 있도록</h2>
          <p className="landing-features-subtitle">복잡한 수작업을 없애고 필요한 기능만 담았습니다.</p>
        </div>
        <div className="landing-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="landing-feature-card">
              <div className="landing-feature-icon">{f.icon}</div>
              <h3 className="landing-feature-title">{f.title}</h3>
              <p className="landing-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="landing-how">
        <div className="landing-how-inner">
          <p className="landing-how-eyebrow">시작하기</p>
          <h2 className="landing-how-title">3단계로 바로 시작하세요</h2>
          <div className="landing-how-steps">
            {STEPS.map((s, i) => (
              <div key={i} className="landing-how-step">
                <div className="landing-step-num">{s.num}</div>
                <h4 className="landing-step-title">{s.title}</h4>
                <p className="landing-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="landing-cta">
        <div className="landing-cta-box">
          <h2 className="landing-cta-title">지금 바로 시작해보세요</h2>
          <p className="landing-cta-sub">무료로 사용할 수 있습니다. 신용카드 없이.</p>
          <Link href={ctaHref} className="landing-cta-btn">
            {ctaLabel} <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
