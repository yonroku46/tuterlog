import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: any) {
    console.warn('Firebase Admin 초기화 실패. 서비스 계정 환경변수(FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)가 필요합니다.', error.message);
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
