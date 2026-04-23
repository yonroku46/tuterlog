"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';

export default function MyLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return null; // AppLayout handles the loading state globally or we can let it handle it
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}
