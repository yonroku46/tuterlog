"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <div>
          <Link href="/" className="landing-footer-logo">
            <Image src="/assets/icons/favicon.svg" alt="TuterLog" width={20} height={20} />
            TuterLog
          </Link>
          <p className="landing-footer-copy">© 2026 TuterLog. All rights reserved.</p>
        </div>
        <div className="landing-footer-links">
          <Link href="/docs/terms">이용약관</Link>
          <Link href="/docs/privacy">개인정보처리방침</Link>
          <Link href="/contact">문의하기</Link>
        </div>
      </div>
    </footer>
  );
}
