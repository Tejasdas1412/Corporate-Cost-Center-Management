import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'ADMIN' | 'BUSINESS_MANAGER' | 'PMO' | 'HOD' | 'EXCO' | 'ISPL_PM';

export interface User {
  email: string;
  displayName: string;
  roles: UserRole[];
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const DUMMY_USERS: Record<string, User> = {
  BUSINESS_MANAGER: {
    email: 'manager@company.com',
    displayName: 'Sarah (Business Manager)',
    roles: ['BUSINESS_MANAGER']
  },
  PMO_ADMIN: {
    email: 'pmo@company.com',
    displayName: 'David (Admin)',
    roles: ['ADMIN', 'PMO']
  },
  ISPL_PM: {
    email: 'ispl-pm@company.com',
    displayName: 'Alex (ISPL PM)',
    roles: ['ISPL_PM']
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('mock_user_data');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('mock_user_data');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('mock_user_data', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mock_user_data');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
