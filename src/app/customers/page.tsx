"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Mail, Phone, X, Edit2, Trash2, FileText } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import "@/styles/pages/customers.scss";
import "@/styles/pages/dashboard.scss";
import { customerService, Customer } from '@/services/customerService';

const CustomersPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

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

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.memo?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!user) return null;

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
                  <th>이름</th>
                  <th>상세 정보</th>
                  <th>상태</th>
                  <th>등록일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>로딩 중...</td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>고객 데이터가 없습니다.</td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, index) => (
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
                          {customer.memo && (
                            <div className="memo-preview" title={customer.memo}>
                              {customer.memo.length > 20 ? customer.memo.substring(0, 20) + '...' : customer.memo}
                            </div>
                          )}
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
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
              <X size={24} />
            </button>
            <h2>{currentCustomer?.id ? '고객 정보 수정' : '새 고객 등록'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>이름</label>
                <input 
                  type="text" 
                  value={currentCustomer?.name || ''} 
                  onChange={(e) => setCurrentCustomer({...currentCustomer!, name: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>닉네임</label>
                <input 
                  type="text" 
                  value={currentCustomer?.nickname || ''} 
                  onChange={(e) => setCurrentCustomer({...currentCustomer!, nickname: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>연락처</label>
                <input 
                  type="text" 
                  value={currentCustomer?.phone || ''} 
                  onChange={(e) => setCurrentCustomer({...currentCustomer!, phone: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>상태</label>
                <select 
                  value={currentCustomer?.status || 'active'} 
                  onChange={(e) => setCurrentCustomer({...currentCustomer!, status: e.target.value as 'active' | 'pending'})}
                >
                  <option value="active">활성</option>
                  <option value="pending">대기</option>
                </select>
              </div>
              <div className="form-group">
                <label>메모</label>
                <textarea 
                  value={currentCustomer?.memo || ''} 
                  onChange={(e) => setCurrentCustomer({...currentCustomer!, memo: e.target.value})}
                  placeholder="고객 특이사항 및 메모..."
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
    </div>
  );
};

export default CustomersPage;
