import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import keycloak, { initKeycloak, getUserInfo, isLoggedIn, doLogin, doLogout } from '@/lib/keycloak';

interface UserInfo {
  username: string;
  email?: string;
  name?: string;
  sub?: string;
  roles: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserInfo | null;
  login: () => void;
  logout: () => void;
  token: string | null;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserInfo | null>({
    username: 'anonymous',
    roles: []
  });
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(true); // Start as initialized for debugging

  useEffect(() => {
    // Simplified initialization - set as anonymous by default
    console.log('AuthProvider initialized');
    
    // TODO: Add Keycloak initialization here later
    // For now, just set anonymous user
    setIsAuthenticated(false);
    setUser({
      username: 'anonymous',
      roles: []
    });
    setIsInitialized(true);
  }, []);

  const handleLogin = () => {
    doLogin();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser({
      username: 'anonymous',
      roles: []
    });
    setToken(null);
    doLogout();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login: handleLogin,
        logout: handleLogout,
        token,
        isInitialized,
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

// Hook for getting the current user, defaulting to anonymous if not authenticated
export function useCurrentUser() {
  const { user, isAuthenticated } = useAuth();
  
  return {
    username: user?.username || 'anonymous',
    email: user?.email,
    name: user?.name,
    sub: user?.sub,
    roles: user?.roles || [],
    isAuthenticated,
  };
}