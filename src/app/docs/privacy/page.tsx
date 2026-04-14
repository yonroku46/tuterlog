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

            <section>
              <h3>1. 개인정보 수집 항목 및 방법</h3>
              <p>본 서비스는 로그인 및 핵심 기능 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>
              <ul>
                <li><strong>구글 인증 데이터 (OAuth 2.0)</strong>: 구글 계정 고유 식별자(UID), 이메일 주소, 이름, 프로필 이미지 URL</li>
                <li><strong>서비스 이용 데이터</strong>: 튜터가 직접 등록한 수강생 정보(성함, 연락처, 메모), 수업 예약 및 완료 이력</li>
                <li><strong>자동 수집 항목</strong>: 서비스 접속 IP 정보, 브라우저 정보, 쿠키(로그인 세션 유지용)</li>
              </ul>
            </section>

            <section>
              <h3>2. 개인정보의 이용 목적</h3>
              <p>수집된 개인정보는 다음의 구체적 목적으로만 사용됩니다.</p>
              <ul>
                <li><strong>사용자 인증</strong>: 구글 로그인을 통한 신원 확인 및 서비스 권한 관리</li>
                <li><strong>서비스 제공</strong>: 수강생 관리, 수업 일정 동기화(구글 캘린더 연동), 매출 통계 산출</li>
                <li><strong>고객 서비스</strong>: 서비스 오류 대응 및 기술 지원 문의 처리</li>
              </ul>
            </section>

            <section>
              <h3>3. 구글 사용자 데이터의 활용 및 공유 제한 (Limited Use Policy)</h3>
              <p>TuterLog는 구글 보안 정책을 준수하며 다음과 같이 데이터를 관리합니다.</p>
              <ul>
                <li><strong>데이터 활용 범위</strong>: 구글 캘린더 데이터 (조회 권한)를 통해 수집된 정보는 오직 사용자의 수업 일정 확인 및 관리 서비스 제공을 위해서만 사용됩니다.</li>
                <li><strong>데이터 공유 제한</strong>: 귀하의 구글 계정 데이터를 외부에 판매, 공유 또는 임대하지 않습니다.</li>
                <li><strong>Limited Use 준수 사항</strong>: TuterLog가 Google API로부터 수집한 정보의 사용 및 타 앱으로의 전송은 <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API 서비스 사용자 데이터 정책</a>(제한적 사용 요구사항 포함)을 준수합니다.</li>
                <li>사용자의 데이터를 인공지능 학습 용도로 사용하거나 광고 서비스에 제공하지 않습니다.</li>
              </ul>
              <div className="limited-use-footnote">
                "TuterLog's use and transfer to any other app of information received from Google APIs will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements."
              </div>
            </section>

            <section>
              <h3>4. 개인정보의 보유 및 파기 절차</h3>
              <p>본 서비스는 원칙적으로 서비스 탈퇴 시까지 데이터를보관하며, 탈퇴 시 관련 법령에 따른 보관 의무가 없는 한 모든 데이터를 즉시 파기합니다.</p>
              <p><strong>데이터 삭제 방법</strong>: 사용자는 서비스 내 '설정' 메뉴를 통하거나 <a href="mailto:yr9601@gmail.com">yr9601@gmail.com</a>으로 직접 요청하여 언제든지 서비스 탈퇴 및 데이터 삭제를 진행할 수 있습니다.</p>
            </section>

            <section>
              <h3>5. 개인정보 보호를 위한 보안 조치</h3>
              <p>TuterLog는 구글 클라우드 및 Firebase 인프라를 사용하여 모든 데이터를 암호화하여 저장하며, 무단 접근을 방지하기 위해 엄격한 인증 시스템을 구축하고 있습니다.</p>
            </section>

            <section>
              <h3>6. 개인정보 보호 책임자 안내</h3>
              <p>개인정보 관련 문의나 권리 행사가 필요하신 경우 아래 연락처로 문의해 주시기 바랍니다.</p>
              <div className="contact-footer" style={{ marginTop: '1rem', textAlign: 'left', padding: '1.5rem' }}>
                <strong>이메일</strong>: yr9601@gmail.com
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
