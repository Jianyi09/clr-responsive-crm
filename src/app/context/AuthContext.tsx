import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';

interface User {
  id: string;
  username: string;
  nombre: string;
  rol: 'admin' | 'usuario';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

useEffect(() => {
    const savedUser = localStorage.getItem('crm_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const rawText = await response.text();
      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (parseError) {
        console.warn('Respuesta de login no es JSON válido:', rawText, parseError);
        data = { message: rawText || `Servidor respondió con status ${response.status}` };
      }

      if (response.ok && data.user) {
        const userData: User = {
          id: String(data.user.id),
          username: data.user.username,
          nombre: data.user.nombre,
          rol: data.user.rol,
        };
        setUser(userData);
        localStorage.setItem('crm_user', JSON.stringify(userData));
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Usuario o contraseña incorrectos' };
      }
    } catch (error) {
      console.error('Error de conexión con la API:', error);
      return { success: false, message: 'No se pudo conectar con el servidor.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('crm_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.rol === 'admin', loading }}>
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