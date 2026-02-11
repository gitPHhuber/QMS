import { useContext } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { Context } from "src/main";
import { adminRoutes, authRoutes, publicRoutes, qmsRoutes } from "src/routes";
import { START_ROUTE } from "src/utils/consts";
import QmsLayout from "src/components/qms/QmsLayout";

export const AppRouter: React.FC = observer(() => {
  const context = useContext(Context);
  const location = useLocation();

  if (!context) {
    throw new Error("Context must be used within a Provider");
  }

  const { user } = context;

  return (
    <div key={location.pathname} className="animate-slide-in-up w-full h-full">
      <Routes>
        {user.isAuth && user.can('admin.access') &&
          adminRoutes.map(({ path, Component }) => {
              if (path.includes('/users') && !user.can('users.manage')) return null;
              if (path.includes('/warehouse') && !user.can('warehouse.manage')) return null;
              return <Route key={path} path={path} element={<Component />} />;
          })
        }

        {/* QMS routes wrapped in QmsLayout */}
        {user.isAuth && (
          <Route path="/qms" element={<QmsLayout />}>
            {qmsRoutes.map(({ path, Component }) => (
              <Route
                key={path}
                index={path === "/qms"}
                path={path === "/qms" ? undefined : path.replace("/qms/", "")}
                element={<Component />}
              />
            ))}
          </Route>
        )}

        {user.isAuth &&
          authRoutes.map(({ path, Component }) => {
              if (path.includes('/warehouse') && !user.can('warehouse.view')) return null;
              return <Route key={path} path={path} element={<Component />} />;
          })
        }

        {publicRoutes.map(({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}

        <Route path="*" element={<Navigate to={START_ROUTE} />} />
      </Routes>
    </div>
  );
});
