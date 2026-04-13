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
          <p>Tuterlog 서비스를 이용하시는 모든 회원님들의 권리와 의무를 규정합니다.</p>
        </header>

        <div className="docs-body">
          <div className="legal-content-body">
            <div className="last-updated">최종 수정일: {lastUpdated}</div>

            <section>
              <h3>1. 약관의 승낙</h3>
              <p>본 서비스를 이용함으로써 귀하는 본 약관에 동의하게 됩니다. 약관의 내용에 동의하지 않으시는 경우 서비스 이용이 제한될 수 있습니다.</p>
            </section>

            <section>
              <h3>2. 서비스 이용 자격 및 계정</h3>
              <ul>
                <li>본 서비스는 만 14세 이상의 이용자를 대상으로 합니다.</li>
                <li>귀하는 구글 계정을 통해 서비스를 이용하며, 계정 정보의 관리 및 보안에 대한 모든 책임은 귀하에게 있습니다.</li>
                <li>타인의 계정을 도용하여 본 서비스를 이용하는 행위는 엄격히 금지됩니다.</li>
              </ul>
            </section>

            <section>
              <h3>3. 서비스의 성격 및 제공 범위</h3>
              <p>TuterLog는 개별 교육 튜터(과외교사 등)의 효율적인 수강생 관리 및 일정 기록을 돕는 보조 도구입니다. 본 서비스는 구글 캘린더 API와 연동되어 데이터를 제공하며, 기능 개선을 위해 서비스 일부를 예고 없이 수정 또는 중단할 수 있습니다.</p>
            </section>

            <section>
              <h3>4. 이용자의 의무 및 금지 행위</h3>
              <p>이용자는 다음 각 호의 행위를 하여서는 안 됩니다.</p>
              <ul>
                <li>서비스 기능을 무단 해킹하거나 조작하는 행위</li>
                <li>허위 정보를 입력하여 다른 이용자 또는 수강생에게 혼란을 주는 행위</li>
                <li>본 서비스 시스템에 과도한 부하를 주어 정상적인 운영을 방해하는 행위</li>
              </ul>
            </section>

            <section>
              <h3>5. 지적 재산권 및 데이터 권리</h3>
              <ul>
                <li>TuterLog와 관련된 모든 로고, 디자인, 소스 코드 및 기술적 노하우에 대한 지적 재산권은 원 개발자에게 있습니다.</li>
                <li>사용자가 직접 입력한 수강생 정보 및 수업 기록 데이터의 소유권은 해당 사용자에게 귀속됩니다.</li>
              </ul>
            </section>

            <section>
              <h3>6. 책임의 제한 (Disclaimer)</h3>
              <p>본 서비스는 "있는 그대로(As Is)" 제공됩니다. 운영진은 다음의 경우에 대하여 책임을 지지 않습니다.</p>
              <ul>
                <li>통제할 수 없는 천재지변, 데이터 서버 장애로 인한 일부 데이터 유실</li>
                <li>구글 서비스(캘린더, 인증 등) 측의 정책 변화나 장애로 인해 발생하는 연동 오류</li>
                <li>이용자의 부주의로 인한 계정 노출 및 데이터 도용 피해</li>
              </ul>
            </section>

            <section>
              <h3>7. 약관의 개정 및 분쟁 해결</h3>
              <p>운용 환경의 변화에 따라 약관은 예고 없이 개정될 수 있으며, 개정된 내용은 서비스 내 공지사항을 통해 효력을 발생합니다. 본 서비스 이용과 관련하여 분쟁이 발생하는 경우 대한민국의 법령을 준거법으로 합니다.</p>
            </section>

            <div className="contact-footer" style={{ marginTop: '1rem', textAlign: 'left', padding: '1.5rem' }}>
              <strong>문의처</strong>: yr9601@gmail.com
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
