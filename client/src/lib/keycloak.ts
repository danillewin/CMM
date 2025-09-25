// Check if we're in development mode without Keycloak server
const isDevelopmentMode = true; // Always use development mode for now

// Mock user for development
const mockUser = {
  username: 'dev-user',
  email: 'dev@example.com',
  name: 'Development User',
  sub: 'dev-user-id',
  roles: ['user'],
};

let isAuthenticated = isDevelopmentMode;

// Keycloak configuration (unused in development mode)
const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'master',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'research-app',
};

// Keycloak instance (always null in development mode)
let keycloak: any = null;

export default keycloak;

// Helper functions
export const initKeycloak = (onAuthenticatedCallback: () => void) => {
  if (isDevelopmentMode) {
    // In development mode, immediately call authenticated callback
    console.log('Development mode: Using mock authentication');
    isAuthenticated = true;
    onAuthenticatedCallback();
    return;
  }

  if (!keycloak) {
    console.error('Keycloak not initialized');
    return;
  }

  keycloak
    .init({
      onLoad: 'check-sso', // Check if user is already logged in
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256', // Use PKCE for security
    })
    .then((authenticated: boolean) => {
      isAuthenticated = authenticated;
      if (authenticated) {
        onAuthenticatedCallback();
      }
    })
    .catch((error: any) => {
      console.error('Keycloak initialization failed:', error);
    });
};

export const doLogin = () => {
  if (isDevelopmentMode) {
    console.log('Development mode: Mock login');
    isAuthenticated = true;
    window.location.reload(); // Refresh to trigger auth state change
    return;
  }

  if (keycloak) {
    keycloak.login();
  }
};

export const doLogout = () => {
  if (isDevelopmentMode) {
    console.log('Development mode: Mock logout');
    isAuthenticated = false;
    window.location.reload();
    return;
  }

  if (keycloak) {
    keycloak.logout();
  }
};

export const getToken = () => {
  if (isDevelopmentMode) {
    return 'mock-token-dev-user';
  }
  return keycloak?.token;
};

export const isLoggedIn = () => {
  if (isDevelopmentMode) {
    return isAuthenticated;
  }
  return !!keycloak?.token;
};

export const updateToken = (successCallback: () => void) => {
  if (isDevelopmentMode) {
    successCallback();
    return Promise.resolve(true);
  }

  if (!keycloak) {
    return Promise.reject('Keycloak not initialized');
  }

  return keycloak
    .updateToken(5)
    .then(successCallback)
    .catch(doLogin);
};

export const getUsername = () => {
  if (isDevelopmentMode) {
    return mockUser.username;
  }
  return keycloak?.tokenParsed?.preferred_username || keycloak?.tokenParsed?.sub;
};

export const getUserInfo = () => {
  if (isDevelopmentMode) {
    return mockUser;
  }

  return {
    username: keycloak?.tokenParsed?.preferred_username || 'anonymous',
    email: keycloak?.tokenParsed?.email,
    name: keycloak?.tokenParsed?.name,
    sub: keycloak?.tokenParsed?.sub,
    roles: keycloak?.tokenParsed?.realm_access?.roles || [],
  };
};