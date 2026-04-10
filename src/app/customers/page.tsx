"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Mail, Phone, X, Edit2, Trash2, FileText, Calendar, Clock, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import "@/styles/pages/customers.scss";
import "@/styles/pages/dashboard.scss";
import { customerService, Customer, ClassSession } from '@/services/customerService';

const CustomersPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState<ClassSession[]>([]);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    if (activeMenuId) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [activeMenuId]);

  const handleActionClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (activeMenuId === id) {
      setActiveMenuId(null);
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX - 140
      });
      setActiveMenuId(id);
    }
  };

  const fetchCustomers = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await customerService.getCustomers(user.uid);
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const handleAdd = () => {
    setCurrentCustomer({ name: '', nickname: '', phone: '', status: 'active' });
    setIsModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setCurrentCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await customerService.deleteCustomer(user.uid, id);
      fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  const handleViewHistory = async (customer: Customer) => {
    if (!user || !customer.id) return;
    setHistoryCustomer(customer);
    setIsHistoryModalOpen(true);
    setIsHistoryLoading(true);
    try {
      const data = await customerService.getClassHistory(user.uid, customer.id);
      setHistoryData(data);
    } catch (error) {
      console.error("Error fetching class history:", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user || !historyCustomer?.id || !window.confirm('기록 삭제 시 복구가 불가능합니다. 정말 삭제하시겠습니까?')) return;
    
    try {
      await customerService.deleteClassSession(user.uid, historyCustomer.id, sessionId);
      const data = await customerService.getClassHistory(user.uid, historyCustomer.id);
      setHistoryData(data);
      fetchCustomers();
      setHistoryCustomer({
        ...historyCustomer,
        totalSessions: (historyCustomer.totalSessions || 1) - 1
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatSessionTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={12} className="sort-icon inactive" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="sort-icon active" /> : <ChevronDown size={12} className="sort-icon active" />;
  };

  const sortedCustomers = React.useMemo(() => {
    const filtered = customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.memo?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    if (sortConfig !== null) {
      filtered.sort((a: any, b: any) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [customers, searchTerm, sortConfig]);

  const sortedSessions = React.useMemo(() => {
    const sortableSessions = [...historyData];
    if (sortConfig !== null) {
      sortableSessions.sort((a: any, b: any) => {
        let aValue = a[sortConfig.key as keyof ClassSession] || '';
        let bValue = b[sortConfig.key as keyof ClassSession] || '';
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableSessions;
  }, [historyData, sortConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentCustomer) return;

    try {
      if (currentCustomer.id) {
        await customerService.updateCustomer(user.uid, currentCustomer.id, currentCustomer);
      } else {
        await customerService.addCustomer(user.uid, currentCustomer as Omit<Customer, 'id' | 'createdAt'>);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="customers-content">
      <header className="header">
        <div className="title-area">
          <h1>고객 관리</h1>
        </div>
        <div className="actions">
          <button className="btn-primary" onClick={handleAdd}>
            <Plus size={20} />
            새 고객 등록
          </button>
        </div>
      </header>

      <section className="tools-bar">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="이름, 닉네임, 연락처로 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      <section className="section-container">
        <div className="content-card">
          <div className="table-responsive">
            <table className="customer-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('name')} className="sortable">
                    <div className="th-content">이름 {getSortIcon('name')}</div>
                  </th>
                  <th onClick={() => requestSort('nickname')} className="sortable">
                    <div className="th-content">상세 정보 {getSortIcon('nickname')}</div>
                  </th>
                  <th onClick={() => requestSort('totalSessions')} className="sortable">
                    <div className="th-content">총 수업 {getSortIcon('totalSessions')}</div>
                  </th>
                  <th onClick={() => requestSort('status')} className="sortable">
                    <div className="th-content">상태 {getSortIcon('status')}</div>
                  </th>
                  <th onClick={() => requestSort('date')} className="sortable">
                    <div className="th-content">등록일 {getSortIcon('date')}</div>
                  </th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>로딩 중...</td>
                  </tr>
                ) : sortedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>고객 데이터가 없습니다.</td>
                  </tr>
                ) : (
                  sortedCustomers.map((customer, index) => (
                    <tr key={customer.id || index}>
                      <td>
                        <div className="name-cell">
                          <div className="avatar">{customer.name[0]}</div>
                          <div className="name-info">
                            <div className="name">{customer.name}</div>
                            {customer.memo && (
                              <span title={customer.memo}>
                                <FileText size={14} className="memo-indicator-icon" />
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <div className="contact-item">
                            <span style={{ color: '#6366f1', fontWeight: 600 }}>@{customer.nickname}</span>
                          </div>
                          <div className="contact-item">
                            <Phone size={12} /> {customer.phone}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="session-count">
                          <Clock size={14} />
                          <span>{customer.totalSessions || 0}회</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${customer.status}`}>
                          {customer.status === 'active' ? '활성' : '대기'}
                        </span>
                      </td>
                      <td className="date-cell">{customer.date}</td>
                      <td key="actions">
                        <div className={`actions-cell ${activeMenuId === customer.id ? 'active' : ''}`}>
                          <button 
                            className="action-btn" 
                            onClick={(e) => customer.id && handleActionClick(e, customer.id)}
                          >
                            <MoreVertical size={20} />
                          </button>
                          
                          {activeMenuId === customer.id && createPortal(
                            <div 
                              className="action-dropdown portal-menu" 
                              style={{ 
                                position: 'absolute', 
                                top: menuPosition.top, 
                                left: menuPosition.left,
                                zIndex: 10001
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button onClick={() => { handleEdit(customer); setActiveMenuId(null); }}>
                                <Edit2 size={16} /> 수정하기
                              </button>
                              <button onClick={() => { handleViewHistory(customer); setActiveMenuId(null); }}>
                                <Calendar size={16} /> 수업이력
                              </button>
                              <button className="delete" onClick={() => { customer.id && handleDelete(customer.id); setActiveMenuId(null); }}>
                                <Trash2 size={16} /> 삭제하기
                              </button>
                            </div>,
                            document.body
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            
            <div className="modal-header">
              <h2>{currentCustomer?.id ? '고객 정보 수정' : '신규 고객 등록'}</h2>
              <div 
                className={`status-toggle ${currentCustomer?.status === 'pending' ? 'pending' : 'active'}`}
                onClick={() => setCurrentCustomer({
                  ...currentCustomer!, 
                  status: currentCustomer?.status === 'pending' ? 'active' : 'pending'
                })}
              >
                <div className="toggle-track">
                  <div className="toggle-thumb" />
                </div>
                <span>{currentCustomer?.status === 'pending' ? '비활성' : '활성'}</span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>이름</label>
                  <input 
                    type="text" 
                    value={currentCustomer?.name || ''} 
                    onChange={(e) => setCurrentCustomer({...currentCustomer!, name: e.target.value})} 
                    placeholder="홍길동"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>닉네임</label>
                  <input 
                    type="text" 
                    value={currentCustomer?.nickname || ''} 
                    onChange={(e) => setCurrentCustomer({...currentCustomer!, nickname: e.target.value})} 
                    placeholder="길동이"
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>연락처</label>
                <input 
                  type="tel" 
                  value={currentCustomer?.phone || ''} 
                  onChange={(e) => setCurrentCustomer({...currentCustomer!, phone: e.target.value})} 
                  placeholder="010-0000-0000"
                  required 
                />
              </div>

              <div className="form-group">
                <label>메모</label>
                <textarea 
                  value={currentCustomer?.memo || ''} 
                  onChange={(e) => setCurrentCustomer({...currentCustomer!, memo: e.target.value})} 
                  placeholder="특이사항을 입력하세요 (예: 수업료 매달 5일 선입금)"
                  rows={4}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>취소</button>
                <button type="submit" className="btn-submit">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isHistoryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsHistoryModalOpen(false)}>
          <div className="modal-content history-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsHistoryModalOpen(false)}><X size={20} /></button>
            <div className="modal-header">
              <div className="title-with-count">
                <h2>수업 이력</h2>
                <span className="count-badge">{historyCustomer?.totalSessions || 0}회 완료</span>
              </div>
              <p className="subtitle">{historyCustomer?.name} ({historyCustomer?.nickname}) 학생</p>
            </div>
            
            <div className="history-list">
              {isHistoryLoading ? (
                <div className="loading-state">기록을 불러오는 중...</div>
              ) : historyData.length === 0 ? (
                <div className="empty-history">아직 기록된 수업이 없습니다.</div>
              ) : (
                historyData.map((session, idx) => (
                  <div key={session.id || idx} className="history-item">
                    <div className="history-date">
                      <span className="m-d">{formatShortDate(session.startTime)}</span>
                    </div>
                    <div className="history-info">
                      <div className="history-title">{session.eventTitle}</div>
                      <div className="history-time">
                        <Clock size={12} />
                        <span>{formatSessionTime(session.startTime)} ~ {formatSessionTime(session.endTime)}</span>
                      </div>
                    </div>
                    <button 
                      className="session-delete-btn" 
                      onClick={() => session.id && handleDeleteSession(session.id)}
                      title="이력 삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
