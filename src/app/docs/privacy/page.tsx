import React from 'react';
import { Shield, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import "@/styles/pages/docs.scss";
import Image from 'next/image';

export default function PrivacyPolicyPage() {
  const lastUpdated = "2026년 4월 14일";

  return (
    <div className="public-docs-container">
      <nav className="docs-header-nav">
        <Link href="/" className="back-link">
          <ChevronLeft size={18} />
          <span>홈으로 돌아가기</span>
        </Link>
        <div className="docs-logo">
          <Image src="/assets/icons/favicon.svg" alt="Logo" width={24} height={24} />
          <span>TuterLog</span>
        </div>
      </nav>

      <div className="docs-card-wrapper">
        <header className="docs-hero">
          <div className="icon-box">
            <Shield size={28} />
          </div>
          <h1>개인정보처리방침</h1>
          <p>TuterLog는 사용자의 개인정보권을 존중하며 최고의 보안 수준을 지향합니다.</p>
        </header>

        <div className="docs-body">
          <div className="legal-content-body">
            <div className="last-updated">최종 수정일: {lastUpdated}</div>

            {/* Google Compliance Section - Make this very prominent */}
            <div className="google-disclosure-box" style={{ 
              padding: '1.5rem', 
              backgroundColor: '#f0fdf4', 
              border: '1px solid #bbf7d0', 
              borderRadius: '1rem',
              marginBottom: '2.5rem',
              color: '#166534',
              fontSize: '0.95rem',
              lineHeight: '1.6'
            }}>
              <h3 style={{ color: '#14532d', marginBottom: '0.75rem', fontSize: '1.1rem', border: 'none', padding: 0 }}>
                Google API 유저 데이터 정책 준수 안내
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                TuterLog는 사용자의 구글 계정 데이터(Google user data)를 투명하고 안전하게 처리하며, Google API 서비스 사용자 데이터 정책을 엄격히 준수합니다.
              </p>
              <div style={{ fontWeight: 700, fontStyle: 'italic', color: '#15803d', padding: '1rem', background: 'white', borderRadius: '0.5rem', border: '1px dashed #86efac' }}>
                "TuterLog's use and transfer to any other app of information received from Google APIs will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Google API Services User Data Policy</a>, including the Limited Use requirements."
              </div>
            </div>

            <section>
              <h3>1. 개인정보 수집 항목 및 방법</h3>
              <p>본 서비스는 로그인 및 핵심 기능 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>
              <ul>
                <li><strong>구글 인증 데이터 (OAuth 2.0)</strong>: 구글 계정 고유 식별자(UID), 이메일 주소, 이름, 프로필 이미지 URL (필수)</li>
                <li><strong>구글 캘린더 데이터</strong>: <code>https://www.googleapis.com/auth/calendar.readonly</code> 범위를 통해 조회된 수업 일정 정보 (선택)</li>
                <li><strong>서비스 이용 데이터</strong>: 튜터가 직접 등록한 수강생 정보(성함, 연락처, 메모), 수업 예약 및 완료 이력</li>
                <li><strong>자동 수집 항목</strong>: 서비스 접속 IP 정보, 브라우저 정보, 쿠키(로그인 세션 유지용)</li>
              </ul>
            </section>

            <section>
              <h3>2. 개인정보의 이용 목적</h3>
              <p>수집된 개인정보는 사용자가 요청한 서비스 기능을 제공하기 위한 목적으로만 사용됩니다.</p>
              <ul>
                <li><strong>사용자 인증</strong>: 구글 로그인을 통한 본인 확인 및 서비스 보안 유지</li>
                <li><strong>캘린더 연동 서비스</strong>: 구글 캘린더의 일정을 조회하여 TuterLog 대시보드에 표시하고, 수업 시간 및 매출 통계를 자동 산출</li>
                <li><strong>기능 개선</strong>: 서비스 오류 대응 및 기술 지원 문의 처리</li>
              </ul>
            </section>

            <section>
              <h3>3. 데이터 활용 및 공유 제한 (Limited Use & Sharing)</h3>
              <p>TuterLog는 사용자의 구글 계정 데이터(Google user data)를 타인에게 판매하거나 승인되지 않은 용도로 절대 사용하지 않습니다.</p>
              <ul>
                <li><strong>제3자 공유 금지</strong>: 사용자의 구글 계정 데이터는 원칙적으로 외부에 공유, 판매 또는 임대되지 않습니다. (단, 법적 의무가 있는 경우 제외)</li>
                <li><strong>광고 및 AI 학습 활용 금지</strong>: 수집된 구글 계정 데이터는 광고 플랫폼에 제공되거나 인공지능(AI) 모델의 학습 자료로 활용되지 않습니다.</li>
                <li><strong>전송 제한</strong>: 사용자가 명시적으로 요청한 기능 수행을 위해 필요한 범위를 벗어나 다른 앱으로 구글 계정 데이터를 전송하지 않습니다.</li>
              </ul>
              <div style={{ marginTop: '1rem', padding: '1rem', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
                <p style={{ margin: 0 }}>We use Google user data solely to provide and improve our service. We do not sell, share, or use Google user data for advertising purposes. We do not transfer Google user data to third parties except as necessary to provide our service or comply with legal obligations.</p>
              </div>
            </section>

            <section>
              <h3>4. 개인정보의 보유 및 파기</h3>
              <p>사용자가 서비스를 탈퇴하거나 구글 계정 연동을 해제하는 경우, 관련 수집 데이터는 즉시 또는 법정 보관 기간 내에 안전하게 파기됩니다.</p>
              <p><strong>데이터 삭제 요청</strong>: 우측 하단 설정 메뉴 또는 <a href="mailto:yr9601@gmail.com" style={{ color: '#4f46e5', textDecoration: 'underline' }}>yr9601@gmail.com</a>을 통해 언제든지 데이터 완전 삭제를 요청할 수 있습니다.</p>
            </section>

            <section>
              <h3>5. 보안 조치</h3>
              <p>TuterLog는 데이터 보호를 위해 전송 시 암호화(HTTPS)를 적용하며, 전문적인 클라우드 보안 도구(Firebase Auth & Firestore Security Rules)를 사용하여 데이터 접근 권한을 관리합니다.</p>
            </section>

            <section>
              <h3>6. 문의처</h3>
              <p>개인정보 처리와 관련한 의문사항은 아래의 책임자에게 문의해 주십시오.</p>
              <div className="contact-footer" style={{ marginTop: '1rem', textAlign: 'left', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem' }}>
                <strong>문의</strong>: {lastUpdated && "yr9601@gmail.com"}
              </div>
            </section>
          </div>
        </div>
      </div>

      <footer className="docs-footer">
        &copy; 2026 TuterLog. All rights reserved.
      </footer>
    </div>
  );
}
