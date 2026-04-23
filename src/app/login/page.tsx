"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import "@/styles/pages/login.scss";

export default function LoginPage() {
  const { user, loginWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/my/dashboard');
    }
  }, [user, router]);

  return (
    <main className="login-container">
      <div className="login-card">
        <div className="logo">
          <h1>TuterLog</h1>
          <p>언어 교육 스마트 매니저</p>
        </div>
        <div className="login-methods">
          <button className="login-btn google" onClick={loginWithGoogle}>
            <Image src="/assets/icons/google.svg" alt="Google" width={22} height={22} />
            Google 계정으로 로그인
          </button>
        </div>
        <p className="footer-note">TuterLog는 선생님과 학생의 더 효율적인 클래스 관리를 돕는 스마트 매니저입니다.</p>
        <div className="legal-links">
          <Link href="/docs/terms">서비스 이용약관</Link>
          <span className="divider">|</span>
          <Link href="/docs/privacy">개인정보처리방침</Link>
        </div>
      </div>
    </main>
  );
}
