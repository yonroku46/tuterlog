import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  getDoc,
  collectionGroup,
  setDoc
} from "firebase/firestore";

export interface Customer {
  id?: string;
  name: string;
  nickname: string;
  phone: string;
  date?: string;
  memo?: string;
  color?: string;
  totalSessions?: number;
  unitPrice?: number;
  ownerId?: string;
  createdAt?: any;
}

export interface ClassSession {
  id?: string;
  googleEventId: string;
  eventTitle: string;
  startTime: string;
  endTime: string;
  completedAt: any;
  userId?: string;
}

let lastFetchTime = 0;
const FETCH_COOLDOWN = 3000; 

export const customerService = {
  // 고객 목록 조회 (각 유저의 개인 폴더를 최우선으로 조회)
  async getCustomers(userId: string): Promise<Customer[]> {
    if (!userId) return [];
    try {
      // 1. [핵심] 해당 유저의 개인 폴더만 조회 (본인이 직접 쓴 것처럼 보이게 함)
      const customersRef = collection(db, "users", userId, "customers");
      const snapshot = await getDocs(customersRef);
      
      const data = snapshot.docs
        .filter(d => d.id !== 'config') // 설정 제외
        .map(doc => ({ id: doc.id, ...doc.data() }));

      // 2. 혹시나 루트에 남아있을지 모르는 내 데이터도 합쳐서 조회 (과기 과도기 대응)
      const rootQ = query(collection(db, "customers"), where("ownerId", "==", userId));
      const rootSnapshot = await getDocs(rootQ);
      const rootData = rootSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const combined = [...data];
      rootData.forEach(rd => {
        if (!combined.some(cd => cd.id === rd.id)) combined.push(rd);
      });

      return combined.sort((a: any, b: any) => {
        const dA = (a.createdAt?.toDate?.() || new Date(0)).getTime();
        const dB = (b.createdAt?.toDate?.() || new Date(0)).getTime();
        return dB - dA;
      }) as Customer[];
    } catch (error) {
      console.error("고객 조회 에러:", error);
      return [];
    }
  },

  // 전체 유저 목록 (관리자용)
  async getAllUsers(): Promise<any[]> {
    const now = Date.now();
    if (now - lastFetchTime < FETCH_COOLDOWN && (window as any)._cachedUsers) return (window as any)._cachedUsers;

    try {
      const usersS = await getDocs(collection(db, "users"));
      const users = usersS.docs.map(doc => {
        const d = doc.data() as any;
        return { id: doc.id, name: d.name || d.displayName || "", email: d.email || "" };
      });

      const groupS = await getDocs(collectionGroup(db, "customers"));
      const foundUids = new Set<string>();
      groupS.forEach(d => {
        const parts = d.ref.path.split('/');
        if (parts[0] === 'users' && parts[1]) foundUids.add(parts[1]);
        const data = d.data() as any;
        if (data.ownerId) foundUids.add(data.ownerId);
      });

      const finalUsers: any[] = [...users.filter(u => u.name && u.email && u.email.includes('@'))];
      const promises = Array.from(foundUids).map(async (uid) => {
        if (finalUsers.some(u => u.id === uid)) return null;
        let name = "", email = "", refreshToken = "";
        try {
          const snap = await getDoc(doc(db, "users", uid, "customers", "config"));
          if (snap.exists()) {
            const d = snap.data() as any;
            name = d.name || d.displayName || d.userName || "";
            email = d.email || d.userEmail || "";
            refreshToken = d.googleRefreshToken || "";
          }
        } catch (e) {}

        if ((!email || !email.includes('@')) && refreshToken) {
          try {
            const res = await fetch('/api/admin/resolve-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });
            if (res.ok) {
              const info = await res.json();
              if (info.email) { email = info.email; name = info.name || email.split('@')[0]; }
            }
          } catch (err) {}
        }
        if (!name) name = email && email.includes('@') ? email.split('@')[0] : `유저(${uid.slice(-4)})`;
        if (!email) email = "이메일 미확인";
        return { id: uid, name, email };
      });

      const discovered = await Promise.all(promises);
      discovered.forEach(u => { if (u) finalUsers.push(u); });
      const results = finalUsers.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      (window as any)._cachedUsers = results;
      lastFetchTime = Date.now();
      return results;
    } catch (error) { return []; }
  },

  // 고객 추가 (개인 폴더 직배송)
  async addCustomer(userId: string, customerData: Omit<Customer, 'id' | 'createdAt'>) {
    const targetUserId = customerData.ownerId || userId;
    const customersRef = collection(db, "users", targetUserId, "customers");
    return await addDoc(customersRef, {
      ...customerData,
      ownerId: targetUserId,
      createdAt: serverTimestamp(),
      totalSessions: 0
    });
  },

  // 고객 이관 (물리적 폴더 이동 + 서브컬렉션 이사)
  async updateCustomer(userId: string, customerId: string, customerData: Partial<Customer>) {
    try {
      const targetUserId = customerData.ownerId || userId;
      
      if (customerData.ownerId && customerData.ownerId !== userId) {
        let full: any = null;
        const oldRef = doc(db, "users", userId, "customers", customerId);
        const rootRef = doc(db, "customers", customerId);
        const [oldSnap, rootSnap] = await Promise.all([getDoc(oldRef), getDoc(rootRef)]);
        
        if (oldSnap.exists()) full = oldSnap.data();
        else if (rootSnap.exists()) full = rootSnap.data();

        if (full) {
          const newRef = doc(db, "users", targetUserId, "customers", customerId);
          await setDoc(newRef, {
            ...full,
            ...customerData,
            updatedAt: serverTimestamp()
          });

          // 💡 [핵심] 수업 기록(sessions) 서브컬렉션도 함께 이사
          const oldSessionsRef = collection(db, "users", userId, "customers", customerId, "sessions");
          const sessSnap = await getDocs(oldSessionsRef);
          
          await Promise.all(sessSnap.docs.map(async (sDoc) => {
            const newSessRef = doc(db, "users", targetUserId, "customers", customerId, "sessions", sDoc.id);
            await setDoc(newSessRef, sDoc.data());
            await deleteDoc(sDoc.ref); // 원본 삭제
          }));

          await deleteDoc(oldRef).catch(() => {});
          await deleteDoc(rootRef).catch(() => {});
          return;
        }
      }

      const myRef = doc(db, "users", userId, "customers", customerId);
      try {
        await updateDoc(myRef, { ...customerData, updatedAt: serverTimestamp() });
      } catch (e) {
        const rootRef = doc(db, "customers", customerId);
        await updateDoc(rootRef, { ...customerData, updatedAt: serverTimestamp() });
      }
    } catch (error) {
      console.error("업데이트 에러:", error);
      throw error;
    }
  },

  // 삭제
  async deleteCustomer(userId: string, customerId: string) {
    await deleteDoc(doc(db, "users", userId, "customers", customerId)).catch(() => {});
    await deleteDoc(doc(db, "customers", customerId)).catch(() => {});
  },

  async recordClassSession(userId: string, customerId: string, session: any) {
    const sessionsRef = collection(db, "users", userId, "customers", customerId, "sessions");
    // 미래를 위해 customerId를 문서 내부에 포함
    const dRef = await addDoc(sessionsRef, { 
      ...session, 
      userId, 
      customerId,
      completedAt: serverTimestamp() 
    });
    
    const ref = doc(db, "users", userId, "customers", customerId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { totalSessions: ((snap.data() as any).totalSessions || 0) + 1 });
    }
    return dRef;
  },

  async getClassHistory(userId: string, customerId: string): Promise<ClassSession[]> {
    try {
      // 대시보드와 동일한 쿼리 사용 (인덱스 보장됨)
      const sessionsRef = collectionGroup(db, "sessions");
      const q = query(sessionsRef, where("userId", "==", userId));
      const snap = await getDocs(q);
      
      const filtered = snap.docs
        .filter(d => {
          const s = d.data();
          const cid = s.customerId;
          const path = d.ref.path;
          
          // 1. 문서 내부의 customerId 필드로 매칭
          if (cid === customerId) return true;
          // 2. 데이터베이스 경로상에 포함된 ID로 매칭 (가장 확실함)
          if (path.includes(`customers/${customerId}/`)) return true;
          return false;
        })
        .map(d => ({ id: d.id, ...d.data() }));

      // 문서 ID가 동일한 경우 하나만 남김 (이관 시 중복 생성 방지)
      const uniqueSessions = Array.from(
        new Map(filtered.map(s => [s.id, s])).values()
      );

      return uniqueSessions.sort((a: any, b: any) => {
        const tA = new Date(a.startTime).getTime();
        const tB = new Date(b.startTime).getTime();
        return tB - tA;
      }) as ClassSession[];
    } catch (error) { 
      console.error("이력 조회 에러:", error);
      return []; 
    }
  },

  async deleteClassSession(userId: string, customerId: string, sessionId: string) {
    const ref = doc(db, "users", userId, "customers", customerId, "sessions", sessionId);
    await deleteDoc(ref).catch(() => {});
    
    // 횟수 차감
    const cRef = doc(db, "users", userId, "customers", customerId);
    const cSnap = await getDoc(cRef);
    if (cSnap.exists()) {
      await updateDoc(cRef, { totalSessions: Math.max(0, ((cSnap.data() as any).totalSessions || 0) - 1) });
    }
  },

  // 최근 세션 목록 (대시보드용)
  async getRecentSessions(userId: string, limitCount: number = 20): Promise<any[]> {
    try {
      const customers = await this.getCustomers(userId);
      const allSessions: any[] = [];

      // 모든 고객의 수업 이력을 병렬로 가져옴
      await Promise.all(customers.map(async (c) => {
        if (!c.id) return;
        const history = await this.getClassHistory(userId, c.id);
        history.forEach(s => {
          allSessions.push({
            ...s,
            customerName: c.name,
            customerNickname: c.nickname
          });
        });
      }));

      // 최신순 정렬 후 개수 제한
      return allSessions
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, limitCount);
    } catch (error) {
      console.error("최근 세션 조회 에러:", error);
      return [];
    }
  },

  async getMonthlyStats(userId: string, year: number, month: number) {
    try {
      // 1. 해당 유저가 기록한 이번 달의 모든 유니크한 세션 확보
      const sessions = await this.getMonthSessions(userId, year, month);
      
      // 2. 고객 정보 일괄 확보 (단가 계산용)
      const customers = await this.getCustomers(userId);
      const customerMap = new Map(customers.map(c => [c.id, c]));

      let totalRevenue = 0;
      let sessionCount = sessions.length;

      // 3. 각 세션별로 해당 고객의 단가를 찾아 합산
      sessions.forEach(session => {
        const customer = customerMap.get(session.customerId);
        if (customer && customer.unitPrice) {
          totalRevenue += Number(customer.unitPrice);
        }
      });

      return {
        sessionCount,
        totalRevenue
      };
    } catch (error) {
      console.error("통계 조회 에러:", error);
      return { sessionCount: 0, totalRevenue: 0 };
    }
  },

  // 특정 월의 모든 세션 목록 (대시보드 상세용)
  async getMonthSessions(userId: string, year: number, month: number): Promise<any[]> {
    try {
      // 💡 [핵심 개선] 특정 고객의 경로를 통하지 않고, 유저가 등록한 모든 세션을 전체 조회(collectionGroup)
      // 이렇게 하면 고객이 이관되어 폴더가 바뀌었더라도 내가 쓴 기록은 다 찾아옵니다.
      const sessionsRef = collectionGroup(db, "sessions");
      const q = query(sessionsRef, where("userId", "==", userId));
      const snap = await getDocs(q);
      
      const allSessions: any[] = [];
      const startDate = new Date(year, month, 1, 0, 0, 0);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      // 필터링 및 이름 보완
      for (const d of snap.docs) {
        const s = d.data() as any;
        if (!s.startTime) continue;
        
        const sDate = new Date(s.startTime);
        if (sDate.getTime() >= startDate.getTime() && sDate.getTime() <= endDate.getTime()) {
          // 💡 [데이터 보정] 문서 내부에 customerId가 없으면 경로에서 추출
          const customerIdFromPath = d.ref.parent.parent?.id;
          const customerId = s.customerId || customerIdFromPath;
          
          let customerName = s.customerName || "알 수 없는 고객";

          allSessions.push({
            id: d.id,
            ...s,
            customerId,
            customerName
          });
        }
      }

      // 💡 [중복 제거] 동일한 ID를 가진 세션이 여러 경로에서 발견될 경우 하나만 유지
      const uniqueSessions = Array.from(
        new Map(allSessions.map(s => [s.id, s])).values()
      );

      return uniqueSessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    } catch (error) {
      console.error("월간 세션 조회 에러:", error);
      return [];
    }
  }
};
