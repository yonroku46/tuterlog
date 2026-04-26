"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Clock, CheckCircle, Send, Loader2 } from 'lucide-react';
import LandingNav from '@/components/layout/LandingNav';
import LandingFooter from '@/components/layout/LandingFooter';
import "@/styles/pages/contact.scss";

const INQUIRY_TYPES = [
  { value: '', label: '문의 유형을 선택해 주세요' },
  { value: 'general', label: '일반 문의' },
  { value: 'billing', label: '결제 / 요금제' },
  { value: 'bug', label: '버그 신고' },
  { value: 'feature', label: '기능 제안' },
  { value: 'data', label: '데이터 삭제 요청' },
];

interface FormState {
  name: string;
  email: string;
  type: string;
  subject: string;
  message: string;
}

const INITIAL: FormState = { name: '', email: '', type: '', subject: '', message: '' };

export default function ContactPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>({
    ...INITIAL,
    name: user?.displayName ?? '',
    email: user?.email ?? '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    const body = encodeURIComponent(
      `이름: ${form.name}\n이메일: ${form.email}\n유형: ${form.type}\n제목: ${form.subject}\n\n${form.message}`
    );
    const mailto = `mailto:yr9601@gmail.com?subject=[TuterLog 문의] ${encodeURIComponent(form.subject)}&body=${body}`;
    
    setTimeout(() => {
      window.location.href = mailto;
      setSending(false);
      setSent(true);
    }, 1200);
  };

  const isValid = form.name && form.email && form.type && form.subject && form.message;

  return (
    <div className="contact-page">
      <LandingNav />

      {/* MAIN LAYOUT */}
      <div className="contact-layout">

        {/* ── LEFT ── */}
        <div className="contact-left">
          <div className="contact-left-inner">
            <p className="contact-left-eyebrow">Contact</p>
            <h1 className="contact-left-title">
              필요한 도움을<br />가장 빠르게
            </h1>
            <p className="contact-left-sub">
              서비스 이용 중 궁금한 점이나 제안하고 싶은 기능이 있으신가요? 
              오른쪽 양식을 작성해 주시면 담당자가 확인 후 답변드립니다.
            </p>

            <div className="contact-info-list">
              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="contact-info-label">운영 시간</p>
                  <p className="contact-info-value">평일 10:00 - 18:00 (KST)</p>
                </div>
              </div>
            </div>

            <div className="contact-response-box">
              <div className="contact-response-dot" />
              <p className="contact-response-text">평균 응답 시간: 24시간 이내</p>
            </div>
          </div>
        </div>

        {/* ── RIGHT (FORM) ── */}
        <div className="contact-right">
          <div className="contact-form-inner">
            {sent ? (
              <div className="contact-success">
                <div className="contact-success-icon">
                  <CheckCircle size={28} />
                </div>
                <h2 className="contact-success-title">문의 메일이 준비되었습니다</h2>
                <p className="contact-success-sub">
                  메일 앱이 실행되었습니다. <br />
                  발송 버튼을 누르면 접수가 완료됩니다.
                </p>
                <button
                  className="contact-submit-btn"
                  style={{ marginTop: '1rem' }}
                  onClick={() => { setSent(false); setForm({ ...INITIAL, name: user?.displayName ?? '', email: user?.email ?? '' }); }}
                >
                  새로 문의하기
                </button>
              </div>
            ) : (
              <>
                <h2 className="contact-form-title">문의 양식</h2>
                <p className="contact-form-sub">
                  정확한 정보와 내용을 입력해 주시면<br />
                  더 구체적인 답변을 드릴 수 있습니다.
                </p>

                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="contact-field-row">
                    <div className="contact-field">
                      <label className="contact-label">이름 *</label>
                      <input
                        className="contact-input"
                        type="text"
                        placeholder="성함을 입력해 주세요"
                        value={form.name}
                        onChange={update('name')}
                        required
                      />
                    </div>
                    <div className="contact-field">
                      <label className="contact-label">이메일 *</label>
                      <input
                        className="contact-input"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={update('email')}
                        required
                      />
                    </div>
                  </div>

                  <div className="contact-field">
                    <label className="contact-label">문의 유형 *</label>
                    <select
                      className={`contact-input contact-select ${!form.type ? 'is-placeholder' : ''}`}
                      value={form.type}
                      onChange={update('type')}
                      required
                    >
                      {INQUIRY_TYPES.map(t => (
                        <option key={t.value} value={t.value} disabled={!t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="contact-field">
                    <label className="contact-label">제목 *</label>
                    <input
                      className="contact-input"
                      type="text"
                      placeholder="문의 제목을 입력해 주세요"
                      value={form.subject}
                      onChange={update('subject')}
                      required
                    />
                  </div>

                  <div className="contact-field">
                    <label className="contact-label">문의 내용 *</label>
                    <textarea
                      className="contact-input contact-textarea"
                      placeholder="상세한 내용을 적어주세요. 버그의 경우 발생 경로를 적어주시면 큰 도움이 됩니다."
                      value={form.message}
                      onChange={update('message')}
                      required
                    />
                  </div>

                  <div className="contact-submit-row">
                    <p className="contact-privacy-note">
                      제출 시{' '}
                      <Link href="/docs/privacy">개인정보처리방침</Link>에 동의한 것으로 간주됩니다.
                    </p>
                    <button
                      type="submit"
                      className="contact-submit-btn"
                      disabled={!isValid || sending}
                    >
                      {sending ? (
                        <><Loader2 size={16} className="animate-spin" /> 전송중...</>
                      ) : (
                        <><Send size={16} /> 문의 메일 전송</>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
