'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readStorage, writeStorage, removeStorage, STORAGE_KEYS } from '@/lib/storage';
import { setCookie, deleteCookie } from '@/lib/cookies';
import type { AuthUser, UserRole } from '@/lib/types';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  pendingPhone: string | null;
  requestOtp: (phone: string) => void;
  verifyOtp: (code: string) => Promise<boolean>;
  loginEmployer: (email: string, password: string) => Promise<boolean>;
  loginAdmin: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persistUser(user: AuthUser | null) {
  if (user) {
    writeStorage(STORAGE_KEYS.auth, user);
    setCookie('as_role', user.role);
    setCookie('as_uid', user.id);
  } else {
    removeStorage(STORAGE_KEYS.auth);
    deleteCookie('as_role');
    deleteCookie('as_uid');
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  useEffect(() => {
    setUser(readStorage<AuthUser | null>(STORAGE_KEYS.auth, null));
    setIsLoading(false);
  }, []);

  const requestOtp = useCallback((phone: string) => {
    setPendingPhone(phone);
  }, []);

  const verifyOtp = useCallback(
    async (code: string) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (code.length !== 6) return false;
      const newUser: AuthUser = {
        id: `cand_${Date.now()}`,
        role: 'candidate',
        name: 'Nouveau Candidat',
        phone: pendingPhone ?? undefined,
      };
      setUser(newUser);
      persistUser(newUser);
      return true;
    },
    [pendingPhone]
  );

  const fakeLogin = useCallback((role: UserRole, email: string) => {
    return async (emailArg: string, password: string) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (!emailArg || !password) return false;
      const newUser: AuthUser = {
        id: `${role}_${Date.now()}`,
        role,
        name: role === 'employer' ? 'Espace Employeur' : 'Administrateur',
        email: emailArg,
      };
      setUser(newUser);
      persistUser(newUser);
      return true;
    };
  }, []);

  const loginEmployer = useCallback(
    (email: string, password: string) => fakeLogin('employer', email)(email, password),
    [fakeLogin]
  );

  const loginAdmin = useCallback(
    (email: string, password: string) => fakeLogin('admin', email)(email, password),
    [fakeLogin]
  );

  const logout = useCallback(() => {
    setUser(null);
    setPendingPhone(null);
    persistUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, pendingPhone, requestOtp, verifyOtp, loginEmployer, loginAdmin, logout }),
    [user, isLoading, pendingPhone, requestOtp, verifyOtp, loginEmployer, loginAdmin, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>');
  return ctx;
}
