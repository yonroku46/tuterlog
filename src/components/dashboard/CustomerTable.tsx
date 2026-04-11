"use client";

import React, { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { customerService, Customer } from '@/services/customerService';
import DataTable, { Column } from '@/components/ui/DataTable';

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

  const columns: Column<Customer>[] = [
    {
      header: '이름',
      key: 'name',
      render: (customer) => (
        <div className="name-cell">
          <div className="avatar">{customer.name[0]}</div>
          <div className="name">{customer.name}</div>
        </div>
      )
    },
    {
      header: '연락처',
      key: 'contact',
      render: (customer) => (
        <div className="contact-cell">
          <div className="contact-item">
            <span style={{ color: '#6366f1', fontWeight: 600 }}>@{customer.nickname}</span>
          </div>
          <div className="contact-item">
            <Phone size={12} /> {customer.phone}
          </div>
        </div>
      )
    },
    {
      header: '상태',
      key: 'status',
      render: (customer) => (
        <span className={`status-badge ${customer.status}`}>
          {customer.status === 'active' ? '활성' : '대기'}
        </span>
      )
    },
    {
      header: '등록일',
      key: 'date',
      className: 'date-cell'
    }
  ];

  return (
    <div className="content-card">
      <div className="card-header">
        <div className="header-title">
          <h2>최근 등록 고객</h2>
        </div>
        <Link href="/customers" className="view-all">전체 보기</Link>
      </div>
      <DataTable
        data={customers}
        columns={columns}
        loading={loading}
        rowKey={(customer, index) => customer.id || index}
      />
    </div>
  );
};

export default CustomerTable;
