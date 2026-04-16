import React from 'react';
import { FileText, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import "@/styles/pages/docs.scss";
import Image from 'next/image';

export default function TermsOfServicePage() {
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
        <header className="docs-hero" style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)' }}>
          <div className="icon-box">
            <FileText size={28} />
          </div>
          <h1>서비스 이용약관</h1>
          <p>TuterLog 서비스 이용에 따른 이용자와 회사 간의 권리, 의무 및 책임 사항을 규정합니다.</p>
        </header>

        <div className="docs-body">
          <div className="legal-content-body">
            <div className="last-updated">최종 수정일: {lastUpdated}</div>

            <section>
              <h3>1. 약관의 승낙</h3>
              <p>본 서비스를 이용함으로써 귀하는 본 약관에 동의하게 됩니다. 본 약관은 이용자가 서비스를 이용함과 동시에 효력이 발생합니다.</p>
            </section>

            <section>
              <h3>2. 서비스의 목적 및 성격</h3>
              <p>TuterLog는 개인 튜터(과외 교사 등)의 수업 관리 및 매출 통계 관리를 돕는 보조 도구입니다. 본 서비스는 구글 캘린더 읽기 권한을 활용하여 효율적인 데이터 시각화를 제공하며, 그 외의 다른 용도로는 사용되지 않습니다.</p>
            </section>

            <section>
              <h3>3. 이용 자격 및 계정 관리</h3>
              <ul>
                <li>사용자는 구글 계정을 통해 본 서비스에 가입할 수 있습니다.</li>
                <li>본 서비스의 원활한 이용을 위해서는 구글 캘린더 읽기 권한 승인이 필요할 수 있습니다.</li>
                <li>사용자는 자신의 계정 정보를 안전하게 관리해야 하며, 타인에게 양도하거나 대여할 수 없습니다.</li>
              </ul>
            </section>

            <section>
              <h3>4. 이용자의 의무</h3>
              <p>이용자는 다음 행위를 하여서는 안 됩니다.</p>
              <ul>
                <li>부정한 방법으로 서비스에 접속하거나 시스템에 부하를 주는 행위</li>
                <li>타인의 지적 재산권이나 명예를 훼손하는 내용의 데이터를 입력하는 행위</li>
                <li>서비스를 이용한 부당한 영리 활동 (사전 협의 없는 경우)</li>
              </ul>
            </section>

            <section>
              <h3>5. 지적 재산 및 면책 사항</h3>
              <ul>
                <li>TuterLog 시스템, 디자인, 소스 코드에 대한 일체의 권리는 원 개발자에게 있습니다.</li>
                <li>구글 서비스(캘린더, OAuth 등) 자체의 장애로 인해 발생하는 서비스 중단에 대해서는 책임을 지지 않습니다.</li>
                <li>천재지변 등 불가항력적인 사유로 발생한 데이터 유실에 대해서는 최대한 복구를 지원하나 배상 책임은 면제됩니다.</li>
              </ul>
            </section>

            <section>
              <h3>6. 개인정보 보호</h3>
              <p>본 서비스는 이용자의 개인정보를 소중히 다루며, 상세 사항은 별도의 <Link href="/docs/privacy" style={{ color: '#4f46e5', textDecoration: 'underline' }}>개인정보처리방침</Link>에 따릅니다.</p>
            </section>

            <section>
              <h3>7. 기타</h3>
              <p>본 약관에서 정하지 아니한 사항은 대한민국의 관계 법령 및 상관례에 따릅니다.</p>
            </section>

            <div className="contact-footer" style={{ marginTop: '1rem', textAlign: 'left', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem' }}>
              <strong>운영 및 문의</strong>: yr9601@gmail.com
            </div>
          </div>
        </div>
      </div>

      <footer className="docs-footer">
        &copy; 2026 TuterLog. All rights reserved.
      </footer>
    </div>
  );
}
