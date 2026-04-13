"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithCredential, signOut, User, GoogleAuthProvider } from "firebase/auth";
import { useGoogleLogin } from '@react-oauth/google';
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

  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
    onSuccess: async ({ code }) => {
      try {
        const response = await fetch('/api/auth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        if (data.id_token) {
          const credential = GoogleAuthProvider.credential(data.id_token);
          const result = await signInWithCredential(auth, credential);
          
          setGoogleAccessToken(data.access_token);
          if (data.access_token) localStorage.setItem('googleAccessToken', data.access_token);
          
          if (result.user && data.refresh_token) {
            const configDocRef = doc(db, "users", result.user.uid, "customers", "config");
            await setDoc(configDocRef, { googleRefreshToken: data.refresh_token }, { merge: true });
          }
        }
      } catch (error) {
        console.error("Login exchange failed:", error);
      }
    },
    onError: errorResponse => console.error("Google Login Failed", errorResponse),
  });

  const loginWithGoogle = async () => {
    googleLogin();
  };

  const refreshGoogleAccessToken = React.useCallback(async (uid: string) => {
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
  }, []);

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

  const isRefreshing = React.useRef(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('googleAccessToken');
    if (savedToken) setGoogleAccessToken(savedToken);

    const handleSessionExpired = async () => {
      // If we are already refreshing, don't start another one
      if (isRefreshing.current) return;

      // If we have a user, try to refresh the Google token first
      if (auth.currentUser) {
        isRefreshing.current = true;
        try {
          console.log("Google session expired. Attempting refresh...");
          const refreshed = await refreshGoogleAccessToken(auth.currentUser.uid);
          if (refreshed) {
            console.log("Token refreshed successfully. Resuming session.");
            return;
          }
        } finally {
          isRefreshing.current = false;
        }
      }
      
      console.warn("Session truly expired or refresh failed. Logging out.");
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
          
          // Save basic user info for system user listing
          const userDocRef = doc(db, "users", firebaseUser.uid);
          await setDoc(userDocRef, { 
            email: firebaseUser.email, 
            name: firebaseUser.displayName || '이름 없음'
          }, { merge: true }).catch(err => console.error(err));

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
  }, [router, refreshGoogleAccessToken]);

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
