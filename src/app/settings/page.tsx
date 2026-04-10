"use client";

import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, CreditCard, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import "@/styles/pages/settings.scss";
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const SettingsPage = () => {
  const { user, filterKeyword, updateFilterKeyword } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [newName, setNewName] = useState(user?.displayName || '');
  const [tempKeyword, setTempKeyword] = useState(filterKeyword);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setTempKeyword(filterKeyword);
  }, [filterKeyword]);

  if (!user) return null;

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

  const tabs = [
    { id: 'profile', label: '개인정보', icon: <User size={18} /> },
    { id: 'notifications', label: '알림 설정', icon: <Bell size={18} /> },
    { id: 'security', label: '보안', icon: <Shield size={18} /> },
    { id: 'billing', label: '결제 관리', icon: <CreditCard size={18} /> },
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
          
          {activeTab !== 'profile' && (
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
