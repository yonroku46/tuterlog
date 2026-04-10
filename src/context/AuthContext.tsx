"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User, GoogleAuthProvider } from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { DEFAULT_FILTER_KEYWORD } from "@/constants/config";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  googleAccessToken: string | null;
  filterKeyword: string;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateFilterKeyword: (keyword: string) => Promise<void>;
  refreshGoogleAccessToken: (uid: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [filterKeyword, setFilterKeyword] = useState<string>(DEFAULT_FILTER_KEYWORD);
  const router = useRouter();

  const logout = async () => {
    try {
      await signOut(auth);
      setGoogleAccessToken(null);
      setFilterKeyword(DEFAULT_FILTER_KEYWORD);
      localStorage.removeItem('googleAccessToken');
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential) {
        const token = credential.accessToken || null;
        
        // This is the CRITICAL part: capturing the refresh token
        // result._tokenResponse usually contains the refreshToken for Google offline access
        const refreshToken = (result as any)._tokenResponse?.refreshToken || null;

        setGoogleAccessToken(token);
        if (token) localStorage.setItem('googleAccessToken', token);
        
        if (result.user && refreshToken) {
          const configDocRef = doc(db, "users", result.user.uid, "customers", "config");
          await setDoc(configDocRef, { googleRefreshToken: refreshToken }, { merge: true });
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const refreshGoogleAccessToken = async (uid: string) => {
    try {
      const configDocRef = doc(db, "users", uid, "customers", "config");
      const configDoc = await getDoc(configDocRef);
      const refreshToken = configDoc.data()?.googleRefreshToken;

      if (!refreshToken) throw new Error("No refresh token found");

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await response.json();
      if (data.access_token) {
        setGoogleAccessToken(data.access_token);
        localStorage.setItem('googleAccessToken', data.access_token);
        return data.access_token;
      }
      throw new Error("Failed to refresh access token");
    } catch (error) {
      console.error("Token refresh failed:", error);
      return null;
    }
  };

  const updateFilterKeyword = async (keyword: string) => {
    if (!user || !user.uid) return;
    setFilterKeyword(keyword);
    localStorage.setItem(`filterKeyword_${user.uid}`, keyword);
    try {
      const configDocRef = doc(db, "users", user.uid, "customers", "config");
      await setDoc(configDocRef, { filterKeyword: keyword }, { merge: true });
    } catch (error) {
      console.error("Failed to update keyword in Firestore:", error);
      throw error;
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('googleAccessToken');
    if (savedToken) setGoogleAccessToken(savedToken);

    const handleSessionExpired = () => {
      logout();
      router.push("/");
    };
    window.addEventListener('auth-session-expired', handleSessionExpired);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const localFallback = localStorage.getItem(`filterKeyword_${firebaseUser.uid}`);
          if (localFallback) setFilterKeyword(localFallback);
          const configDocRef = doc(db, "users", firebaseUser.uid, "customers", "config");
          const configDoc = await getDoc(configDocRef);
          if (configDoc.exists()) {
            const remoteKeyword = configDoc.data().filterKeyword || DEFAULT_FILTER_KEYWORD;
            setFilterKeyword(remoteKeyword);
            localStorage.setItem(`filterKeyword_${firebaseUser.uid}`, remoteKeyword);
          } else if (localFallback) {
            await setDoc(configDocRef, { filterKeyword: localFallback }, { merge: true }).catch(() => {});
          }
        } catch (error) {
          console.error("Error fetching user settings:", error);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('auth-session-expired', handleSessionExpired);
    };
  }, [router, user]);

  return (
    <AuthContext.Provider value={{ user, loading, googleAccessToken, filterKeyword, loginWithGoogle, logout, updateFilterKeyword, refreshGoogleAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
