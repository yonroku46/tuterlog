"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Check, X, ArrowRight, ChevronDown } from 'lucide-react';
import LandingNav from '@/components/layout/LandingNav';
import LandingFooter from '@/components/layout/LandingFooter';
import "@/styles/pages/pricing.scss";

const FREE_FEATURES = [
  { included: true,  text: '구글 캘린더 연동' },
  { included: true,  text: '학생 등록 (최대 5명)' },
  { included: true,  text: '수업 완료 기록' },
  { included: true,  text: '월간 매출 통계' },
  { included: false, text: '카카오 알림톡 발송' },
  { included: false, text: '무제한 학생 등록' },
  { included: false, text: '우선 고객 지원' },
];

const PRO_FEATURES = [
  { included: true, text: '구글 캘린더 연동' },
  { included: true, text: '무제한 학생 등록' },
  { included: true, text: '수업 완료 기록' },
  { included: true, text: '월간 매출 통계' },
  { included: true, text: '카카오 알림톡 자동 발송' },
  { included: true, text: '이메일 우선 지원' },
  { included: true, text: '신규 기능 우선 체험' },
];

const FAQS = [
  {
    q: '무료 플랜에서 유료로 업그레이드하면 기존 데이터가 유지되나요?',
    a: '네, 기존에 등록한 학생 정보와 수업 이력은 그대로 유지됩니다. 업그레이드 즉시 프로 기능이 활성화되며, 데이터 이전 없이 바로 사용 가능합니다.',
  },
  {
    q: '카카오 알림톡은 어떻게 작동하나요?',
    a: '수업 페이지에서 "수업 종료" 버튼을 누르면, 등록된 학생 연락처로 카카오 알림톡이 자동 발송됩니다. 학생이 카카오톡을 사용하지 않는 경우 SMS로 대체 발송됩니다. 발송 비용은 월정액에 포함되어 있습니다.',
  },
  {
    q: '언제든지 해지할 수 있나요?',
    a: '네, 언제든지 해지 가능합니다. 해지 요청 시 현재 결제 주기가 끝날 때까지 프로 기능이 유지되며, 이후 자동으로 무료 플랜으로 전환됩니다. 위약금은 없습니다.',
  },
  {
    q: '연간 결제 후 중도 해지 시 환불이 되나요?',
    a: '연간 플랜 결제 후 7일 이내 요청 시 전액 환불 가능합니다. 7일 이후에는 잔여 기간에 대한 부분 환불이 가능하며, 자세한 내용은 이용약관을 참고해 주세요.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (bodyRef.current) {
      setHeight(open ? bodyRef.current.scrollHeight : 0);
    }
  }, [open]);

  return (
    <div className={`pricing-faq-item${open ? ' open' : ''}`}>
      <button className="pricing-faq-btn" onClick={() => setOpen(!open)}>
        <span className="pricing-faq-q">{q}</span>
        <span className={`pricing-faq-icon${open ? ' open' : ''}`}>
          <ChevronDown size={18} />
        </span>
      </button>
      <div
        className="pricing-faq-body"
        style={{ height: `${height}px` }}
      >
        <div ref={bodyRef} className="pricing-faq-answer">
          {a}
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const { user } = useAuth();
  const [isAnnual, setIsAnnual] = useState(true);

  const monthlyPrice = 13200;
  const annualMonthly = Math.floor(monthlyPrice * 0.75);
  const ctaHref = user ? '/my/dashboard' : '/login';

  return (
    <div className="pricing-page">
      <LandingNav />

      {/* HEADER */}
      <header className="pricing-header">
        <p className="pricing-eyebrow">요금제</p>
        <h1 className="pricing-title">
          지금 바로 시작하고,<br />필요할 때 확장하세요
        </h1>
        <p className="pricing-subtitle">
          무료 플랜으로 체험하고 튜터 업무에 맞으면<br />
          한 달에 커피 두 잔 값으로 모든 기능을 쓰세요.
        </p>

        <div className="pricing-toggle-wrap">
          <span className={`pricing-toggle-label${!isAnnual ? ' active' : ''}`}>월간 결제</span>
          <button
            className={`pricing-toggle-btn${isAnnual ? ' on' : ''}`}
            onClick={() => setIsAnnual(v => !v)}
            aria-label="연간/월간 전환"
          >
            <div className="pricing-toggle-knob" />
          </button>
          <span className={`pricing-toggle-label${isAnnual ? ' active' : ''}`}>
            연간 결제
            <span className="pricing-toggle-badge">25% 할인</span>
          </span>
        </div>
      </header>

      {/* CARDS */}
      <div className="pricing-cards-wrap">

        {/* FREE */}
        <div className="pricing-card">
          <p className="pricing-plan-name">스타터</p>
          <p className="pricing-plan-desc">
            막 시작한 튜터에게 딱 맞는 플랜입니다.<br />
            가입 즉시 핵심 기능을 무료로 사용하세요.
          </p>
          <div className="pricing-price-wrap">
            <span className="pricing-amount free-amount">₩0</span>
            <span className="pricing-period">/ 월</span>
          </div>
          <p className="pricing-price-note">신용카드 없이 시작 · 영구 무료</p>
          <div className="pricing-divider" />
          <Link href={ctaHref} className="pricing-cta-btn free-btn">
            무료로 시작하기
          </Link>
          <p className="pricing-features-label">포함된 기능</p>
          <ul className="pricing-features-list">
            {FREE_FEATURES.map((f, i) => (
              <li key={i} className="pricing-feature-item">
                {f.included ? (
                  <span className="pricing-feature-check"><Check size={10} strokeWidth={3} /></span>
                ) : (
                  <span className="pricing-feature-x"><X size={10} strokeWidth={3} /></span>
                )}
                <span className={`pricing-feature-text${!f.included ? ' muted' : ''}`}>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* PRO */}
        <div className="pricing-card featured">
          <div className="pricing-card-badge">가장 많이 선택</div>
          <p className="pricing-plan-name">프로</p>
          <p className="pricing-plan-desc">
            학생이 6명 이상이거나 알림톡을 쓰고 싶다면<br />
            이 플랜 하나로 모든 게 해결됩니다.
          </p>
          <div className="pricing-price-wrap">
            <span className="pricing-currency">₩</span>
            <span className="pricing-amount">
              {isAnnual ? annualMonthly.toLocaleString() : monthlyPrice.toLocaleString()}
            </span>
            <span className="pricing-period">/ 월</span>
          </div>
          <p className="pricing-price-note">
            {isAnnual
              ? `연 ₩${(annualMonthly * 12).toLocaleString()} 청구 · ₩${((monthlyPrice - annualMonthly) * 12).toLocaleString()} 절약`
              : '매월 자동 청구 · 언제든 해지 가능'}
          </p>
          <div className="pricing-divider" />
          <Link href={ctaHref} className="pricing-cta-btn pro-btn">
            7일 무료체험 시작 →
          </Link>
          <p className="pricing-features-label">포함된 기능</p>
          <ul className="pricing-features-list">
            {PRO_FEATURES.map((f, i) => (
              <li key={i} className="pricing-feature-item">
                <span className="pricing-feature-check"><Check size={10} strokeWidth={3} /></span>
                <span className="pricing-feature-text">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* FAQ */}
      <section className="pricing-faq">
        <h2 className="pricing-faq-title">자주 묻는 질문</h2>
        {FAQS.map((faq, i) => (
          <FaqItem key={i} q={faq.q} a={faq.a} />
        ))}
      </section>

      {/* CTA */}
      <div className="pricing-cta-banner">
        <div className="pricing-cta-box">
          <h2 className="pricing-cta-title">지금 바로 무료로 시작하세요</h2>
          <p className="pricing-cta-sub">카드 등록 없이 스타터 플랜을 바로 사용할 수 있습니다.</p>
          <div className="pricing-cta-actions">
            <Link href={ctaHref} className="pricing-cta-primary">
              무료로 시작하기 <ArrowRight size={18} />
            </Link>
            <Link href="/contact" className="pricing-cta-secondary">
              도입 문의하기
            </Link>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
