"use client";

import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Users, Save, Trash2, Copy, LogOut, UserMinus, CalendarCheck, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import "@/styles/pages/settings.scss";
import { updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import Image from 'next/image';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc, deleteDoc, collectionGroup } from 'firebase/firestore';

const SettingsPage = () => {
  const { user, filterKeyword, updateFilterKeyword, withdraw } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [newName, setNewName] = useState(user?.displayName || '');
  const [tempKeyword, setTempKeyword] = useState(filterKeyword);
  const [isUpdating, setIsUpdating] = useState(false);

  const [orgId, setOrgId] = useState(user?.uid || '');
  const [members, setMembers] = useState<any[]>([]);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [masterName, setMasterName] = useState('');

  // 예약 설정
  const [bookingSlug, setBookingSlug] = useState('');
  const [isBookingEnabled, setIsBookingEnabled] = useState(false);
  const [bookingDuration, setBookingDuration] = useState('60');
  const [bookingDays, setBookingDays] = useState<number[]>([1, 2, 3, 4, 5]); // 기본: 월~금
  const [bookingStartTime, setBookingStartTime] = useState('09:00');
  const [bookingEndTime, setBookingEndTime] = useState('18:00');
  const [bookingNotice, setBookingNotice] = useState('');
  const [isSavingBooking, setIsSavingBooking] = useState(false);

  const fetchOrgInfo = async () => {
    if (!user) return;
    try {
      const uDoc = await getDoc(doc(db, "users", user.uid));
      const currentOrgId = (uDoc.exists() && uDoc.data().organizationId) ? uDoc.data().organizationId : user.uid;
      setOrgId(currentOrgId);
      
      if (currentOrgId === user.uid) {
        try {
          const memsSnap = await getDocs(collection(db, "users", user.uid, "customers"));
          const mems = memsSnap.docs
            .filter(d => d.id.startsWith("member_"))
            .map(d => ({ id: d.id.replace("member_", ""), ...d.data() }));
          setMembers(mems);
        } catch (subErr) {
          setMembers([]);
        }
      } else {
        try {
          const mDoc = await getDoc(doc(db, "users", currentOrgId));
          if (mDoc.exists()) {
            setMasterName(mDoc.data().name || mDoc.data().displayName || '소속장');
          }
        } catch (crossErr) {
          try {
            const configDoc = await getDoc(doc(db, "users", currentOrgId, "customers", "config"));
            if (configDoc.exists()) {
              const d = configDoc.data() as any;
              setMasterName(d.name || d.displayName || d.userName || uDoc.data()?.masterName || '소속장');
            } else {
              setMasterName(uDoc.data()?.masterName || '소속장');
            }
          } catch (configErr) {
            setMasterName(uDoc.data()?.masterName || '소속장');
          }
        }
      }
    } catch (e) {
      console.error("fetchOrgInfo main error:", e);
    }
  };

  const fetchBookingSettings = async () => {
    if (!user) return;
    try {
      const configDoc = await getDoc(doc(db, "users", user.uid, "customers", "config"));
      if (configDoc.exists()) {
        const data = configDoc.data();
        setBookingSlug(data.bookingSlug || '');
        // 기존 슬러그를 상태로 들고 있어서, 나중에 바뀔 때 삭제할 수 있도록 함
        if (data.bookingSlug) {
          (window as any)._oldBookingSlug = data.bookingSlug;
        }
        setIsBookingEnabled(data.isBookingEnabled || false);
        setBookingDuration(data.bookingDuration?.toString() || '60');
        setBookingDays(data.bookingDays || [1, 2, 3, 4, 5]);
        setBookingStartTime(data.bookingStartTime || '09:00');
        setBookingEndTime(data.bookingEndTime || '18:00');
        setBookingNotice(data.bookingNotice || '');
      }
    } catch (e) {
      console.error("fetchBookingSettings error:", e);
    }
  };

  useEffect(() => {
    setTempKeyword(filterKeyword);
  }, [filterKeyword]);

  useEffect(() => {
    fetchOrgInfo();
    fetchBookingSettings();
  }, [user]);

  if (!user) return null;

  const handleWithdraw = async () => {
    try {
      setIsUpdating(true);
      await withdraw();
    } catch (error) {
      console.error("Withdrawal error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleJoinOrg = async () => {
    if (!user) return;
    if (!inviteCodeInput.trim()) return;
    if (inviteCodeInput.trim() === user.uid) {
      alert("자신의 초대 코드는 입력할 수 없습니다.");
      return;
    }
    
    try {
      let mName = '소속장';
      let isValid = true;
      let fetchedName = false;
      
      try {
        const mDoc = await getDoc(doc(db, "users", inviteCodeInput.trim()));
        if (!mDoc.exists()) {
          isValid = false;
        } else {
          mName = mDoc.data().name || mDoc.data().displayName || '소속장';
          fetchedName = true;
        }
      } catch (readErr: any) {
        try {
          const configDoc = await getDoc(doc(db, "users", inviteCodeInput.trim(), "customers", "config"));
          if (configDoc.exists()) {
            const d = configDoc.data() as any;
            if (d.name || d.displayName || d.userName) {
              mName = d.name || d.displayName || d.userName;
              fetchedName = true;
            }
          }
        } catch (configErr) {
          // completely ignore
        }
      }

      if (!isValid && fetchedName) {
        alert("유효하지 않은 초대 코드입니다.");
        return;
      }
      
      if (!fetchedName) {
        const userInput = prompt("초대 코드가 확인되었습니다! 🎉\n\n앞으로 화면에 표시될 소속(선생님 또는 그룹)의 이름을 자유롭게 설정해 주세요.\n(예: 홍길동 선생님팀, A학원 등)");
        if (!userInput || !userInput.trim()) return;
        mName = userInput.trim();
      } else {
        if (!confirm(`${mName}님의 소속으로 들어가시겠습니까?\n이후 생성하는 고객은 소속장과 관리될 수 있습니다.`)) return;
      }

      await updateDoc(doc(db, "users", user.uid), { 
        organizationId: inviteCodeInput.trim(),
        masterName: mName
      });
      try {
        // members 대신 customers 서브컬렉션 활용 (쓰기 권한 열려있음)
        await setDoc(doc(db, "users", inviteCodeInput.trim(), "customers", "member_" + user.uid), {
          uid: user.uid,
          name: user.displayName || '이름 없음',
          email: user.email || ''
        });
      } catch (err) {
        console.warn("Could not save to master's customers subcollection:", err);
      }
      alert("성공적으로 소속에 가입되었습니다.");
      setInviteCodeInput('');
      fetchOrgInfo();
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    }
  };

  const handleLeaveOrg = async () => {
    if (!user) return;
    if (!confirm("현재 소속에서 탈퇴하시겠습니까?\n기존 소속에 등록했던 고객 정보는 더 이상 볼 수 없습니다.")) return;
    try {
      await updateDoc(doc(db, "users", user.uid), { organizationId: user.uid });
      if (orgId !== user.uid) {
        await deleteDoc(doc(db, "users", orgId, "customers", "member_" + user.uid)).catch(() => {});
      }
      alert("소속에서 탈퇴했습니다.");
      fetchOrgInfo();
    } catch (e) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`${memberName}님을 소속에서 내보내시겠습니까?`)) return;
    try {
      await updateDoc(doc(db, "users", memberId), { organizationId: memberId });
      await deleteDoc(doc(db, "users", user.uid, "customers", "member_" + memberId));
      alert("소속원을 내보냈습니다.");
      fetchOrgInfo();
    } catch (e) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      setIsUpdating(true);
      
      const promises: Promise<any>[] = [];
      
      if (newName !== user.displayName) {
        promises.push(updateProfile(auth.currentUser, { displayName: newName }));
      }
      
      if (tempKeyword !== filterKeyword) {
        promises.push(updateFilterKeyword(tempKeyword));
      }

      await Promise.all(promises);
      alert('설정이 성공적으로 저장되었습니다.');
    } catch (error: any) {
      console.error('Error updating settings:', error);
      alert(`저장 과정에서 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveBookingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // 슬러그 형식 검사 (영문자, 숫자, 하이픈만 허용)
    const slugRegex = /^[a-zA-Z0-9-]+$/;
    if (bookingSlug && !slugRegex.test(bookingSlug)) {
      alert("예약 링크 주소는 영문자, 숫자, 하이픈(-)만 사용할 수 있습니다.");
      return;
    }

    try {
      setIsSavingBooking(true);
      
      // 중복 체크 (bookingProfiles 컬렉션 확인)
      if (bookingSlug) {
        try {
          const profileDoc = await getDoc(doc(db, "bookingProfiles", bookingSlug));
          if (profileDoc.exists() && profileDoc.data().uid !== user.uid) {
            alert("이미 사용 중인 예약 링크 주소입니다. 다른 주소를 입력해주세요.");
            setIsSavingBooking(false);
            return;
          }
        } catch (queryError: any) {
          console.warn("중복 체크 쿼리 중 오류:", queryError);
        }
      }

      // 예약 설정 저장 (내부용 config 문서)
      await setDoc(doc(db, "users", user.uid, "customers", "config"), {
        bookingSlug,
        isBookingEnabled,
        bookingDuration: Number(bookingDuration),
        bookingDays,
        bookingStartTime,
        bookingEndTime,
        bookingNotice
      }, { merge: true });

      // 퍼블릭 공개용 bookingProfiles 저장
      if (bookingSlug) {
        // 기존 슬러그가 있었고 바뀌었다면 기존 프로필 삭제
        const oldSlug = (window as any)._oldBookingSlug;
        if (oldSlug && oldSlug !== bookingSlug) {
          try { await deleteDoc(doc(db, "bookingProfiles", oldSlug)); } catch(e) {}
        }
        
        await setDoc(doc(db, "bookingProfiles", bookingSlug), {
          uid: user.uid,
          teacherName: user.displayName || '선생님',
          isBookingEnabled,
          bookingDuration: Number(bookingDuration),
          bookingDays,
          bookingStartTime,
          bookingEndTime,
          bookingNotice
        }, { merge: true });
        
        (window as any)._oldBookingSlug = bookingSlug;
      }

      alert('예약 설정이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('Error updating booking settings:', error);
      alert('예약 설정 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingBooking(false);
    }
  };

  const tabs = [
    { id: 'profile', label: '개인정보', icon: <User size={18} /> },
    { id: 'organization', label: '소속 설정', icon: <Users size={18} /> },
    { id: 'booking', label: '예약 설정', icon: <CalendarCheck size={18} /> },
    { id: 'notifications', label: '알림 설정', icon: <Bell size={18} /> },
    { id: 'security', label: '보안', icon: <Shield size={18} /> },
  ];

  return (
    <div className="settings-content-wrapper">
      <header className="header">
        <h1>설정</h1>
        <p>계정 및 서비스 이용 설정을 관리합니다.</p>
      </header>

      <section className="settings-grid">
        <nav className="settings-nav">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="settings-content">
          {activeTab === 'profile' && (
            <div className="tab-pane">
              <h2>개인정보 및 필터 설정</h2>
              <div className="profile-header">
                <div className="avatar-large">{user.displayName?.[0] || user.email?.[0] || 'U'}</div>
                <div className="user-meta">
                  <h3>{user.displayName || '사용자'}</h3>
                  <p>{user.email}</p>
                </div>
              </div>
              
              <form onSubmit={handleSaveAll}>
                <div className="settings-section">
                  <h3>기본 정보</h3>
                  <div className="form-group">
                    <label>이름</label>
                    <input 
                      type="text" 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)} 
                      placeholder="이름을 입력하세요" 
                    />
                  </div>
                  <div className="form-group">
                    <label>이메일 주소</label>
                    <input type="email" value={user.email || ''} readOnly disabled className="readonly-input" />
                    <p className="help-text">계정 이메일은 변경할 수 없습니다.</p>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>서비스 연동 설정</h3>
                  <div className="form-group">
                    <label>스케줄 필터 키워드</label>
                    <div className="keyword-input-wrapper">
                      <input 
                        type="text" 
                        value={tempKeyword} 
                        onChange={(e) => setTempKeyword(e.target.value)} 
                        placeholder="예: 일본어 (구글 캘린더에서 필터링할 단어)" 
                      />
                    </div>
                    <p className="help-text">대시보드와 통계에서 이 키워드가 포함된 일정만 집계합니다.</p>
                  </div>
                </div>

                <div className="save-action">
                  <button type="submit" className="btn-primary" disabled={isUpdating}>
                    <Save size={18} />
                    {isUpdating ? '저장 중...' : '변경사항 저장'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="tab-pane">
              <h2>보안 및 계정 관리</h2>
              
              <div className="settings-section">
                <h3>계정 연결 상태</h3>
                <div className="connection-info">
                  <div className="connection-item">
                    <div className="brand">
                      <Image src="/assets/icons/google.svg" alt="Google" width={20} height={20} />
                      <span>Google 계정 연동됨</span>
                    </div>
                    <span className="status-badge active">연결됨</span>
                  </div>
                </div>
              </div>

              <div className="settings-section danger-zone">
                <h3>위험 구역</h3>
                <p className="section-desc">계정을 삭제하면 모든 수강생 데이터와 수업 기록이 영구적으로 삭제되며 복구할 수 없습니다.</p>
                <button 
                  className="btn-danger" 
                  disabled={isUpdating}
                  onClick={() => {
                    if (confirm("정말로 TuterLog를 탈퇴하시겠습니까?\n모든 데이터가 영구적으로 삭제되며 이 작업은 되돌릴 수 없습니다.")) {
                      const verification = prompt("실수를 방지하기 위해 '영구 삭제'라고 입력해 주세요.");
                      if (verification === "영구 삭제") {
                        handleWithdraw();
                      } else if (verification !== null) {
                        alert("문구가 일치하지 않습니다. 다시 시도해 주세요.");
                      }
                    }
                  }}
                >
                  <Trash2 size={18} />
                  {isUpdating ? '처리 중...' : '서비스 탈퇴 (데이터 삭제)'}
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'organization' && (
            <div className="tab-pane">
              <h2>소속 설정</h2>
              <div className="settings-section">
                <h3>내 소속 정보</h3>
                <p className="section-desc">소속장을 중심으로 여러 선생님들과 고객을 함께 관리할 수 있습니다.</p>
                
                {orgId === user.uid ? (
                  // I am the master
                  <div className="org-master-view" style={{ marginTop: '20px' }}>
                    <div className="invite-code-box" style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#64748b' }}>내 소속 초대 코드 (내 UID)</h4>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <code style={{ flex: 1, padding: '10px 15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a' }}>{user.uid}</code>
                        <button 
                          className="btn-secondary"
                          onClick={() => { navigator.clipboard.writeText(user.uid); alert("초대 코드가 복사되었습니다."); }}
                          style={{ padding: '0 15px', display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}
                        >
                          <Copy size={16} /> 복사
                        </button>
                      </div>
                      <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>초대 코드를 팀원에게 전달하여 내 소속으로 가입시킬 수 있습니다.</p>
                    </div>

                    <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#1e293b' }}>내 소속원 목록</h4>
                    {members.length === 0 ? (
                      <div className="empty-state" style={{ padding: '30px', backgroundColor: '#fcfcfd', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                        <Users size={24} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
                        <p style={{ color: '#64748b', fontSize: '14px' }}>아직 소속된 팀원이 없습니다.</p>
                      </div>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {members.map(m => (
                          <li key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{m.name || '이름 없음'}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{m.email}</div>
                            </div>
                            <button 
                              onClick={() => handleRemoveMember(m.id, m.name || '이름 없음')}
                              style={{ padding: '8px', background: '#fef2f2', border: 'none', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}
                              title="내보내기"
                            >
                              <UserMinus size={18} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#64748b' }}>다른 소속으로 들어가기</h4>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                          type="text" 
                          placeholder="전달받은 초대 코드 입력" 
                          value={inviteCodeInput}
                          onChange={(e) => setInviteCodeInput(e.target.value)}
                          style={{ flex: 1, padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                        <button 
                          onClick={handleJoinOrg}
                          style={{ padding: '0 20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          가입하기
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // I am a sub-member
                  <div className="org-member-view" style={{ marginTop: '20px' }}>
                    <div style={{ padding: '30px', backgroundColor: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                      <Users size={32} style={{ color: '#10b981', margin: '0 auto 15px' }} />
                      <h3 style={{ color: '#065f46', margin: '0 0 5px 0' }}>{masterName}님의 소속 팀원입니다</h3>
                      <p style={{ color: '#047857', fontSize: '14px', margin: 0 }}>등록하는 고객 정보는 소속장과 함께 관리될 수 있습니다.</p>
                      
                      <button 
                        onClick={handleLeaveOrg}
                        style={{ marginTop: '20px', padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        <LogOut size={16} /> 소속에서 탈퇴하기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'booking' && (
            <div className="tab-pane">
              <h2>예약 페이지 설정</h2>
              
              <form onSubmit={handleSaveBookingSettings}>
                <div className="settings-section">
                  <h3>예약 링크 설정</h3>
                  
                  <div className="form-group toggle-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <div>
                      <label style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>예약 페이지 활성화</label>
                      <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b' }}>활성화하면 누구나 링크를 통해 나에게 예약을 요청할 수 있습니다.</p>
                    </div>
                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                      <input 
                        type="checkbox" 
                        checked={isBookingEnabled} 
                        onChange={(e) => setIsBookingEnabled(e.target.checked)} 
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span className="slider round" style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isBookingEnabled ? '#4f46e5' : '#ccc', transition: '.4s', borderRadius: '34px' }}>
                        <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: isBookingEnabled ? '30px' : '4px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                      </span>
                    </label>
                  </div>

                  <div className="form-group">
                    <label>내 예약 링크 주소</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#64748b', fontSize: '14px' }}>tuterlog.com/book/</span>
                      <input 
                        type="text" 
                        value={bookingSlug} 
                        onChange={(e) => setBookingSlug(e.target.value)} 
                        placeholder="영문자, 숫자, 하이픈만 입력" 
                        style={{ flex: 1, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                      />
                    </div>
                    <p className="help-text">원하는 예약 페이지 주소를 만들어주세요. 예: teacher-kim</p>
                  </div>

                  {bookingSlug && isBookingEnabled && (
                    <div style={{ marginTop: '15px', padding: '15px', border: '1px solid #e0e7ff', backgroundColor: '#eef2ff', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#4338ca', fontWeight: 'bold' }}>내 예약 페이지</p>
                        <a href={`/book/${bookingSlug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', textDecoration: 'underline', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                          tuterlog.com/book/{bookingSlug} <ExternalLink size={14} />
                        </a>
                      </div>
                      <button 
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/book/${bookingSlug}`); alert('링크가 복사되었습니다.'); }}
                        style={{ padding: '8px 12px', backgroundColor: 'white', border: '1px solid #c7d2fe', color: '#4f46e5', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Copy size={14} /> 링크 복사
                      </button>
                    </div>
                  )}
                </div>

                <div className="settings-section">
                  <h3>기본 예약 규칙</h3>
                  
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label>진행 가능 요일</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '5px' }}>
                      {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => {
                        const isSelected = bookingDays.includes(index);
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              if (isSelected) setBookingDays(bookingDays.filter(d => d !== index));
                              else setBookingDays([...bookingDays, index].sort());
                            }}
                            style={{
                              width: '40px', height: '40px', borderRadius: '50%',
                              backgroundColor: isSelected ? '#4f46e5' : 'white',
                              color: isSelected ? 'white' : '#64748b',
                              border: isSelected ? 'none' : '1px solid #cbd5e1',
                              fontWeight: isSelected ? 'bold' : 'normal',
                              cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label>예약 가능 시작 시간</label>
                      <input 
                        type="time" 
                        value={bookingStartTime}
                        onChange={(e) => setBookingStartTime(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>예약 가능 종료 시간</label>
                      <input 
                        type="time" 
                        value={bookingEndTime}
                        onChange={(e) => setBookingEndTime(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>기본 수업 진행 시간 (분)</label>
                    <select 
                      value={bookingDuration} 
                      onChange={(e) => setBookingDuration(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white' }}
                    >
                      <option value="30">30분</option>
                      <option value="60">60분 (1시간)</option>
                      <option value="90">90분 (1시간 30분)</option>
                      <option value="120">120분 (2시간)</option>
                    </select>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>예약 페이지 안내 문구</h3>
                  <div className="form-group">
                    <label>수강생에게 보여질 안내 사항 (선택)</label>
                    <textarea 
                      value={bookingNotice}
                      onChange={(e) => setBookingNotice(e.target.value)}
                      placeholder="예: 원하시는 주제나 문의사항을 미리 남겨주시면 수업 준비에 도움이 됩니다."
                      style={{ width: '100%', height: '100px', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', resize: 'none', lineHeight: '1.5' }}
                    />
                  </div>
                </div>

                <div className="save-action">
                  <button type="submit" className="btn-primary" disabled={isSavingBooking}>
                    <Save size={18} />
                    {isSavingBooking ? '저장 중...' : '예약 설정 저장'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {activeTab !== 'profile' && activeTab !== 'security' && activeTab !== 'organization' && activeTab !== 'booking' && (
            <div className="tab-pane-empty">
              <div className="empty-state">
                <p>준비 중인 기능입니다.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
