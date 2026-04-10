import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';
import '@/styles/pages/not-found.scss';

export default function NotFound() {
  return (
    <div className="not-found-container">
      <div className="error-illustration">
        <Compass size={120} strokeWidth={1.5} />
      </div>
      
      <div className="error-content">
        <h1>페이지를 찾을 수 없습니다</h1>
        <p>
          요청하신 페이지가 사라졌거나, <br />
          잘못된 경로로 접근하신 것 같아요.
        </p>
        
        <Link href="/" className="home-link">
          <ArrowLeft size={20} />
          <span>대시보드로 돌아가기</span>
        </Link>
      </div>
    </div>
  );
}
