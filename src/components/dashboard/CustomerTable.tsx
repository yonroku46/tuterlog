"use client";

import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { customerService, Customer } from '@/services/customerService';

const CustomerTable = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentCustomers = async () => {
      if (!user) return;
      try {
        const data = await customerService.getCustomers(user.uid);
        setCustomers(data.slice(0, 5)); 
      } catch (error) {
        console.error("Error fetching recent customers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentCustomers();
  }, [user]);

  return (
    <div className="content-card">
      <div className="card-header">
        <h2>최근 등록 고객</h2>
        <Link href="/customers" className="view-all">전체 보기</Link>
      </div>
      <div className="table-responsive">
        <table className="customer-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>연락처</th>
              <th>상태</th>
              <th>등록일</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</td></tr>
            ) : customers.length > 0 ? (
              customers.map((customer, index) => (
                <tr key={customer.id || index}>
                  <td>
                    <div className="name-cell">
                      <div className="avatar">{customer.name[0]}</div>
                      <div className="name">{customer.name}</div>
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
                    <span className={`status-badge ${customer.status}`}>
                      {customer.status === 'active' ? '활성' : '대기'}
                    </span>
                  </td>
                  <td className="date-cell">{customer.date}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerTable;
