import { Metadata } from 'next';
import { generatePageMetadata } from '@/common/utils/metaUtils';

export const metadata: Metadata = generatePageMetadata('settings');

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
