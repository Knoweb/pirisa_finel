import React, { createContext, useContext, useState } from 'react';
import { LoginResponse } from '../../api/types/auth.types';

interface AuthContextType {
  user: {
    username: string;
    role: string;
    companyId: number;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (response: LoginResponse) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ username: string; role: string; companyId: number; } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (response: LoginResponse) => {
    setUser({
      username: response.details.username,
      role: response.details.Role,
      companyId: response.details.CMPNY_Id,
    });
    setToken(response.details.token);
    setIsAuthenticated(true);
    localStorage.setItem('token', response.details.token);
    // Optionally store user role and company ID
    localStorage.setItem('userRole', response.details.Role);
    localStorage.setItem('companyId', response.details.CMPNY_Id.toString());
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('companyId');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  };
