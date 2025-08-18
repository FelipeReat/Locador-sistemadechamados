
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'USER' | 'AGENT' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Verificar validade do token
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Token inválido');
      })
      .then(userData => {
        setUser(userData);
        console.log('Usuário autenticado:', userData.username, 'Role:', userData.role);
      })
      .catch(error => {
        console.error('Erro ao verificar token:', error);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    try {
      console.log('Tentando fazer login com:', username);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Erro no login:', error);
        throw new Error(error.message || 'Erro no login');
      }

      const { user, token } = await response.json();
      
      console.log('Login bem-sucedido:', user.username, 'Role:', user.role);
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      
      // Navegação baseada no role
      setTimeout(() => {
        if (user.role === 'ADMIN' || user.role === 'AGENT') {
          window.location.href = '/support';
        } else {
          window.location.href = '/tickets';
        }
      }, 100);

    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
