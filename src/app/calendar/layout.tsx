import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '일정 확인',
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
