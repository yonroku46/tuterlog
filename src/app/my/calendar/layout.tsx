import { Metadata } from 'next';
import { generatePageMetadata } from '@/common/utils/metaUtils';

export const metadata: Metadata = generatePageMetadata('calendar');

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
