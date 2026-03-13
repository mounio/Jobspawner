'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserProfileDto, UserRole } from '@/lib/types';

interface AuthContextType {
  user:       UserProfileDto | null;
  role:       UserRole | null;
  isLoading:  boolean;
  hasToken:   boolean;
  isCandidate: boolean;
  isEmployer:  boolean;
  isAdmin:     boolean;
  login:      (token: string, user: UserProfileDto, rememberMe?: boolean) => void;
  logout:     () => void;
  updateUser: (user: UserProfileDto) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function clearStoredAuth() {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('jwt_user');
  sessionStorage.removeItem('jwt_token');
  sessionStorage.removeItem('jwt_user');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<UserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken,  setHasToken]  = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('jwt_user') ?? sessionStorage.getItem('jwt_user');
      const storedToken = localStorage.getItem('jwt_token') ?? sessionStorage.getItem('jwt_token');

      if (storedToken && storedUser) {
        setHasToken(true);
        setUser(JSON.parse(storedUser));
      } else {
        clearStoredAuth();
        setHasToken(false);
        setUser(null);
      }
    } catch {}
    setIsLoading(false);
  }, []);

  const role: UserRole | null = (user?.role as UserRole) ?? null;

  const login = (token: string, u: UserProfileDto, rememberMe = false) => {
    clearStoredAuth();
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('jwt_token', token);
    storage.setItem('jwt_user', JSON.stringify(u));
    setHasToken(true);
    setUser(u);
  };

  const logout = () => {
    clearStoredAuth();
    setHasToken(false);
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (u: UserProfileDto) => {
    if (localStorage.getItem('jwt_token')) {
      localStorage.setItem('jwt_user', JSON.stringify(u));
    }
    if (sessionStorage.getItem('jwt_token')) {
      sessionStorage.setItem('jwt_user', JSON.stringify(u));
    }
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{
      user, role, isLoading, hasToken,
      isCandidate: role === 'CANDIDATE',
      isEmployer:  role === 'EMPLOYER',
      isAdmin:     role === 'ADMIN',
      login, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
