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
  Timestamp
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
  }
};
