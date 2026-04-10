import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp,
  increment,
  collectionGroup,
  where,
  limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Customer {
  id?: string;
  name: string;
  nickname: string;
  phone: string;
  status: 'active' | 'pending';
  memo?: string;
  date?: string;
  createdAt?: any;
  totalSessions?: number;
}

export interface ClassSession {
  id?: string;
  googleEventId?: string;
  eventTitle: string;
  startTime: string;
  endTime: string;
  completedAt: any;
}

export const customerService = {
  async getCustomers(userId: string): Promise<Customer[]> {
    const customersRef = collection(db, "users", userId, "customers");
    const q = query(customersRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Customer));
  },

  async addCustomer(userId: string, customer: Omit<Customer, 'id' | 'createdAt'>) {
    const customersRef = collection(db, "users", userId, "customers");
    return await addDoc(customersRef, {
      ...customer,
      date: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
    });
  },

  async updateCustomer(userId: string, customerId: string, customer: Partial<Customer>) {
    const customerRef = doc(db, "users", userId, "customers", customerId);
    return await updateDoc(customerRef, customer);
  },

  async deleteCustomer(userId: string, customerId: string) {
    const customerRef = doc(db, "users", userId, "customers", customerId);
    return await deleteDoc(customerRef);
  },

  async recordClassSession(userId: string, customerId: string, session: Omit<ClassSession, 'id' | 'completedAt'>) {
    try {
      const sessionsRef = collection(db, "users", userId, "customers", customerId, "sessions");
      const customerRef = doc(db, "users", userId, "customers", customerId);
      
      await addDoc(sessionsRef, {
        ...session,
        userId: userId, // Added for collectionGroup query
        completedAt: serverTimestamp(),
      });

      return await updateDoc(customerRef, {
        totalSessions: increment(1)
      });
    } catch (error) {
      console.error("Firestore recordClassSession Service Error:", error);
      throw error;
    }
  },

  async getClassHistory(userId: string, customerId: string): Promise<ClassSession[]> {
    const sessionsRef = collection(db, "users", userId, "customers", customerId, "sessions");
    const q = query(sessionsRef, orderBy("completedAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as ClassSession));
  },

  async deleteClassSession(userId: string, customerId: string, sessionId: string) {
    const sessionRef = doc(db, "users", userId, "customers", customerId, "sessions", sessionId);
    const customerRef = doc(db, "users", userId, "customers", customerId);
    
    await deleteDoc(sessionRef);
    
    return await updateDoc(customerRef, {
      totalSessions: increment(-1)
    });
  },

  async getRecentSessions(userId: string, limitCount: number = 5): Promise<ClassSession[]> {
    try {
      const sessionsRef = collectionGroup(db, "sessions");
      const q = query(
        sessionsRef, 
        where("userId", "==", userId),
        orderBy("completedAt", "desc"),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as ClassSession));
    } catch (error) {
      console.error("Firestore getRecentSessions Error:", error);
      // Fallback: If index is not yet created, return empty array
      return [];
    }
  }
};
