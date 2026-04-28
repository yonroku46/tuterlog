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
  isShared?: boolean;
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
  // 소속(Organization) ID 가져오기
  async getUserOrgId(userId: string): Promise<string> {
    if (!userId) return "";
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      let orgId = userId;
      if (userDoc.exists() && userDoc.data().organizationId) {
        orgId = userDoc.data().organizationId;
      }

      // 소속장이 내가 아닌 경우, 소속장 쪽의 member_ 리스트에 아직 있는지 확인 (강제 퇴출 처리용)
      if (orgId !== userId) {
        try {
          const mDoc = await getDoc(doc(db, "users", orgId, "customers", "member_" + userId));
          if (!mDoc.exists()) {
            return userId; // 소속장이 퇴출했으므로 내 개인 모드로 폴백
          }
        } catch (e) {} // 권한 등으로 에러 시 무시
      }

      return orgId;
    } catch (e) {
      console.error(e);
    }
    return userId; // 기본적으로 자기 자신이 소속장
  },

  // 소속원 목록 가져오기 (마스터용)
  async getOrganizationMembers(orgId: string): Promise<any[]> {
    try {
      const q = query(collection(db, "users"), where("organizationId", "==", orgId));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("소속원 조회 에러:", error);
      return [];
    }
  },

  // 고객 목록 조회 (플랫 구조 기반)
  async getCustomers(userId: string): Promise<Customer[]> {
    if (!userId) return [];
    try {
      const orgId = await this.getUserOrgId(userId);
      const isMaster = orgId === userId;
      
      // 1. 루트 고객 폴더에서 소속 고객 모두 조회
      const rootQ_org = query(collection(db, "customers"), where("organizationId", "==", orgId));
      let rootDocs: any[] = [];
      try {
        const rootSnap = await getDocs(rootQ_org);
        rootDocs = rootSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {
        console.warn("루트 폴더 조회 실패:", e);
      }

      // 1-5. 예전 버전에서 생성되어 organizationId가 없는 루트 고객 조회 (유실 방지)
      const rootQ_owner = query(collection(db, "customers"), where("ownerId", "==", userId));
      try {
        const rootOwnerSnap = await getDocs(rootQ_owner);
        rootOwnerSnap.docs.forEach(doc => {
          if (!rootDocs.some(rd => rd.id === doc.id)) {
            rootDocs.push({ id: doc.id, ...doc.data() });
          }
        });
      } catch (e) {}

      // 2. 기존 개인 폴더의 고객 조회 (과도기 및 권한 에러 폴백)
      const myQ = collection(db, "users", userId, "customers");
      let myDocs: any[] = [];
      try {
        const mySnap = await getDocs(myQ);
        myDocs = mySnap.docs
          .filter(d => d.id !== 'config' && !d.id.startsWith('member_'))
          .map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {}

      // 병합 및 중복 제거
      const combined = [...rootDocs];
      myDocs.forEach(md => {
        if (!combined.some(cd => cd.id === md.id)) combined.push(md);
      });

      const parsedData = combined as Customer[];
      let filteredData = parsedData;

      // 소속장이 아니면(소속원이면) 내 고객이거나 공유된 고객만 보임
      if (!isMaster) {
        filteredData = parsedData.filter(c => c.ownerId === userId || c.isShared === true);
      }

      return filteredData.sort((a: any, b: any) => {
        const dA = (a.createdAt?.toDate?.() || new Date(0)).getTime();
        const dB = (b.createdAt?.toDate?.() || new Date(0)).getTime();
        return dB - dA;
      });
    } catch (error) {
      console.error("고객 조회 에러:", error);
      return [];
    }
  },

  // 전체 유저 목록 (마스터가 소속원 초대시 사용 가능)
  async getAllUsers(): Promise<any[]> {
    const now = Date.now();
    if (now - lastFetchTime < FETCH_COOLDOWN && (window as any)._cachedUsers) return (window as any)._cachedUsers;

    try {
      const usersS = await getDocs(collection(db, "users"));
      const users = usersS.docs.map(doc => {
        const d = doc.data() as any;
        return { id: doc.id, name: d.name || d.displayName || "", email: d.email || "" };
      });
      const results = users.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      (window as any)._cachedUsers = results;
      lastFetchTime = Date.now();
      return results;
    } catch (error) { return []; }
  },

  // 고객 추가 (루트 폴더)
  async addCustomer(userId: string, customerData: Omit<Customer, 'id' | 'createdAt'>) {
    const orgId = await this.getUserOrgId(userId);
    
    // 루트 폴더에 저장 (플랫 구조)
    const customersRef = collection(db, "customers");
    const dRef = await addDoc(customersRef, {
      ...customerData,
      ownerId: userId,
      organizationId: orgId,
      createdAt: serverTimestamp(),
      totalSessions: 0
    });

    // 혹시 모를 기존 구버전 코드 호환성을 위해 내 폴더에도 저장
    await setDoc(doc(db, "users", userId, "customers", dRef.id), {
      ...customerData,
      ownerId: userId,
      organizationId: orgId,
      createdAt: serverTimestamp(),
      totalSessions: 0
    }).catch(() => {});

    return dRef;
  },

  // 고객 정보 수정 (양쪽 폴더 모두 덮어쓰기)
  async updateCustomer(userId: string, customerId: string, customerData: Partial<Customer>) {
    try {
      const orgId = await this.getUserOrgId(userId);
      const updateData = { ...customerData, organizationId: orgId, updatedAt: serverTimestamp() };

      // 1. 루트 폴더 업데이트
      const rootRef = doc(db, "customers", customerId);
      await updateDoc(rootRef, updateData).catch(() => {
        // 루트 폴더에 문서가 없으면 생성 시도
        setDoc(rootRef, updateData, { merge: true }).catch(() => {});
      });

      // 2. 내 폴더 업데이트 (과거 데이터 호환)
      const myRef = doc(db, "users", userId, "customers", customerId);
      await updateDoc(myRef, updateData).catch(() => {});
      
      // 3. 소속장의 폴더에도 혹시 복사본이 있다면 업데이트 (이전 동기화 호환)
      if (orgId !== userId) {
        await updateDoc(doc(db, "users", orgId, "customers", customerId), updateData).catch(() => {});
      }
    } catch (error) {
      console.error("업데이트 에러:", error);
      throw error;
    }
  },

  // 삭제 (양쪽 모두 삭제)
  async deleteCustomer(userId: string, customerId: string) {
    const orgId = await this.getUserOrgId(userId);
    
    // 루트 폴더 삭제
    await deleteDoc(doc(db, "customers", customerId)).catch(() => {});
    
    // 내 폴더 삭제
    await deleteDoc(doc(db, "users", userId, "customers", customerId)).catch(() => {});
    
    // 소속장 폴더 삭제 (이전 동기화 호환)
    if (orgId !== userId) {
      await deleteDoc(doc(db, "users", orgId, "customers", customerId)).catch(() => {});
    }
  },

  async recordClassSession(userId: string, customerId: string, session: any) {
    const orgId = await this.getUserOrgId(userId);
    
    // 루트 sessions 컬렉션에 추가
    const sessionsRef = collection(db, "sessions");
    const dRef = await addDoc(sessionsRef, { 
      ...session, 
      userId, 
      customerId,
      organizationId: orgId,
      completedAt: serverTimestamp() 
    });
    
    // 호환성을 위해 내 폴더에도 기록 시도
    await setDoc(doc(db, "users", userId, "customers", customerId, "sessions", dRef.id), { 
      ...session, userId, customerId, completedAt: serverTimestamp() 
    }).catch(() => {});

    // 루트 고객 횟수 업데이트
    const rootCRef = doc(db, "customers", customerId);
    getDoc(rootCRef).then(s => {
      if (s.exists()) updateDoc(rootCRef, { totalSessions: ((s.data() as any).totalSessions || 0) + 1 }).catch(() => {});
    }).catch(() => {});

    // 내 폴더 고객 횟수 업데이트
    const myCRef = doc(db, "users", userId, "customers", customerId);
    getDoc(myCRef).then(s => {
      if (s.exists()) updateDoc(myCRef, { totalSessions: ((s.data() as any).totalSessions || 0) + 1 }).catch(() => {});
    }).catch(() => {});

    return dRef;
  },

  async getClassHistory(userId: string, customerId: string): Promise<ClassSession[]> {
    try {
      // 모든 세션을 customerId 기준으로 싹 가져옵니다. (루트든 하위든 상관없이)
      const sessionsRef = collectionGroup(db, "sessions");
      const q = query(sessionsRef, where("customerId", "==", customerId));
      const snap = await getDocs(q);
      
      const filtered = snap.docs
        .filter(d => {
          const s = d.data();
          const cid = s.customerId;
          const path = d.ref.path;
          
          if (cid === customerId) return true;
          if (path.includes(`customers/${customerId}/`)) return true;
          return false;
        })
        .map(d => ({ id: d.id, ...d.data() }));

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
    // 루트 삭제
    const rootSessRef = doc(db, "sessions", sessionId);
    await deleteDoc(rootSessRef).catch(() => {});
    
    // 구 데이터 삭제
    const mySessRef = doc(db, "users", userId, "customers", customerId, "sessions", sessionId);
    await deleteDoc(mySessRef).catch(() => {});
    
    // 루트 고객 횟수 차감
    const rootCRef = doc(db, "customers", customerId);
    getDoc(rootCRef).then(s => {
      if (s.exists()) updateDoc(rootCRef, { totalSessions: Math.max(0, ((s.data() as any).totalSessions || 0) - 1) }).catch(() => {});
    }).catch(() => {});

    // 내 폴더 횟수 차감
    const myCRef = doc(db, "users", userId, "customers", customerId);
    getDoc(myCRef).then(s => {
      if (s.exists()) updateDoc(myCRef, { totalSessions: Math.max(0, ((s.data() as any).totalSessions || 0) - 1) }).catch(() => {});
    }).catch(() => {});
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
