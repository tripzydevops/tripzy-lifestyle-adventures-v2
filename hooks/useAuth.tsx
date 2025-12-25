
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { mockUsers } from '../data/mockData';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isAuthor: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('tripzy-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser && pass === 'password123') {
      setUser(foundUser);
      localStorage.setItem('tripzy-user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tripzy-user');
    navigate('/login');
  };
  
  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (user) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('tripzy-user', JSON.stringify(updatedUser));
    }
  }

  const isAuthenticated = !!user;
  const isAdmin = user?.role === UserRole.Administrator;
  const isEditor = user?.role === UserRole.Editor;
  const isAuthor = user?.role === UserRole.Author;

  const value = { user, isAuthenticated, isAdmin, isEditor, isAuthor, login, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
