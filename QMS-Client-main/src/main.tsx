import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "react-oidc-context";
import UserStore from "./store/UserStore.ts";
import StructureStore from "./store/StructureStore.ts";


interface IContext {
  user: UserStore;
  structureStore: StructureStore;
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
  authority: "http://keycloak.local/realms/MES-Realm",
  client_id: "mes-client",
  redirect_uri: window.location.origin + "/",
  post_logout_redirect_uri: window.location.origin + "/",
  response_type: "code",


  onSigninCallback: () => {

    const savedPath = getSavedPath();


    const cleanUrl = savedPath || "/";

    window.history.replaceState({}, document.title, cleanUrl);


  }
};


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider {...oidcConfig}>
      <BrowserRouter>
        <Context.Provider
          value={{
            user: new UserStore(),
            structureStore: new StructureStore(),
          }}
        >
          <App />
        </Context.Provider>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
