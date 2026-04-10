import { Metadata } from 'next';
import { generatePageMetadata } from '@/common/utils/metaUtils';

export const metadata: Metadata = generatePageMetadata('customers');

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
