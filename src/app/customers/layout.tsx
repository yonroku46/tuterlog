import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '고객 관리',
};

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
