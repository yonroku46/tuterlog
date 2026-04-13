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

  const getContrastYIQ = (hexcolor: string) => {
    if (!hexcolor) return '#FFFFFF';
    const hex = hexcolor.replace("#", "");
    if (hex.length !== 6) return '#FFFFFF';
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
  };

  const columns: Column<Customer>[] = [
    {
      header: '이름',
      key: 'name',
      render: (customer) => {
        const bgColor = customer.color || '#4f46e5';
        return (
          <div className="name-cell">
            <div 
              className="avatar"
              style={{
                backgroundColor: bgColor,
                color: getContrastYIQ(bgColor)
              }}
            >
              {customer.name[0]}
            </div>
            <div className="name">{customer.name}</div>
          </div>
        );
      }
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
      header: '수업 현황',
      key: 'totalSessions',
      render: (customer) => (
        <div className="session-count" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#475569', fontWeight: 600 }}>
          <span>{customer.totalSessions || 0}회 완료</span>
        </div>
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
