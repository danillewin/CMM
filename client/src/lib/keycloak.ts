import Keycloak from 'keycloak-js';

// Keycloak configuration
const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'master',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'research-app',
};

// Initialize Keycloak instance
const keycloak = new Keycloak(keycloakConfig);

export default keycloak;

// Helper functions
export const initKeycloak = (onAuthenticatedCallback: () => void) => {
  keycloak
    .init({
      onLoad: 'check-sso', // Check if user is already logged in
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256', // Use PKCE for security
    })
    .then((authenticated) => {
      if (authenticated) {
        onAuthenticatedCallback();
      }
    })
    .catch((error) => {
      console.error('Keycloak initialization failed:', error);
    });
};

export const doLogin = () => {
  keycloak.login();
};

export const doLogout = () => {
  keycloak.logout();
};

export const getToken = () => {
  return keycloak.token;
};

export const isLoggedIn = () => {
  return !!keycloak.token;
};

export const updateToken = (successCallback: () => void) => {
  return keycloak
    .updateToken(5)
    .then(successCallback)
    .catch(doLogin);
};

export const getUsername = () => {
  return keycloak.tokenParsed?.preferred_username || keycloak.tokenParsed?.sub;
};

export const getUserInfo = () => {
  return {
    username: keycloak.tokenParsed?.preferred_username || 'anonymous',
    email: keycloak.tokenParsed?.email,
    name: keycloak.tokenParsed?.name,
    sub: keycloak.tokenParsed?.sub,
    roles: keycloak.tokenParsed?.realm_access?.roles || [],
  };
};