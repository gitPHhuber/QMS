import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/dm-sans";
import "@fontsource/instrument-serif";
import "@fontsource/instrument-serif/400-italic.css";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "react-oidc-context";
import UserStore from "./store/UserStore.ts";
import StructureStore from "./store/StructureStore.ts";
import ModuleStore from "./store/ModuleStore.ts";


interface IContext {
  user: UserStore;
  structureStore: StructureStore;
  modules: ModuleStore;
}

export const Context = React.createContext<IContext | null>(null);


const REDIRECT_PATH_KEY = "qms_redirect_path";


const saveCurrentPath = () => {
  const currentPath = window.location.pathname + window.location.search;


  const hasOidcParams = window.location.search.includes('code=') ||
                        window.location.search.includes('state=');

  if (currentPath !== "/" &&
      !currentPath.includes("/login") &&
      !hasOidcParams) {
    sessionStorage.setItem(REDIRECT_PATH_KEY, currentPath);
  }
};


export const getSavedPath = (): string | null => {
  return sessionStorage.getItem(REDIRECT_PATH_KEY);
};


export const clearSavedPath = () => {
  sessionStorage.removeItem(REDIRECT_PATH_KEY);
};


saveCurrentPath();


const oidcConfig = {
  authority: `${import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080'}/realms/${import.meta.env.VITE_KEYCLOAK_REALM || 'QMS-Realm'}`,
  client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'qms-web-client',
  redirect_uri: window.location.origin + "/",
  post_logout_redirect_uri: window.location.origin + "/",
  response_type: "code",
  onSigninCallback: () => {
    const savedPath = getSavedPath();
    window.history.replaceState({}, document.title, savedPath || "/");
  }
};


const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || 'keycloak';

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  if (AUTH_MODE === 'dev-bypass') {
    return <>{children}</>;
  }
  return <AuthProvider {...oidcConfig}>{children}</AuthProvider>;
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Context.Provider
      value={{
        user: new UserStore(),
        structureStore: new StructureStore(),
        modules: new ModuleStore(),
      }}
    >
      <BrowserRouter>
        <AuthWrapper>
          <App />
        </AuthWrapper>
      </BrowserRouter>
    </Context.Provider>
  </React.StrictMode>
);
