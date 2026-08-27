'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '@/types';
import { User } from '@/types/models';
import { apiLogin, apiLogout, apiRegister, fetchMe, type ApiUser, type AuthResponse } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  consentToDataProcessing: boolean;
}

const TOKEN_STORAGE_KEY = 'greenhub_token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    name: apiUser.name,
    avatarUrl: apiUser.avatarUrl,
    role: apiUser.role,
    phone: apiUser.phone,
    pendingEmail: apiUser.pendingEmail,
    verificationStatus: apiUser.verificationStatus,
    rejectionReason: apiUser.rejectionReason,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    fetchMe(savedToken)
      .then((apiUser) => {
        setUser(toUser(apiUser));
        setToken(savedToken);
      })
      .catch(() => localStorage.removeItem(TOKEN_STORAGE_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  const applyAuthResponse = (res: AuthResponse) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, res.accessToken);
    setToken(res.accessToken);
    setUser(toUser(res.user));
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      applyAuthResponse(await apiLogin(email, password));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      applyAuthResponse(await apiRegister(data));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Отзываем токен на сервере в фоне — даже если запрос не дойдёт (офлайн), клиент
    // разлогинивается сразу, а сам токен всё равно истечёт по сроку действия
    if (token) {
      apiLogout(token).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const refreshUser = async () => {
    if (!token) return;
    const apiUser = await fetchMe(token);
    setUser(toUser(apiUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
