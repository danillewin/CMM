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
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider initialized');
    
    // Check if we're in development mode (no VITE_KEYCLOAK_URL)
    const isDevelopmentMode = !import.meta.env.VITE_KEYCLOAK_URL;
    
    if (isDevelopmentMode) {
      // In development mode, always set up mock authentication
      console.log('Development mode: Using mock authentication');
      const userInfo = getUserInfo();
      const userToken = getToken();
      
      setIsAuthenticated(true);
      setUser(userInfo);
      setToken(userToken || null);
      setIsInitialized(true);
      setIsLoading(false);
    } else {
      // In production mode, require Keycloak authentication
      console.log('Production mode: Checking Keycloak authentication');
      
      // Initialize Keycloak with callback
      initKeycloak(() => {
        // This callback is called when authentication is successful
        const userInfo = getUserInfo();
        const userToken = getToken();
        
        if (isLoggedIn()) {
          setIsAuthenticated(true);
          setUser(userInfo);
          setToken(userToken || null);
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setToken(null);
          // Automatically redirect to login if not authenticated
          console.log('No valid token found, redirecting to login');
          doLogin();
          return; // Don't set initialized yet
        }
        
        setIsInitialized(true);
        setIsLoading(false);
      });
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
        isLoading,
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