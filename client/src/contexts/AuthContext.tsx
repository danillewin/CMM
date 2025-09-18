import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import keycloak, { initKeycloak, getUserInfo, isLoggedIn, doLogin, doLogout, getToken } from '@/lib/keycloak';

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
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('AuthProvider initialized');
    
    // Initialize Keycloak with callback
    initKeycloak(() => {
      // This callback is called when authentication is successful
      const userInfo = getUserInfo();
      const userToken = getToken();
      
      setIsAuthenticated(isLoggedIn());
      setUser(userInfo);
      setToken(userToken);
      setIsInitialized(true);
    });

    // Set initial state for development mode or when not authenticated
    if (!isLoggedIn()) {
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      setIsInitialized(true);
    }
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