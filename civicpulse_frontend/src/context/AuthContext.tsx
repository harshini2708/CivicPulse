import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { mockUsers } from '../utils/mockData';

interface AuthContextType {
  currentUser: UserProfile;
  currentRole: UserRole;
  portalMode: 'landing' | 'citizen' | 'worker' | 'admin';
  setPortalMode: (mode: 'landing' | 'citizen' | 'worker' | 'admin') => void;
  switchRole: (role: UserRole) => void;
  loginAsWorker: (email: string, password: string) => boolean;
  loginAsAdmin: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('citizen');
  const [currentUser, setCurrentUser] = useState<UserProfile>(mockUsers.citizen);
  const [portalMode, setPortalMode] = useState<'landing' | 'citizen' | 'worker' | 'admin'>('landing');

  useEffect(() => {
    setCurrentUser(mockUsers[currentRole] || mockUsers.citizen);
  }, [currentRole]);

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    setCurrentUser(mockUsers[role]);
    setPortalMode(role);
  };

  // ✅ Accepts any email + password — no validation needed for demo
  const loginAsWorker = (email: string, _password: string): boolean => {
    setCurrentRole('worker');
    setCurrentUser({
      ...mockUsers.worker,
      email: email || mockUsers.worker.email,
      name: email ? email.split('@')[0] : mockUsers.worker.name,
    });
    setPortalMode('worker');
    return true;
  };

  // ✅ Accepts any email + password — no validation needed for demo
  const loginAsAdmin = (email: string, _password: string): boolean => {
    setCurrentRole('admin');
    setCurrentUser({
      ...mockUsers.admin,
      email: email || mockUsers.admin.email,
      name: email ? email.split('@')[0] : mockUsers.admin.name,
    });
    setPortalMode('admin');
    return true;
  };

  const logout = () => {
    setCurrentRole('citizen');
    setCurrentUser(mockUsers.citizen);
    setPortalMode('landing');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        portalMode,
        setPortalMode,
        switchRole,
        loginAsWorker,
        loginAsAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
