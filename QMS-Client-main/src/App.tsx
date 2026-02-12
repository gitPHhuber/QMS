import "./App.css";
import { Header } from "components/Header/Header";
import { AppRouter } from "components/AppRouter";
import { observer } from "mobx-react-lite";
import { useContext, useEffect, useState, useRef } from "react";
import { Context, getSavedPath, clearSavedPath } from "./main";
import { Preloader } from "./components/common/Preloader";
import { useAppAuth as useAuth } from "./hooks/useAppAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { SELECT_PC_ROUTE } from "./utils/consts";
import { check } from "./api/userApi";
import { Toaster } from 'react-hot-toast';
import { LoginPage } from "./pages/Login/LoginPage";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

const App = observer(() => {
  const auth = useAuth();
  const context = useContext(Context);
  const navigate = useNavigate();
  const location = useLocation();

  const [isUserLoading, setIsUserLoading] = useState(auth.isAuthenticated);


  const hasRestoredPath = useRef(false);


  const initialPathRef = useRef<string | null>(null);

  useEffect(() => {

    if (initialPathRef.current === null) {
      const currentPath = window.location.pathname + window.location.search;

      const hasOidcParams = window.location.search.includes('code=') ||
                            window.location.search.includes('state=');
      if (currentPath !== "/" && !hasOidcParams) {
        initialPathRef.current = currentPath;
      }
    }
  }, []);

  if (!context) throw new Error("Context required");
  const { user, modules } = context;


  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      localStorage.setItem('token', auth.user.access_token);
      setIsUserLoading(true);

      // Load modules config
      if (!modules.config) {
        modules.fetchModules();
      }

      check()
        .then((userData) => {
            user.setUser(userData);
            user.setIsAuth(true);


            const pcId = localStorage.getItem('pcID');


            if (!hasRestoredPath.current) {
              hasRestoredPath.current = true;


              const savedPath = getSavedPath();
              const targetPath = initialPathRef.current || savedPath;


              if (savedPath) {
                clearSavedPath();
              }


              const currentPath = location.pathname;

              if (targetPath && targetPath !== "/" && targetPath !== currentPath) {

                console.log(`[App] Восстанавливаем путь: ${targetPath}`);
                navigate(targetPath, { replace: true });
              } else if (!pcId && currentPath !== SELECT_PC_ROUTE && currentPath === "/") {


                console.log(`[App] Нет pcID, редирект на выбор ПК`);
                navigate(SELECT_PC_ROUTE, { replace: true });
              }

            }
        })
        .catch((err) => {
            console.error("❌ Failed to fetch user profile:", err);
        })
        .finally(() => setIsUserLoading(false));

    } else if (!auth.isLoading && !auth.isAuthenticated) {
      user.resetUser();
      localStorage.removeItem('token');
      localStorage.removeItem('userID');
      setIsUserLoading(false);
      hasRestoredPath.current = false;
      initialPathRef.current = null;
    }
  }, [auth.isAuthenticated, auth.user, user, navigate, location.pathname]);


  if (auth.isLoading || isUserLoading) {
    return <Preloader />;
  }


  if (!auth.isAuthenticated) {
    return <LoginPage onLogin={() => auth.signinRedirect()} />;
  }


  return (
    <div className="bg-[#0b1120] min-h-screen flex flex-col">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0f172a',
            color: '#e2e8f0',
            borderRadius: '12px',
            border: '1px solid #334155',
          },
        }}
      />
      <Header />
      <main className="flex-1 overflow-auto pb-4 pt-14">
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
      </main>
    </div>
  );
});

export default App;
