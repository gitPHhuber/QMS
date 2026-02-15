const TOKEN_KEY = 'als_portal_token';
const ORG_KEY = 'als_portal_org';
const ORG_NAME_KEY = 'als_portal_org_name';

export const portalStore = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getOrgId(): string | null {
    return localStorage.getItem(ORG_KEY);
  },

  getOrgName(): string | null {
    return localStorage.getItem(ORG_NAME_KEY);
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  login(token: string, orgId: string, orgName?: string) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ORG_KEY, orgId);
    if (orgName) {
      localStorage.setItem(ORG_NAME_KEY, orgName);
    }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ORG_KEY);
    localStorage.removeItem(ORG_NAME_KEY);
    window.location.href = '/login';
  },
};
