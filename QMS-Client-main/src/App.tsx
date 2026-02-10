import "./App.css";
import { Header } from "components/Header/Header";
import background from "assets/images/backGroundTest1.svg";
import { AppRouter } from "components/AppRouter";
import { observer } from "mobx-react-lite";
import { useContext, useEffect, useState, useRef } from "react";
import { Context, getSavedPath, clearSavedPath } from "./main";
import { Preloader } from "./components/common/Preloader";
import { useAuth } from "react-oidc-context";
import { useNavigate, useLocation } from "react-router-dom";
import { SELECT_PC_ROUTE } from "./utils/consts";
import { check } from "./api/userApi";
import { ShieldCheck, Lock, Cpu, X } from "lucide-react";
import { Toaster } from 'react-hot-toast';

const App = observer(() => {
  const auth = useAuth();
  const context = useContext(Context);
  const navigate = useNavigate();
  const location = useLocation();

  const [isUserLoading, setIsUserLoading] = useState(auth.isAuthenticated);

  const [showNotification, setShowNotification] = useState(false);
  const [notificationStep, setNotificationStep] = useState(1);


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
  const { user } = context;


  useEffect(() => {
    const timer1 = setTimeout(() => {
        setNotificationStep(1);
        setShowNotification(true);
    }, 1000);

    const timer2 = setTimeout(() => {
        setShowNotification(false);
    }, 5000);

    const timer3 = setTimeout(() => {
        setNotificationStep(2);
        setShowNotification(true);
    }, 5500);

    return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
    };
  }, []);


  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      localStorage.setItem('token', auth.user.access_token);
      setIsUserLoading(true);

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-asvo-dark relative overflow-hidden font-sans">


        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-asvo-accent opacity-10 blur-[100px]"></div>
            <div className="absolute right-0 bottom-0 -z-10 h-[310px] w-[310px] rounded-full bg-teal-600 opacity-10 blur-[100px]"></div>
        </div>


        <div
            className={`absolute top-8 right-8 z-50 transition-all duration-700 transform ${showNotification ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}
        >
            <div className="bg-asvo-dark-2/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-asvo-dark-3/50 max-w-xs relative group cursor-default hover:scale-105 transition-transform duration-300">
                <button
                    onClick={() => setShowNotification(false)}
                    className="absolute top-2 right-2 text-asvo-muted hover:text-asvo-light transition"
                >
                    <X size={14} />
                </button>

                <div className="flex gap-3">

                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-md transition-colors duration-500 ${notificationStep === 1 ? 'bg-gradient-to-br from-asvo-accent to-teal-600' : 'bg-gradient-to-br from-asvo-accent to-cyan-600'}`}>
                        {notificationStep === 1 ? '😇' : '👋'}
                    </div>

                    <div>

                        {notificationStep === 1 && (
                            <div className="animate-fadeIn">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-sm text-asvo-light">Мы стали лучше!</span>
                                </div>
                                <p className="text-xs text-asvo-muted leading-relaxed">
                                    С версией <span className="font-bold text-asvo-accent">2.0</span> работать стало еще удобнее и приятнее.
                                </p>
                            </div>
                        )}


                        {notificationStep === 2 && (
                            <div className="animate-fadeIn">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-sm text-asvo-light">Обновление QMS</span>
                                    <span className="text-[10px] text-asvo-muted bg-asvo-dark-3/50 px-1.5 rounded-full">v2.1</span>
                                </div>
                                <p className="text-xs text-asvo-muted leading-relaxed">
                                    <span className="font-semibold text-asvo-accent">Система обновлена!</span> <br/>
                                    Включен контроль доступа (RBAC).
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>


        <div className="relative z-10 bg-asvo-dark-2/80 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-2xl border border-asvo-dark-3/50 max-w-md w-full mx-4 flex flex-col items-center transition-all duration-500 hover:shadow-asvo-accent/10">

           <div className="relative w-20 h-20 bg-gradient-to-br from-asvo-accent to-teal-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300 group">
              <Cpu className="text-asvo-dark w-10 h-10 group-hover:animate-pulse" strokeWidth={1.5} />
              <div className="absolute inset-0 bg-asvo-accent opacity-20 rounded-2xl animate-ping"></div>
           </div>

           <h1 className="text-3xl font-bold text-asvo-light mb-2 tracking-tight">ASVO-QMS</h1>
           <p className="text-asvo-muted mb-8 text-center text-sm">Система управления качеством</p>

           <button
             onClick={() => auth.signinRedirect()}
             className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-asvo-accent to-teal-500 hover:from-asvo-accent-hover hover:to-teal-600 text-asvo-dark font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 group"
           >
             <ShieldCheck className="w-5 h-5 group-hover:animate-bounce" />
             <span>Войти через Keycloak</span>
           </button>

           <div className="mt-8 flex items-center gap-2 text-xs text-asvo-muted">
              <Lock size={12} />
              <span>Защищено SSO аутентификацией</span>
           </div>
        </div>


        <div className="absolute bottom-6 text-center text-xs text-asvo-muted">
          <p>© 2024 ASVO-QMS • Версия 2.1</p>
        </div>
      </div>
    );
  }


  return (
    <div className="bg-slate-100 min-h-screen flex flex-col">
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
        <AppRouter />
      </main>
    </div>
  );
});

export default App;
