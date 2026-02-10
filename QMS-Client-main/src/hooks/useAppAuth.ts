import { useAuth as useOidcAuth } from "react-oidc-context";

const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || 'keycloak';

const devAuth = {
  isAuthenticated: true,
  isLoading: false,
  user: {
    access_token: 'dev-bypass-token',
    profile: {
      sub: 'dev-user-001',
      preferred_username: 'developer',
      given_name: 'Dev',
      family_name: 'User',
      realm_access: { roles: ['SUPER_ADMIN'] },
    },
  },
  signinRedirect: () => Promise.resolve(),
  signoutRedirect: () => {
    window.location.href = '/';
    return Promise.resolve();
  },
  error: null,
};

export function useAppAuth() {
  if (AUTH_MODE === 'dev-bypass') {
    return devAuth as any;
  }
  return useOidcAuth();
}
