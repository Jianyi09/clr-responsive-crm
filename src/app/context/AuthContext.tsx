import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  nombre: string;
  rol: 'admin' | 'usuario';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS = [
  { id: '1', username: 'admin', password: 'admin123', nombre: 'Administrador', rol: 'admin' as const },
  { id: '2', username: 'usuario', password: 'usuario123', nombre: 'Usuario Normal', rol: 'usuario' as const },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('crm_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (username: string, password: string) => {
    const foundUser = USERS.find(
      u => u.username === username && u.password === password
    );
    
    if (foundUser) {
      const userData = {
        id: foundUser.id,
        username: foundUser.username,
        nombre: foundUser.nombre,
        rol: foundUser.rol,
      };
      setUser(userData);
      localStorage.setItem('crm_user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('crm_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.rol === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
