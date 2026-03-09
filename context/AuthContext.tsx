'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserProfileDto, UserRole } from '@/lib/types';

interface AuthContextType {
  user:       UserProfileDto | null;
  role:       UserRole | null;
  isLoading:  boolean;
  isCandidate: boolean;
  isEmployer:  boolean;
  isAdmin:     boolean;
  login:      (token: string, user: UserProfileDto) => void;
  logout:     () => void;
  updateUser: (user: UserProfileDto) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<UserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('jwt_user');
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setIsLoading(false);
  }, []);

  const role: UserRole | null = (user?.role as UserRole) ?? null;

  const login = (token: string, u: UserProfileDto) => {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('jwt_user',  JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('jwt_user');
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (u: UserProfileDto) => {
    localStorage.setItem('jwt_user', JSON.stringify(u));
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{
      user, role, isLoading,
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
