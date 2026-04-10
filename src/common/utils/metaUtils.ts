import { Metadata } from 'next';

type MetadataType = 'home' | 'customers' | 'calendar' | 'settings';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "TuterLog";
const APP_DESCRIPTION = "선생님과 학생의 더 효율적인 클래스 관리를 돕는 스마트 매니저";
const APP_URL = process.env.NEXT_PUBLIC_APP_ADDRESS || 'http://localhost:3000';

const PAGE_INFO: Record<MetadataType, { title: string; description?: string }> = {
  home: {
    title: '언어 교육 스마트 매니저',
    description: APP_DESCRIPTION
  },
  customers: {
    title: '고객 관리',
  },
  calendar: {
    title: '일정 확인',
  },
  settings: {
    title: '설정',
  }
};

/**
 * 페이지별 메타데이터를 생성하는 유틸리티
 * @param type 페이지 타입
 * @returns Metadata 객체
 */
export function generatePageMetadata(type: MetadataType): Metadata {
  const info = PAGE_INFO[type];
  const title = info.title;
  const description = info.description || APP_DESCRIPTION;

  return {
    metadataBase: new URL(APP_URL),
    title: {
      default: `${title} | ${APP_NAME}`,
      template: `%s | ${APP_NAME}`,
    },
    description,
    keywords: ['고객관리', '강사관리', '클래스관리', '스케줄러', 'TuterLog', '튜터로그'],
    authors: [{ name: 'TuterLog' }],
    creator: 'TuterLog',
    publisher: 'TuterLog',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: 'website',
      siteName: APP_NAME,
      title: `${title} | ${APP_NAME}`,
      description,
      url: APP_URL,
      images: [
        {
          url: '/assets/icons/favicon.svg',
          width: 1200,
          height: 630,
          alt: APP_NAME,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${APP_NAME}`,
      description,
      images: ['/assets/icons/favicon.svg'],
    },
    icons: {
      icon: [
        { url: '/assets/icons/favicon.ico', sizes: 'any' },
        { url: '/assets/icons/favicon.svg', type: 'image/svg+xml' }
      ],
      apple: [
        { url: '/assets/icons/favicon.svg' }
      ],
    },
    manifest: '/manifest.json',
  };
}
